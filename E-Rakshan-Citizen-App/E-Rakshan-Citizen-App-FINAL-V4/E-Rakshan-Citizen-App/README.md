# E-Rakshan Citizen App

Responsive React + Vite citizen safety interface for E-Rakshan.

## Run

```bash
npm install
npm run dev
```

## Important browser permissions

- **Microphone:** SAI voice commands use the browser Web Speech API. On `localhost` or HTTPS, allow Microphone when prompted. If the browser does not expose speech recognition, SAI also provides a typed command fallback.
- **Location:** Live Map and current-location Weather use the browser Geolocation API. Allow location when requested.

## Live Weather

Weather is connected to the public **Open-Meteo** API. No API key is required.

Features:
- current GPS weather
- search any supported city/place
- current temperature, feels-like, humidity, wind and precipitation
- five-day forecast
- automatic refresh every 10 minutes
- animated weather presentation

## Functional navigation and offline improvements

- Map search now recenters the map and marks the searched/selected location.
- Recenter uses the actual current GPS position.
- Red-zone, hazard, shelter, road and incident layers are independently toggleable.
- Shelter Details opens a functional detail view and can launch navigation.
- Online routing evaluates available alternatives for mapped red-zone and blocked-road exposure.
- Turn instructions include distances such as turns in metres/kilometres, with localized spoken guidance.
- Cached routes can be reused offline; when no road route is cached, the app labels its fallback as offline guidance rather than presenting it as a live safe road route.
- A production service worker caches the application shell and previously viewed OpenStreetMap tiles for limited offline map access.
- Citizen API mode can load alerts, shelters, hazards, red zones, roads and incidents from the Django API.

## Maps and routing

- OpenStreetMap tiles are used by default.
- Location search uses Open-Meteo geocoding.
- Safe Navigation attempts an online OSRM route and falls back to the configured citizen API/demo route.
- The user's GPS position is kept separate from a searched location, so the current-location marker remains correct.

## Languages

English is the default. Hindi and Marathi are available in Profile & Settings. The interface and SAI voice/commands update with the selected language.

## Theme

Profile & Settings includes a Light/Dark theme toggle. The selection is persisted in local storage and applied across the application.

## Profile

Profile editing, saved locations, emergency contacts, language, theme, notification preferences, voice preferences and location preference are stored locally in the demo build.

## Backend

Set `VITE_API_BASE_URL` and `VITE_DEMO_MODE=false` in a local `.env` when connecting the Government Django API. The demo build uses local citizen-safe mock data for non-weather safety layers until the backend is connected.

## SAI

SAI supports English, Hindi and Marathi command patterns such as:

- Show alerts / अलर्ट दिखाओ / सूचना दाखवा
- Find nearest shelter / नज़दीकी आश्रय / जवळचा निवारा
- Show weather / मौसम दिखाओ / हवामान दाखवा
- Open map / नक्शा खोलो / नकाशा उघडा
- Start navigation / नेविगेशन शुरू करो / नेव्हिगेशन सुरू करा
- Emergency SOS / आपातकालीन SOS / आपत्कालीन SOS

## Responsive design

The UI is designed for phones, tablets and desktop screens, including responsive navigation, maps, cards, modals, SAI panel, weather and profile settings.
