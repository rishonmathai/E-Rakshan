# E-Rakshan Citizen App — Latest Enhancement Pack

## Added / enhanced
- Google Maps-style navigation arrow states: straight, left, right, U-turn, roundabout and arrival.
- Explicit **Stop Navigating** controls in active navigation.
- Shared location search logic for Live Map and Navigation.
- Online geocoding results are cached locally so previously searched locations remain searchable offline.
- Offline search now uses cached geocoding, saved locations, synchronized shelters and hazard/road/incident names.
- Offline Safe Pack with cached map tiles, synchronized safety data, saved routes, SAI/SOS readiness and quick actions.
- Offline map preparation requests a local tile cache around the current location while online.
- Offline mode now keeps Alerts, Shelters, Map, Navigation, Guidelines, SOS, Family and SAI entry points active.
- Premium offline dashboard with cache counts, saved-route count, cached-location count and preparation timestamp.
- Enhanced responsive splash screen with E-Rakshan branding, safety feature cards and animated entrance.
- Safety guideline accordions contain richer, situation-specific guidance.
- SAI can answer general safety questions through the configured AI endpoint when online, with citizen-safe offline fallback responses when no AI endpoint/network is available.
- Responsive animations/transitions added for the new areas.
- Service-worker cache version bumped so the new offline tile behavior can update cleanly.

## Preserved
- Existing E-Rakshan colors, responsive layout, routes, alerts, shelters, SOS, family, profile, weather and other existing features.
- Existing OpenStreetMap/Leaflet map is still the map used by Offline Mode.
- No fake live traffic data was introduced.
- Arbitrary new places can still be found online through the existing geocoder; offline search can only identify locations that were previously cached/saved or present in synchronized citizen data.
