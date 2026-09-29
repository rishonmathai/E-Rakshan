import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, Navigation, MapPin, LocateFixed, X, AlertTriangle, Construction, Home, MapPinned, CheckCircle2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import HazardMap from '../../components/map/HazardMap';
import { useApp } from '../../context/AppContext';
import { getCurrentLocation } from '../../services/location/locationService';
import { searchLocation, cacheLocation } from '../../services/location/searchService';

export default function MapPage(){
 const {mapData,shelters,location,setLocation,addSavedLocation,setToast}=useApp();
 const [params]=useSearchParams(); const navigate=useNavigate();
 const [query,setQuery]=useState(''); const [selected,setSelected]=useState(null); const [focusPosition,setFocusPosition]=useState(null);
 const [layers,setLayers]=useState({redZones:true,hazards:true,shelters:true,roads:true,incidents:true}); const [searching,setSearching]=useState(false);
 const focus=params.get('focus');

 useEffect(()=>{
   if(focus==='redzones')setLayers(l=>({...l,redZones:true,hazards:true,roads:false,incidents:false}));
   if(focus==='roads')setLayers(l=>({...l,redZones:false,hazards:false,roads:true,incidents:false}));
 },[focus]);

 const visibleData=useMemo(()=>({
   redZones:layers.redZones?mapData.redZones:[],
   hazards:layers.hazards?mapData.hazards:[],
   roads:layers.roads?mapData.roads:[],
   incidents:layers.incidents?mapData.incidents:[]
 }),[mapData,layers]);

 const locate=async()=>{
   try{
     const p=await getCurrentLocation();
     setLocation(p);
     setSelected({...p,name:'Your current location',area:`Accuracy ±${Math.round(p.accuracy||0)} m`});
     setFocusPosition({...p,zoom:15});
     setToast('Your current GPS location is highlighted on the map.');
   }catch{setToast('GPS unavailable. Allow location permission in your browser.')}
 };

 const search=async()=>{
   const value=query.trim();
   if(!value)return;
   setSearching(true);
   try{
     const results=await searchLocation(value,{online:navigator.onLine});
     if(!results.length){
       setToast(navigator.onLine
         ? `No exact location found for "${value}". Try a city, district, state or landmark.`
         : `"${value}" is not in the offline location cache. Search it once while online to save it for offline use.`);
       return;
     }
     const r=cacheLocation(results[0]);
     const p={
       lat:r.lat,lng:r.lng,name:r.name,
       area:r.area||[r.admin,r.country].filter(Boolean).join(', '),
       bbox:r.bbox,zoom:r.zoom,
       id:r.id
     };
     setSelected(p);
     setFocusPosition(p);
     setToast(`Showing ${r.name}${r.admin?', '+r.admin:''}${r.country?', '+r.country:''}${navigator.onLine?'':' · offline cache'}`);
   }catch{setToast('Location search failed. Try again or use a previously cached location.')}
   finally{setSearching(false)}
 };

 useEffect(()=>{
   const id=params.get('alert');
   if(id){
     const a=[...mapData.hazards,...mapData.roads,...mapData.incidents].find(x=>x.id===id)||mapData.redZones.find(x=>x.id===id);
     if(a){setSelected(a);setFocusPosition(a)}
   }
 },[params.toString()]);

 const select=p=>{
   setSelected(p); setFocusPosition({...p,zoom:14});
   setToast(`Selected ${p.name||`${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`}`);
 };

 return <div className="page full-map-page">
   <PageHeader title="Live Map" subtitle="Hazards, shelters and road status"/>
   <div className="map-toolbar">
     <div className="search-box">
       <Search/><input aria-label="Search any location" placeholder="Search city, state, district or landmark…" value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()}/>
       {query&&<button onClick={()=>setQuery('')} aria-label="Clear search"><X/></button>}
     </div>
     <button className="filter-btn" onClick={()=>setLayers(l=>({...l,redZones:!l.redZones,hazards:!l.hazards,roads:!l.roads,incidents:!l.incidents}))}><SlidersHorizontal/> Layers</button>
   </div>
   <div className="map-search-actions">
     <button className="primary-btn" onClick={search} disabled={searching}><Search/>{searching?'Searching…':'Search location'}</button>
     <button className="secondary-btn" onClick={locate}><LocateFixed/> My location</button>
   </div>
   <div className="layer-chips">
     <button className={layers.redZones?'selected':''} onClick={()=>setLayers(l=>({...l,redZones:!l.redZones}))}><AlertTriangle/> Red zones</button>
     <button className={layers.hazards?'selected':''} onClick={()=>setLayers(l=>({...l,hazards:!l.hazards}))}><AlertTriangle/> Hazards</button>
     <button className={layers.shelters?'selected':''} onClick={()=>setLayers(l=>({...l,shelters:!l.shelters}))}><Home/> Shelters</button>
     <button className={layers.roads?'selected':''} onClick={()=>setLayers(l=>({...l,roads:!l.roads}))}><Construction/> Roads</button>
     <button className={layers.incidents?'selected':''} onClick={()=>setLayers(l=>({...l,incidents:!l.incidents}))}>Incidents</button>
   </div>
   {selected?.name&&<div className="map-location-banner"><MapPinned size={16}/><span><b>{selected.name}</b><small>{selected.area||'Location found'}</small></span><CheckCircle2 size={16}/></div>}
   <HazardMap mapData={visibleData} shelters={layers.shelters?shelters:[]} userLocation={location} selectedLocation={selected} focusPosition={focusPosition} onSelect={select} className="map-large"/>
   <div className="map-legend"><span><i className="legend red"></i> Red zone</span><span><i className="legend orange"></i> Road issue</span><span><i className="legend green"></i> Shelter</span><span><i className="legend blue"></i> Your/selected location</span></div>
   {selected&&<div className="selected-location">
     <MapPin/><div><b>{selected.name||'Selected location'}</b><span>{selected.area||`${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`}</span></div>
     <button onClick={()=>{addSavedLocation({id:selected.id||`${selected.lat},${selected.lng}`,name:selected.name||'Saved location',lat:selected.lat,lng:selected.lng});setToast('Location saved for quick access.')}}>Save</button>
     <button onClick={()=>{setToast('Destination selected for safe navigation.');navigate(`/navigation?destination=${encodeURIComponent(selected.name||'Selected location')}`)}}><Navigation size={16}/> Use for route</button>
   </div>}
 </div>;
}
