import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Map, Bell, ChevronRight, Check, X, RotateCcw, LocateFixed, Radio, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import StatusPill from "../../components/common/StatusPill";
import { useApp } from "../../context/AppContext";
import { getCurrentLocation } from "../../services/location/locationService";
import { reverseGeocode } from "../../services/weather/weatherService";

const EARTH_KM=6371;
function distanceKm(a,b){
 const dLat=(b.lat-a.lat)*Math.PI/180, dLng=(b.lng-a.lng)*Math.PI/180;
 const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
 return EARTH_KM*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}

export default function Alerts(){
 const {alerts,allAlerts,markRead,dismissAlert,restoreAlerts,sync,setToast,location,setLocation}=useApp();
 const [filter,setFilter]=useState('All'); const [q,setQ]=useState(''); const [locating,setLocating]=useState(!location); const [nearby,setNearby]=useState([]); const [place,setPlace]=useState(null);
 const navigate=useNavigate();

 const locate=async()=>{
   setLocating(true);
   try{
     const p=await getCurrentLocation();
     setLocation(p);
     const resolved=await reverseGeocode(p.lat,p.lng).catch(()=>null); setPlace(resolved);
     setToast('Alerts are now filtered to your current area.');
   }catch{
     setToast('Allow location access to show only alerts near you.');
   }finally{setLocating(false)}
 };

 useEffect(()=>{ if(!location) locate(); else reverseGeocode(location.lat,location.lng).then(setPlace).catch(()=>{}); },[]);

 useEffect(()=>{
   if(!location){setNearby([]);return;}
   const radius=35;
   const currentTerms=[place?.name,place?.admin,place?.country].filter(Boolean).map(x=>String(x).toLowerCase());
   setNearby(alerts.filter(a=>{
     if(Number.isFinite(Number(a.lat))&&Number.isFinite(Number(a.lng)))
       return distanceKm(location,{lat:Number(a.lat),lng:Number(a.lng)})<=radius;
     const text=String(a.location||'').toLowerCase();
     return currentTerms.length>0 && currentTerms.some(term=>text.includes(term));
   }).map(a=>({
     ...a,
     distanceKm:Number.isFinite(Number(a.lat))&&Number.isFinite(Number(a.lng))
       ? distanceKm(location,{lat:Number(a.lat),lng:Number(a.lng)}) : null
   })));
 },[alerts,location,place]);

 const filtered=useMemo(()=>nearby
   .filter(a=>(filter==='All'||a.type===filter||a.severity===filter))
   .filter(a=>`${a.title} ${a.message} ${a.location}`.toLowerCase().includes(q.toLowerCase()))
   .sort((a,b)=>(a.distanceKm||999)-(b.distanceKm||999)),[nearby,filter,q]);

 const viewMap=a=>{navigate(`/map?alert=${encodeURIComponent(a.id)}`);setToast(`Showing ${a.title} on the map.`)};

 return <div className="page">
   <PageHeader title="Alerts" subtitle="Only government-verified alerts near your current location" right={
     <div className="header-actions">
       <button className="icon-btn live-action-btn" onClick={sync} title="Refresh alerts"><RefreshCw/></button>
       <button className="secondary-btn" onClick={restoreAlerts}><RotateCcw/> Restore dismissed</button>
     </div>
   }/>
   <div className="local-alert-status">
     <span className="live-indicator"><i/> LIVE</span>
     <span>{location?`Showing alerts within 35 km of your current location or matched to your current area.`:"Your location is required before nearby alerts can be shown."}</span>
     <button onClick={locate} disabled={locating}><LocateFixed size={14}/>{locating?'Locating…':'Update location'}</button>
   </div>
   <div className="search-box"><Search/><input placeholder="Search nearby alerts…" value={q} onChange={e=>setQ(e.target.value)}/>{q&&<button onClick={()=>setQ('')}><X/></button>}</div>
   <div className="filter-scroll">{['All','Critical','Warning','Advisory','Road','Weather','Hazard','Shelter update'].map(x=><button key={x} className={filter===x?'selected':''} onClick={()=>setFilter(x)}>{x}</button>)}</div>

   {location&&<div className="nearby-alert-count"><Radio size={15}/><b>{filtered.length}</b><span>nearby alert{filtered.length===1?'':'s'} available</span><MapPin size={14}/><span>{location.lat.toFixed(3)}, {location.lng.toFixed(3)}</span></div>}

   <div className="alert-list">
     {filtered.map(a=><article key={a.id} className={`alert-item ${a.unread?`unread-${a.severity.toLowerCase()}`:""}`} onClick={()=>markRead(a.id)}>
       <div className="alert-icon"><Bell size={19}/></div>
       <div className="alert-body">
         <div className="alert-top"><StatusPill tone={a.severity==='Critical'?'red':a.severity==='Warning'?'orange':'blue'}>{a.severity}</StatusPill>{a.unread&&<i className="unread-dot live-blink"/>}</div>
         <h3>{a.title}</h3><p>{a.message}</p>
         <small>{a.location} · {Math.round(a.distanceKm||0)} km away · {a.time}</small>
         <div className="alert-actions">
           <button onClick={e=>{e.stopPropagation();markRead(a.id);setToast('Alert marked as read.')}}><Check size={14}/> Mark read</button>
           <button onClick={e=>{e.stopPropagation();viewMap(a)}}><Map size={14}/> View on map</button>
           <button className="dismiss-action" onClick={e=>{e.stopPropagation();dismissAlert(a.id);setToast('Alert dismissed from the active list.')}}><X size={14}/> Dismiss</button>
         </div>
       </div>
       <ChevronRight className="chevron"/>
     </article>)}
   </div>

   {!filtered.length&&<div className="empty-state">
     {location?<><Bell/><h3>No nearby alerts</h3><p>There are no active government alerts within the current 35 km area.</p></>:<><LocateFixed/><h3>Location access needed</h3><p>Allow GPS access so Pramaan/E-Rakshan can show only alerts relevant to where you are.</p><button className="primary-btn" onClick={locate}>Use my current location</button></>}
   </div>}
 </div>;
}
