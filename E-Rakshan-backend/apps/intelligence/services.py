def clamp01(x):
    return max(0.0, min(1.0, float(x)))

def calculate_hazard(h):
    rainfall = clamp01(h.analysis.get("rainfall", 0))
    slope = clamp01(h.slope_deg / 45)
    river = clamp01(1 - h.dist_river_km / 5)
    drainage = clamp01(h.drainage_index)
    elevation = clamp01(1 - h.elevation_m / 1000)
    history = clamp01(h.hist_events / 5)
    score = 0.25*rainfall + 0.20*slope + 0.20*river + 0.10*drainage + 0.10*elevation + 0.15*history
    return round(score, 4)

def calculate_vulnerability(h):
    vals = [
        clamp01(h.elderly_pct / 100),
        clamp01(h.children_pct / 100),
        clamp01(h.disabled_pct / 100),
        clamp01(h.fragile_housing_pct / 100),
        clamp01(h.no_vehicle_pct / 100),
        clamp01(h.dist_hospital_km / 20),
    ]
    return round(sum(vals) / len(vals), 4)

def calculate_exposure(h):
    return clamp01(h.population / max(1, h.analysis.get("district_population_reference", 5000)))

def recalculate_habitation(h):
    hazard = calculate_hazard(h)
    vuln = calculate_vulnerability(h)
    exposure = calculate_exposure(h)
    priority = round(0.45*hazard + 0.35*vuln + 0.20*exposure, 4)
    band = "critical" if priority >= .8 else "high" if priority >= .6 else "moderate" if priority >= .4 else "low"
    h.hazard_score, h.vulnerability_score, h.exposure_score = hazard, vuln, exposure
    h.priority_score, h.risk_band = priority, band
    h.analysis = {
        **h.analysis,
        "factors": {
            "hazard": hazard, "vulnerability": vuln, "exposure": exposure,
            "priority": priority
        },
        "formula": "0.45*hazard + 0.35*vulnerability + 0.20*exposure",
    }
    h.save(update_fields=["hazard_score","vulnerability_score","exposure_score","priority_score","risk_band","analysis","updated_at"])
    return h

def explain_habitation(h):
    return {
        "habitation_id": h.id,
        "name": h.name,
        "hazard_score": h.hazard_score,
        "vulnerability_score": h.vulnerability_score,
        "exposure_score": h.exposure_score,
        "priority_score": h.priority_score,
        "band": h.risk_band,
        "is_isolated": h.is_isolated,
        "factors": h.analysis.get("factors", {}),
        "formula": h.analysis.get("formula"),
    }

def situation_summary(district):
    from apps.habitations.models import Habitation
    from apps.shelters.models import Shelter
    if not district: return {"message":"No district selected"}
    hs = Habitation.objects.filter(district=district)
    sh = Shelter.objects.filter(district=district)
    return {
        "district": district.name,
        "critical_habitations": hs.filter(priority_score__gte=.8).count(),
        "highest_priority": hs.order_by("-priority_score").values("id","name","priority_score","risk_band").first(),
        "free_beds": sum(max(0,s.capacity-s.current_occupancy) for s in sh),
        "isolated_habitations": hs.filter(is_isolated=True).count(),
    }
