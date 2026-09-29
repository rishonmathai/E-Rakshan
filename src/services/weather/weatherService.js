const WEATHER_CODES = {
  0: ['Clear sky','☀️'], 1:['Mainly clear','🌤️'],2:['Partly cloudy','⛅'],3:['Overcast','☁️'],
  45:['Fog','🌫️'],48:['Rime fog','🌫️'],51:['Light drizzle','🌦️'],53:['Drizzle','🌦️'],55:['Heavy drizzle','🌧️'],
  61:['Light rain','🌦️'],63:['Rain','🌧️'],65:['Heavy rain','🌧️'],66:['Freezing rain','🌧️'],67:['Heavy freezing rain','🌧️'],
  71:['Light snow','🌨️'],73:['Snow','❄️'],75:['Heavy snow','❄️'],77:['Snow grains','🌨️'],
  80:['Rain showers','🌦️'],81:['Rain showers','🌧️'],82:['Heavy rain showers','⛈️'],85:['Snow showers','🌨️'],86:['Heavy snow showers','❄️'],
  95:['Thunderstorm','⛈️'],96:['Thunderstorm with hail','⛈️'],99:['Thunderstorm with heavy hail','⛈️']
};
export function weatherCodeInfo(code){ return WEATHER_CODES[code] || ['Unknown conditions','🌡️']; }

export async function fetchWeather(lat,lng){
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`;
  const r=await fetch(url); if(!r.ok) throw new Error('Weather service unavailable'); return r.json();
}

export async function geocodePlace(query){
  const clean = query.trim();
  if(!clean) return [];

  // First try the fast Open-Meteo geocoder with the exact query.
  const openMeteo = async (name) => {
    const url=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=10&language=en&format=json`;
    const r=await fetch(url);
    if(!r.ok) throw new Error('Location search failed');
    const data=await r.json();
    return (data.results||[]).map(x=>({
      id:`om-${x.id}`,
      name:x.name,
      admin:x.admin1,
      country:x.country,
      lat:x.latitude,
      lng:x.longitude,
      type:x.feature_code || '',
      zoom:/state|province|admin/i.test(x.feature_code||'') ? 6 : /country/i.test(x.feature_code||'') ? 5 : 12
    }));
  };

  let results=[];
  try { results=await openMeteo(clean); } catch {}

  // Only use the country suffix fallback when the exact search returns nothing.
  if(!results.length && !/,/.test(clean)){
    try { results=await openMeteo(`${clean}, India`); } catch {}
  }

  // If the geocoder still cannot resolve the place, use Nominatim as a second
  // provider. The returned bounding box lets the map fit a state/region instead
  // of zooming too deeply into an arbitrary point.
  if(!results.length){
    try{
      const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&q=${encodeURIComponent(clean)}`;
      const r=await fetch(url,{headers:{Accept:'application/json'}});
      if(r.ok){
        const data=await r.json();
        results=data.map(x=>({
          id:`nom-${x.place_id}`,
          name:x.name || x.display_name?.split(',')[0] || clean,
          admin:x.address?.state || x.address?.county,
          country:x.address?.country,
          lat:Number(x.lat),
          lng:Number(x.lon),
          bbox:Array.isArray(x.boundingbox)?x.boundingbox.map(Number):null,
          zoom:/state|region/i.test(x.type||'') ? 6 : /country/i.test(x.type||'') ? 5 : 12
        }));
      }
    }catch{}
  }

  return results.filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lng));
}

export async function reverseGeocode(lat,lng){
  const url=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=10&addressdetails=1`;
  try { const r=await fetch(url,{headers:{Accept:'application/json'}}); if(!r.ok) return null; const data=await r.json(); const a=data.address||{}; return {name:a.city||a.town||a.village||a.municipality||a.county||a.state||'Current location',admin:a.state,country:a.country}; } catch { return null; }
}
