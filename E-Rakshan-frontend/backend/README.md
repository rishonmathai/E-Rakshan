# SAI Voice Bridge

This local service adapts the working Jarvis voice architecture for SAI.

1. Run `start_sai_voice.bat` once on Windows. It creates a local Python environment and installs the voice dependencies.
2. Keep the voice bridge terminal running.
3. Run the E-Rakshan Vite app normally (`npm run dev`).
4. Open the app on `http://localhost:5173` or `http://127.0.0.1:5173`.

The bridge uses Jarvis-style `speech_recognition` + `PyAudio` microphone capture and `pyttsx3` output. The React SAI UI communicates with it through `ws://127.0.0.1:8787/ws`.

If PyAudio installation fails on a particular Python/Windows setup, install a compatible PyAudio wheel for that Python version, then rerun the batch file.
