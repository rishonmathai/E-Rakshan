export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      err => reject(err),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  });
}

export function watchCurrentLocation(onPosition, onError) {
  if (!navigator.geolocation) {
    onError?.(new Error("Geolocation is not supported."));
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    pos => onPosition?.({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
    err => onError?.(err),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  );
  return () => navigator.geolocation.clearWatch(id);
}

export async function getBatteryLevel() {
  try {
    if (!navigator.getBattery) return null;
    const battery = await navigator.getBattery();
    return Math.round(battery.level * 100);
  } catch {
    return null;
  }
}
