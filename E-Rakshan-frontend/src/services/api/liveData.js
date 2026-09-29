import { api } from './client';
import { ENDPOINTS } from './endpoints';

const empty = () => ({
  type: 'FeatureCollection',
  features: [],
});

function normalizeFeatureCollection(value) {
  if (!value) return empty();

  if (value.type === 'FeatureCollection') {
    return value;
  }

  if (Array.isArray(value)) {
    return {
      type: 'FeatureCollection',
      features: value,
    };
  }

  return value.features
    ? {
        type: 'FeatureCollection',
        features: value.features,
      }
    : empty();
}

function toFeature(item, geometryKey, idKey = 'id') {
  const geometry = item?.[geometryKey] || item?.geometry || null;
  const properties = { ...item };

  delete properties[geometryKey];
  delete properties.geometry;

  return {
    type: 'Feature',
    geometry,
    properties: {
      ...properties,
      id: properties.id ?? item?.[idKey],
    },
  };
}

function layer(value, geometryKey) {
  const raw = normalizeFeatureCollection(value);

  return {
    ...raw,
    features: raw.features.map((f) =>
      f?.type === 'Feature'
        ? f
        : toFeature(f, geometryKey)
    ),
  };
}

function normalizeShelters(value) {
  const result = layer(value, 'location');

  return {
    ...result,
    features: result.features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        occupancy: Number(
          f.properties.occupancy ??
          f.properties.current_occupancy ??
          0
        ),
        capacity: Number(
          f.properties.capacity ?? 0
        ),
      },
    })),
  };
}

function normalizeSafeSites(value) {
  const result = layer(value, 'location');

  return {
    ...result,
    features: result.features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,

        // Backend stores these as 0–1; frontend displays 0–100%
        hazard_safety_score:
          Number(f.properties.hazard_safety_score ?? 0) * 100,

        capacity_score:
          Number(f.properties.capacity_score ?? 0) * 100,

        connectivity_score:
          Number(f.properties.connectivity_score ?? 0) * 100,

        terrain_score:
          Number(f.properties.terrain_score ?? 0) * 100,

        livelihood_score:
          Number(f.properties.livelihood_score ?? 0) * 100,

        services_score:
          Number(f.properties.services_score ?? 0) * 100,

        // Frontend uses `suitability`
        suitability: Number(
          f.properties.suitability ??
          f.properties.overall_suitability ??
          0
        ),
      },
    })),
  };
}

function normalizeRedzones(value) {
  const result = layer(value, 'boundary');

  return {
    ...result,
    features: result.features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,

        severity: Number(
          f.properties.severity ??
          f.properties.current_severity ??
          0
        ),

        probability: Number(
          f.properties.probability ?? 0
        ),

        population_exposed: Number(
          f.properties.population_exposed ?? 0
        ),
      },
    })),
  };
}

function normalizeIncidents(value) {
  const result = layer(value, 'location');

  return {
    ...result,
    features: result.features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,

        // Backend uses `incident_type`; frontend map uses `type`
        type:
          f.properties.type ??
          f.properties.incident_type ??
          'Unknown Incident',
      },
    })),
  };
}

export async function loadLiveDistrict(districtId) {
  let backendDistrictId = districtId;

  if (!/^\d+$/.test(String(districtId))) {
    const districts = await api.get(ENDPOINTS.districts);

    const list = Array.isArray(districts)
      ? districts
      : (districts.results || []);

    const wanted = String(districtId).toLowerCase();

    const match = list.find((d) =>
      [d.code, d.slug, d.name]
        .filter(Boolean)
        .some(
          (v) => String(v).toLowerCase() === wanted
        )
    );

    if (!match) {
      throw new Error(
        `District not found: ${districtId}`
      );
    }

    backendDistrictId = match.id;
  }

  const data = await api.get(
    ENDPOINTS.gisLayers(backendDistrictId)
  );

  return {
    habitations: layer(
      data.habitations,
      'location'
    ),

    redzones: normalizeRedzones(
      data.redzones
    ),

    shelters: normalizeShelters(
      data.shelters
    ),

    safeSites: normalizeSafeSites(
      data.safe_sites
    ),

    roads: layer(
      data.roads,
      'path'
    ),

    incidents: normalizeIncidents(
      data.incidents
    ),

    hazardEvents: layer(
      data.hazard_events,
      'location'
    ),
  };
}

export async function loadLiveWeather(
  lat = 11.605,
  lon = 76.083
) {
  return api.get(
    ENDPOINTS.weather(lat, lon)
  );
}

export async function loadLiveDamini() {
  return api.get(
    ENDPOINTS.damini
  );
}