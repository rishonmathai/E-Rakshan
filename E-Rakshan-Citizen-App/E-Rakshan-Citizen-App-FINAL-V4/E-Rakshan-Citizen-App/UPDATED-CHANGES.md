# E-Rakshan Citizen App — Latest Update

This update keeps the existing Citizen App structure and adds only the requested enhancements.

## Navigation
- Live GPS starting point and arbitrary geocoded destination.
- Current-location and destination markers on the map.
- Live road routing using OpenStreetMap routing services.
- Car, motorcycle, bicycle and walking route estimates where the routing provider supports them.
- Route distance, ETA, turn-by-turn steps and map turn markers.
- Automatic route refresh during active navigation.
- Google Maps live-traffic directions shortcut.
- Google Street View shortcut for road-level visual context.
- Route safety exposure against the existing hazard/red-zone/blocked-road layers.
- Offline/cache fallback retained.

## Safe Shelters
- Current GPS-based nearby shelter lookup.
- Government-synchronized shelter data remains separate from mapped OpenStreetMap emergency shelters.
- Additional nearby shelter facilities can be discovered dynamically.
- Unverified mapped facilities are clearly labelled and are not presented as government-designated shelters.

## Safety Guidelines
- Existing Before/During/After structure retained.
- More situation-specific guidance.
- Natural-language safety question input.
- Configurable AI endpoint via `VITE_AI_API_URL`.
- Safe local fallback when no AI endpoint is configured.

## Emergency SOS
- Device battery percentage and charging state where browser APIs permit.
- GPS accuracy, network status and timestamp.
- Full emergency-detail manual sharing.
- Complete emergency payload copy option.
- Existing SOS dispatch/live-location flow retained.

## Family Safety Circle
- Start/stop location sharing from the primary device.
- Live GPS updates while sharing is active on that device.
- Latest-location share-link generation.
- Manual copy/share controls.
- Public Family Safety share page.
- Backend-ready note for true continuous cross-device live sharing.

## Profile
- Full citizen profile editing: name, DOB, gender, blood group, phone, address, emergency contact, relation, emergency number and medical/accessibility notes.
- Profile data persists through the existing local account store.

## Responsiveness & Motion
- New controls and cards are responsive for mobile, tablet and desktop.
- Existing animation/transition system retained and extended for the new controls.
