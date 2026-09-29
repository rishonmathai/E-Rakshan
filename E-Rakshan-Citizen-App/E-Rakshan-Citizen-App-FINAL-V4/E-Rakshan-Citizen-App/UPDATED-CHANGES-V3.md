# E-Rakshan Citizen App — V3 Updates

- Replaced SAI floating/panel icon with the supplied SAI artwork (`public/assets/sai-icon.png`).
- Offline Mode is now an in-page workspace: Alerts, Map, Shelters, Navigation, SOS, Guidelines and Family Safety open inside the Offline screen instead of redirecting away.
- Expanded offline tile preparation to zoom levels 11–16 and larger local tile radius.
- Added a premium offline safety feature grid and clearer cached-data status.
- Navigation now has a dedicated Road Map / Street View visual workspace. The Road Map uses the same Leaflet/OpenStreetMap layer and keeps the full mapped road network visible.
- Optional in-app Google Street View rendering is supported through `VITE_GOOGLE_MAPS_EMBED_KEY`; otherwise the app opens real Google Street View in a new tab rather than faking street imagery.
- Added Stop Navigating and preserved live GPS/rerouting/voice controls.
- Sidebar now supports drag-to-resize on desktop and drag/swipe interaction on smaller screens while preserving the existing menu design. Width is remembered locally.
- Splash screen upgraded with E-Rakshan mark, animated progress, status indicator, feature cards and responsive presentation.
- Responsive rules added for all new UI.

## Important offline limitation
Offline road-level turn-by-turn routing requires route data or a routing engine cached on the device. The app continues to use previously cached/saved routes offline; arbitrary brand-new road routes cannot be truthfully calculated without the required offline road graph.
