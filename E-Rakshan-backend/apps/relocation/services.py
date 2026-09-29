import heapq

from .models import RelocationPlan, RelocationAssignment
from apps.habitations.models import Habitation
from apps.shelters.models import Shelter
from apps.infrastructure.models import Road


def _build_road_graph(district_id):
    """
    Build a small habitation-name road graph from the imported demo roads.

    Each road connects all habitation names listed in connects_habitations.
    Risk is derived from road status and flood depth.
    """
    roads = Road.objects.filter(district_id=district_id)

    graph = {}

    for road in roads:
        nodes = [
            str(name).strip()
            for name in (road.connects_habitations or [])
            if str(name).strip()
        ]

        if len(nodes) < 2:
            continue

        status = (road.status or "open").lower()

        if status == "blocked":
            base_risk = 1.0
        elif status == "caution":
            base_risk = 0.5
        else:
            base_risk = 0.0

        flood_risk = min(
            float(road.flood_depth_cm or 0) / 100.0,
            1.0,
        )

        edge_risk = min(
            1.0,
            max(base_risk, flood_risk),
        )

        for i, start in enumerate(nodes):
            for end in nodes[i + 1:]:
                graph.setdefault(start, []).append(
                    {
                        "node": end,
                        "risk": edge_risk,
                        "blocked": status == "blocked",
                        "road_id": road.id,
                    }
                )
                graph.setdefault(end, []).append(
                    {
                        "node": start,
                        "risk": edge_risk,
                        "blocked": status == "blocked",
                        "road_id": road.id,
                    }
                )

    return graph


def _route_risk(graph, source_name, target_name):
    """
    Find a lowest-risk road path between two habitation nodes.

    Returns:
        route_risk: 0..1
        blocked_route_encountered: bool
    """
    if not source_name or not target_name:
        return 0.0, False

    if source_name == target_name:
        return 0.0, False

    if source_name not in graph or target_name not in graph:
        return 0.0, False

    queue = [(0.0, 0, 0, source_name)]
    best = {
        source_name: (0.0, 0, 0)
    }

    while queue:
        total_risk, blocked_count, edge_count, node = heapq.heappop(queue)

        if node == target_name:
            if edge_count == 0:
                return 0.0, False

            return (
                round(total_risk / edge_count, 4),
                blocked_count > 0,
            )

        for edge in graph.get(node, []):
            next_node = edge["node"]
            next_risk = total_risk + edge["risk"]
            next_blocked = blocked_count + (
                1 if edge["blocked"] else 0
            )
            next_count = edge_count + 1

            candidate = (
                next_risk,
                next_blocked,
                next_count,
            )

            if (
                next_node not in best
                or candidate < best[next_node]
            ):
                best[next_node] = candidate
                heapq.heappush(
                    queue,
                    (
                        next_risk,
                        next_blocked,
                        next_count,
                        next_node,
                    ),
                )

    return 1.0, True


def _nearest_habitation_name(habitation_names, location):
    """Map a shelter location to the nearest known habitation."""
    if not habitation_names:
        return None

    return min(
        habitation_names,
        key=lambda h: location.distance(h.location),
    ).name


def solve_relocation(
    sources,
    max_distance_km=15,
    utilisation_cap=0.95,
    allow_overflow=False,
    weights=None,
    source_demands=None,
):
    weights = weights or {
        "distance": 0.4,
        "routeRisk": 0.3,
        "crowding": 0.2,
        "medical": 0.1,
    }

    source_demands = source_demands or {}

    shelters = list(
        Shelter.objects.filter(
            district_id=sources[0].district_id,
            operational=True,
        )
    )

    plan = RelocationPlan.objects.create(
        total_population=sum(
            int(
                source_demands.get(
                    str(h.id),
                    h.population,
                )
            )
            for h in sources
        )
    )

    remaining = {
        s.id: max(
            0,
            int(s.capacity * utilisation_cap)
            - s.current_occupancy,
        )
        for s in shelters
    }

    road_graph = _build_road_graph(
        sources[0].district_id
    )

    district_habitations = list(
        Habitation.objects.filter(
            district_id=sources[0].district_id
        )
    )

    shelter_nodes = {
        s.id: _nearest_habitation_name(
            district_habitations,
            s.location,
        )
        for s in shelters
    }

    assigned = 0
    warnings = []
    objective_cost = 0.0

    def build_candidates(h, include_farther_shelters=False):
        candidates = []

        requires_medical = bool(
            h.analysis.get("requires_medical")
        )

        for s in shelters:
            if remaining[s.id] <= 0:
                continue

            if (
                requires_medical
                and not s.medical_support
            ):
                continue

            dist = (
                h.location.distance(s.location)
                * 111.32
            )

            if (
                not include_farther_shelters
                and dist > max_distance_km
            ):
                continue

            distance_score = min(
                dist / max_distance_km,
                1,
            )

            route_risk, blocked_route = _route_risk(
                road_graph,
                h.name,
                shelter_nodes.get(s.id),
            )

            crowding_score = (
                s.current_occupancy
                / max(1, s.capacity)
            )

            medical_score = 1 if (
                requires_medical
                and not s.medical_support
            ) else 0

            cost = (
                weights.get("distance", 0.4)
                * distance_score
            )

            cost += (
                weights.get("routeRisk", 0.3)
                * route_risk
            )

            cost += (
                weights.get("crowding", 0.2)
                * crowding_score
            )

            cost += (
                weights.get("medical", 0.1)
                * medical_score
            )

            candidates.append(
                (
                    cost,
                    s,
                    dist,
                    route_risk,
                    blocked_route,
                )
            )

        candidates.sort(
            key=lambda x: x[0]
        )

        return candidates

    for h in sorted(
        sources,
        key=lambda x: x.priority_score,
        reverse=True,
    ):
        demand = int(
            source_demands.get(
                str(h.id),
                h.population,
            )
        )

        # Pass 1: preferred shelters within the configured
        # maximum travel distance.
        candidates = build_candidates(
            h,
            include_farther_shelters=False,
        )

        for (
            cost,
            s,
            dist,
            route_risk,
            blocked_route,
        ) in candidates:
            if demand <= 0:
                break

            alloc = min(
                demand,
                remaining[s.id],
            )

            if alloc <= 0:
                continue

            RelocationAssignment.objects.create(
                plan=plan,
                source_habitation=h,
                target_shelter=s,
                population_allocated=alloc,
                distance_km=dist,
                route_risk=route_risk,
                blocked_route_encountered=blocked_route,
                overflow_engaged=False,
            )

            demand -= alloc
            assigned += alloc
            remaining[s.id] = max(
                0,
                remaining[s.id] - alloc,
            )

            objective_cost += (
                cost * alloc
            )

        # Pass 2: if preferred shelters are exhausted, use any
        # remaining eligible district shelter capacity before overflow.
        if demand:
            candidates = build_candidates(
                h,
                include_farther_shelters=True,
            )

            for (
                cost,
                s,
                dist,
                route_risk,
                blocked_route,
            ) in candidates:
                if demand <= 0:
                    break

                alloc = min(
                    demand,
                    remaining[s.id],
                )

                if alloc <= 0:
                    continue

                RelocationAssignment.objects.create(
                    plan=plan,
                    source_habitation=h,
                    target_shelter=s,
                    population_allocated=alloc,
                    distance_km=dist,
                    route_risk=route_risk,
                    blocked_route_encountered=blocked_route,
                    overflow_engaged=False,
                )

                demand -= alloc
                assigned += alloc
                remaining[s.id] = max(
                    0,
                    remaining[s.id] - alloc,
                )

                objective_cost += (
                    cost * alloc
                )

        # Pass 3: only use emergency overflow when explicitly enabled
        # and no usable shelter capacity remains.
        if demand and allow_overflow:
            overflow_candidates = []

            requires_medical = bool(
                h.analysis.get("requires_medical")
            )

            for s in shelters:
                if (
                    requires_medical
                    and not s.medical_support
                ):
                    continue

                dist = (
                    h.location.distance(s.location)
                    * 111.32
                )

                distance_score = min(
                    dist / max_distance_km,
                    1,
                )

                route_risk, blocked_route = _route_risk(
                    road_graph,
                    h.name,
                    shelter_nodes.get(s.id),
                )

                crowding_score = (
                    s.current_occupancy
                    / max(1, s.capacity)
                )

                medical_score = 1 if (
                    requires_medical
                    and not s.medical_support
                ) else 0

                cost = (
                    weights.get("distance", 0.4)
                    * distance_score
                )
                cost += (
                    weights.get("routeRisk", 0.3)
                    * route_risk
                )
                cost += (
                    weights.get("crowding", 0.2)
                    * crowding_score
                )
                cost += (
                    weights.get("medical", 0.1)
                    * medical_score
                )

                overflow_candidates.append(
                    (
                        cost,
                        s,
                        dist,
                        route_risk,
                        blocked_route,
                    )
                )

            overflow_candidates.sort(
                key=lambda x: x[0]
            )

            if overflow_candidates:
                (
                    cost,
                    s,
                    dist,
                    route_risk,
                    blocked_route,
                ) = overflow_candidates[0]

                alloc = demand

                RelocationAssignment.objects.create(
                    plan=plan,
                    source_habitation=h,
                    target_shelter=s,
                    population_allocated=alloc,
                    distance_km=dist,
                    route_risk=route_risk,
                    blocked_route_encountered=blocked_route,
                    overflow_engaged=True,
                )

                demand -= alloc
                assigned += alloc

                objective_cost += (
                    cost * alloc
                )

                warnings.append(
                    f"{h.name}: {alloc} people assigned using "
                    f"emergency overflow at {s.name}"
                )

        if demand:
            warnings.append(
                f"{h.name}: "
                f"{demand} people unassigned"
            )

    plan.assigned_population = assigned
    plan.unassigned_population = (
        plan.total_population - assigned
    )

    plan.status = (
        "feasible"
        if plan.unassigned_population == 0
        else "shortfall"
    )

    plan.objective_cost = round(
        objective_cost,
        4,
    )

    plan.warnings = warnings

    plan.save()

    return plan
