import { useCallback, useEffect, useRef, useState } from 'react';
import { solveRelocation } from '../utils/optimizer';
import { api, DEMO_MODE } from '../services/api/client';

function normalizeBackendResult(data, payload) {
  const sourceMap = Object.fromEntries(
    (payload.sources || []).map((s) => [String(s.id), s])
  );

  const shelterMap = Object.fromEntries(
    (payload.shelters || []).map((s) => [String(s.id), s])
  );

  const assignments = (data.assignments || []).map((a) => {
    const sourceId = String(a.source_habitation);
    const shelterId = String(a.target_shelter);
    const source = sourceMap[sourceId] || {};
    const shelter = shelterMap[shelterId] || {};

    return {
      sourceId,
      sourceName: source.name || sourceId,
      shelterId,
      shelterName: shelter.name || shelterId,
      population: Number(a.population_allocated || 0),
      distanceKm: Number(a.distance_km || 0),
      routeRisk: Number(a.route_risk || 0),
      blockedRoute: Boolean(a.blocked_route_encountered),
      overflow: Boolean(a.overflow_engaged),
      medicalPenalty: false,
    };
  });

  const trace =
    Array.isArray(data.convergence_trace) && data.convergence_trace.length
      ? data.convergence_trace.map(Number)
      : [Number(data.objective_cost || 0)];

  const totalPop = (payload.sources || []).reduce(
    (sum, source) => sum + Number(source.population || 0),
    0
  );

  const assignedPop = assignments.reduce(
    (sum, assignment) => sum + Number(assignment.population || 0),
    0
  );

  const unassignedPop = Math.max(
    0,
    Number(data.unassigned_population ?? (totalPop - assignedPop))
  );

  const shelterLoads = Object.fromEntries(
    (payload.shelters || []).map((shelter) => [
      String(shelter.id),
      Number(shelter.load ?? shelter.occupancy ?? 0),
    ])
  );

  assignments.forEach((assignment) => {
    shelterLoads[assignment.shelterId] =
      (shelterLoads[assignment.shelterId] || 0) +
      Number(assignment.population || 0);
  });

  const shelterCapacities = Object.fromEntries(
    (payload.shelters || []).map((shelter) => [
      String(shelter.id),
      Number(shelter.capacity || 0),
    ])
  );

  const maxCrowd = Math.max(
    0,
    ...(payload.shelters || []).map((shelter) => {
      const capacity = shelterCapacities[String(shelter.id)];
      const load = shelterLoads[String(shelter.id)] || 0;
      return capacity > 0 ? load / capacity : 0;
    })
  );

  const avgDist = assignedPop
    ? assignments.reduce(
        (sum, assignment) =>
          sum +
          Number(assignment.distanceKm || 0) *
            Number(assignment.population || 0),
        0
      ) / assignedPop
    : 0;

  const assignedBySource = Object.fromEntries(
    (payload.sources || []).map((source) => [String(source.id), 0])
  );

  assignments.forEach((assignment) => {
    assignedBySource[assignment.sourceId] =
      (assignedBySource[assignment.sourceId] || 0) +
      Number(assignment.population || 0);
  });

  const unassigned =
    Array.isArray(data.unassigned) && data.unassigned.length
      ? data.unassigned.map((item) => ({
          sourceId: String(item.source_habitation ?? item.sourceId ?? ''),
          sourceName:
            item.source_name ||
            item.sourceName ||
            sourceMap[String(item.source_habitation ?? item.sourceId)]?.name ||
            String(item.source_habitation ?? item.sourceId ?? 'Unknown'),
          population: Number(
            item.population ?? item.unassigned_population ?? 0
          ),
          reason:
            item.reason ||
            'Capacity or route constraint prevented full allocation',
        }))
      : (payload.sources || [])
          .map((source) => {
            const sourceId = String(source.id);
            const remaining =
              Number(source.population || 0) -
              Number(assignedBySource[sourceId] || 0);

            if (remaining <= 0) return null;

            return {
              sourceId,
              sourceName: source.name || sourceId,
              population: remaining,
              reason:
                'Capacity or route constraint prevented full allocation',
            };
          })
          .filter(Boolean);

  return {
    status: data.status || (unassignedPop > 0 ? 'shortfall' : 'feasible'),
    objective: Number(data.objective_cost || 0).toFixed(3),
    iterations: trace,
    assignments,
    unassigned,
    totals: {
      totalPop,
      assignedPop,
      unassignedPop,
      avgDist,
      maxCrowd,
    },
    warnings: data.warnings || [],
  };
}

export function useSolver() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [revealed, setRevealed] = useState([]);
  const [progress, setProgress] = useState(0);

  const timer = useRef(null);

  const run = useCallback(async (payload) => {
    setRunning(true);
    setResult(null);
    setRevealed([]);
    setProgress(0);

    clearInterval(timer.current);

    if (!DEMO_MODE) {
      try {
        const data = await api.post('/relocation/solve/', {
          sources: (payload.sources || []).map((s) => s.id),
          source_populations: Object.fromEntries(
            (payload.sources || []).map((s) => [
              String(s.id),
              Number(s.population || 0),
            ])
          ),
          max_distance_km: Number(
            payload.constraints?.maxDistanceKm ?? 15
          ),
          utilisation_cap: Number(
            payload.constraints?.utilisationCap ?? 0.95
          ),
          allow_overflow: Boolean(
            payload.constraints?.allowOverflow
          ),
          weights: payload.weights,
        });

        const res = normalizeBackendResult(data, payload);
        const trace = res.iterations.length ? res.iterations : [0];
        let i = 0;

        timer.current = setInterval(() => {
          i += Math.max(1, Math.ceil(trace.length / 22));
          setRevealed(trace.slice(0, i));
          setProgress(
            Math.min(100, Math.round((i / trace.length) * 100))
          );

          if (i >= trace.length) {
            clearInterval(timer.current);
            setResult(res);
            setRunning(false);
          }
        }, 90);

        return res;
      } catch (error) {
        setRunning(false);
        throw error;
      }
    }

    const res = solveRelocation(payload);
    const trace = res.iterations.length ? res.iterations : [0];
    let i = 0;

    timer.current = setInterval(() => {
      i += Math.max(1, Math.ceil(trace.length / 22));
      setRevealed(trace.slice(0, i));
      setProgress(
        Math.min(100, Math.round((i / trace.length) * 100))
      );

      if (i >= trace.length) {
        clearInterval(timer.current);
        setResult(res);
        setRunning(false);
      }
    }, 90);

    return res;
  }, []);

  useEffect(() => {
    return () => clearInterval(timer.current);
  }, []);

  const reset = useCallback(() => {
    clearInterval(timer.current);
    setResult(null);
    setRevealed([]);
    setProgress(0);
    setRunning(false);
  }, []);

  return {
    run,
    reset,
    running,
    result,
    revealed,
    progress,
  };
}