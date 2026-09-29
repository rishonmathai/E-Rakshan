import { useEffect, useState } from 'react';
import { Bell, Map, ShieldCheck, Siren, CloudRain, Construction, BookOpen, LocateFixed, Wifi, WifiOff, RefreshCw, AlertTriangle, Navigation, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getCurrentLocation } from '../../services/location/locationService';
import { fetchWeather, weatherCodeInfo, reverseGeocode } from '../../services/weather/weatherService';
import StatusPill from '../../components/common/StatusPill';
import PageHeader from '../../components/common/PageHeader';
import { t } from '../../i18n';

const hav=(a,b)=>{const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLon=(b.lng-a.lng)*Math.PI/180;const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));};
export default function Home(){
 const {store,alerts,mapData,location,setLocation,sync,setToast,online}=useApp(); const navigate=useNavigate(); const [locating,setLocating]=useState(false); const [weather,setWeather]=useState(null); const [placeName,setPlaceName]=useState('');
 const lang=store.settings.language; const currentAlert=alerts[0]||{severity:'Advisory',message:'No active alerts',location:'Your area',time:'Just now'};
 const locate=async()=>{setLocating(true);try{const p=await getCurrentLocation();setLocation(p);const n=await reverseGeocode(p.lat,p.lng);setPlaceName(n?.name||'Current location');setToast('Current location detected and weather updated.');}catch{setToast('Location unavailable. Choose a location manually on the map.')}finally{setLocating(false)}};
 useEffect(()=>{if(store.settings.location&&!location)locate();},[]);
 useEffect(()=>{if(location){fetchWeather(location.lat,location.lng).then(setWeather).catch(()=>{});}},[location?.lat,location?.lng]);
 const nearby=location ? mapData.redZones.filter(z=>hav(location,z)<3).length : mapData.redZones.length;
 const blocked=mapData.roads.filter(r=>String(r.status).toLowerCase()==='blocked').length;
 const wi=weather?.current?weatherCodeInfo(weather.current.weather_code):null;
 const risk=currentAlert.severity==='Critical'||nearby>0?'High risk — stay alert':'Monitor conditions';
 return <div className="page"><PageHeader title={t('Stay Safe Today',lang)} subtitle={t('Good morning, Citizen',lang)} back={false} right={<StatusPill tone={online?'green':'orange'}>{online?<><Wifi size={13}/> {t('Online',lang)}</>:<><WifiOff size={13}/> {t('Offline',lang)}</>}</StatusPill>}/>
 <div className="sync-strip"><span>{store.sync.lastSynced?`Last sync ${new Date(store.sync.lastSynced).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`:'Not synchronized'}</span><button onClick={sync}><RefreshCw size={14}/> {t('Sync',lang)}</button></div>
 <section className="critical-card"><div><StatusPill tone={currentAlert.severity==='Critical'?'red':'orange'}>● {currentAlert.severity.toUpperCase()} ALERT</StatusPill><h2>{currentAlert.message}</h2><p>{currentAlert.location} · {currentAlert.time}</p></div><button className="circle-action" onClick={()=>navigate('/alerts')}><Bell/></button></section>
 <div className="quick-grid"><button onClick={()=>navigate('/map')}><Map/><b>{t('Live Map',lang)}</b><span>Hazards, shelters & routes</span></button><button onClick={()=>navigate('/shelters')}><ShieldCheck/><b>{t('Safe Shelters',lang)}</b><span>Nearby safe locations</span></button><button onClick={()=>navigate('/alerts')}><Bell/><b>{t('Alerts',lang)}</b><span>{alerts.length} active updates</span></button><button className="danger-tile" onClick={()=>navigate('/sos')}><Siren/><b>{t('Emergency',lang)}</b><span>SOS & emergency help</span></button></div>
 <div className="section-head"><h3>{t('Quick Info',lang)}</h3><button onClick={locate} disabled={locating}><LocateFixed size={15}/>{locating?'Locating…':t('Use my location',lang)}</button></div>
 <div className="info-row"><button onClick={()=>navigate('/weather')}><CloudRain/><b>{t('Weather',lang)}</b><span>{wi?`${Math.round(weather.current.temperature_2m)}° · ${wi[0]}`:'Tap for live weather'}</span><small>{placeName||'Current location'}</small></button><button onClick={()=>navigate('/map?focus=redzones')}><span className="icon-box orange"><AlertTriangle size={15}/></span><b>{t('Red Zones',lang)}</b><span>{nearby} nearby zones</span><small>{mapData.redZones.length} monitored</small></button><button onClick={()=>navigate('/map?focus=roads')}><Construction/><b>{t('Road Status',lang)}</b><span>{blocked} blocked · {mapData.roads.length} monitored</span><small>Tap to inspect roads</small></button><button onClick={()=>navigate('/guidelines')}><BookOpen/><b>{t('Guidelines',lang)}</b><span>Read safety steps</span><small>Verified guidance</small></button></div>
 <section className="status-card"><div><span className="risk-label">CURRENT SAFETY STATUS</span><strong>{risk}</strong><p>Follow verified government guidance and avoid marked red zones.</p></div><button onClick={()=>navigate('/guidelines')}><CheckCircle2 size={14}/> Safety Guide</button></section>
 </div>;
}
