import { useEffect, useMemo, useState } from 'react';
import { CloudRain, LocateFixed, Search, Wind, Droplets, Thermometer, RefreshCw, MapPin, X, Gauge, Umbrella, CalendarDays } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import { useApp } from '../../context/AppContext';
import { fetchWeather, geocodePlace, reverseGeocode, weatherCodeInfo } from '../../services/weather/weatherService';
import { getCurrentLocation } from '../../services/location/locationService';
import { t } from '../../i18n';

export default function Weather(){
  const {location,setLocation,setToast,store}=useApp(); const lang=store.settings.language;
  const [place,setPlace]=useState(null); const [data,setData]=useState(null); const [placeName,setPlaceName]=useState('');
  const [q,setQ]=useState(''); const [results,setResults]=useState([]); const [loading,setLoading]=useState(false); const [locating,setLocating]=useState(false); const [error,setError]=useState('');
  const coords=place||location||{lat:19.2183,lng:73.1645};
  const load=async(lat=coords.lat,lng=coords.lng)=>{setLoading(true);setError('');try{const weather=await fetchWeather(lat,lng);setData(weather);if(!place){const name=await reverseGeocode(lat,lng);setPlaceName(name?.name?`${name.name}${name.admin?', '+name.admin:''}`:'Current location');}}catch(e){setError('Live weather is unavailable right now. Check your internet connection.');setToast('Live weather could not be loaded.');}finally{setLoading(false)}};
  useEffect(()=>{load();const id=setInterval(()=>load(),10*60*1000);return()=>clearInterval(id)},[place?.lat,place?.lng,location?.lat,location?.lng]);
  const locate=async()=>{setLocating(true);try{const p=await getCurrentLocation();setLocation(p);setPlace(null);setQ('');setToast('Current GPS location selected.');}catch{setToast('Location permission was denied or unavailable. Allow GPS access and try again.')}finally{setLocating(false)}};
  const search=async()=>{if(q.trim().length<2){setToast('Type at least 2 characters to search.');return}try{setResults(await geocodePlace(q.trim()));}catch{setToast('Location search failed. Check your internet connection.')}};
  const choose=r=>{setPlace(r);setPlaceName(`${r.name}${r.admin?', '+r.admin:''}`);setResults([]);setToast(`Weather location changed to ${r.name}.`)};
  const current=data?.current; const info=current?weatherCodeInfo(current.weather_code):['Loading…','🌤️'];
  const daily=useMemo(()=>data?.daily?.time?.map((d,i)=>({date:d,code:data.daily.weather_code[i],max:data.daily.temperature_2m_max[i],min:data.daily.temperature_2m_min[i],rain:data.daily.precipitation_probability_max[i]}))||[],[data]);
  const locationLabel=placeName||(place?'Selected place':'Current location');
  return <div className="page weather-page"><PageHeader title={t('Weather',lang)} subtitle="Live conditions and forecast" right={<button className="icon-btn" onClick={()=>load()} disabled={loading} title="Refresh weather"><RefreshCw className={loading?'spin':''}/></button>}/>
    <div className="weather-search"><div className="search-box"><Search/><input placeholder={t('Search any city or place…',lang)} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}/>{q&&<button onClick={()=>{setQ('');setResults([])}}><X/></button>}</div><button className="primary-btn" onClick={locate} disabled={locating}><LocateFixed/>{locating?'Locating…':t('My location',lang)}</button></div>
    {results.length>0&&<div className="weather-results">{results.map(r=><button key={`${r.id}-${r.lat}`} onClick={()=>choose(r)}><MapPin/><span><b>{r.name}</b><small>{[r.admin,r.country].filter(Boolean).join(', ')}</small></span></button>)}</div>}
    {error&&<div className="weather-error"><CloudRain/><span>{error}</span><button onClick={()=>load()}>Retry</button></div>}
    <section className="weather-current"><div className="weather-orb"><span>{info[1]}</span><i/></div><div className="weather-place"><span><MapPin size={14}/> {locationLabel}</span><strong>{current?Math.round(current.temperature_2m):'—'}°</strong><b>{info[0]}</b><small>Feels like {current?Math.round(current.apparent_temperature):'—'}° · Updated {current?.time?new Date(current.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}):'—'}</small></div><div className="weather-meta"><div><Droplets/><b>{current?.relative_humidity_2m??'—'}%</b><small>Humidity</small></div><div><Wind/><b>{current?Math.round(current.wind_speed_10m):'—'} km/h</b><small>Wind</small></div><div><Umbrella/><b>{current?Math.round((current.rain??0)*10)/10:'—'} mm</b><small>Rain</small></div><div><Gauge/><b>{current?Math.round(current.precipitation??0):'—'} mm</b><small>Precipitation</small></div></div></section>
    <div className="weather-source-row"><span><span className="live-dot"/> Live API data</span><span>Open-Meteo · automatic refresh every 10 min</span></div>
    <h3 className="settings-title">{t('5-day forecast',lang)}</h3><div className="forecast-row">{daily.map(x=>{const i=weatherCodeInfo(x.code);return <article key={x.date}><b>{new Date(x.date+'T12:00:00').toLocaleDateString([], {weekday:'short'})}</b><span>{i[1]}</span><strong>{Math.round(x.max)}° <small>{Math.round(x.min)}°</small></strong><small>{x.rain??0}% rain</small></article>})}</div>
    <div className="weather-note"><Thermometer/><p><b>{t('Weather source',lang)}</b><br/>Current conditions and forecast are fetched from the public Open-Meteo API. Weather is informational; follow verified emergency alerts for safety decisions.</p></div>
  </div>;
}
