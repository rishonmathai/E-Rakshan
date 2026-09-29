import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigation as NavIcon, Mic, Volume2, XCircle, ShieldCheck, AlertTriangle, MapPinned, Search, MapPin, WifiOff, Route as RouteIcon, Car, Bike, Footprints, ExternalLink, RefreshCw, LocateFixed, Clock3, Navigation2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import HazardMap from '../../components/map/HazardMap';
import { useApp } from '../../context/AppContext';
import { buildRouteOptions, buildSafeRoute, TRAVEL_MODES } from '../../services/navigation/routeService';
import { speak, stopSpeaking } from '../../services/voice/voiceService';
import { searchLocation, cacheLocation } from '../../services/location/searchService';
import { getCurrentLocation, watchCurrentLocation } from '../../services/location/locationService';
import { useSearchParams } from 'react-router-dom';

const localizeInstruction=(text,lang)=>{
  if(lang==='English') return text;
  if(lang==='Hindi') return text.replace(/^Turn right/i,'दाईं ओर मुड़ें').replace(/^Turn left/i,'बाईं ओर मुड़ें').replace(/^Continue straight/i,'सीधे चलते रहें').replace(/^Continue /i,'आगे बढ़ें ').replace(/^Start on/i,'शुरू करें').replace(/^You have arrived/i,'आप अपने गंतव्य पर पहुँच गए हैं').replace(/^Offline guidance:/i,'ऑफलाइन मार्गदर्शन:').replace(/ in /i,' में ').replace(/ onto /i,' पर ');
  return text.replace(/^Turn right/i,'उजवीकडे वळा').replace(/^Turn left/i,'डावीकडे वळा').replace(/^Continue straight/i,'सरळ पुढे जा').replace(/^Continue /i,'पुढे जा ').replace(/^Start on/i,'सुरू करा').replace(/^You have arrived/i,'तुम्ही गंतव्यस्थानी पोहोचलात').replace(/^Offline guidance:/i,'ऑफलाइन मार्गदर्शन:').replace(/ in /i,' मध्ये ').replace(/ onto /i,' वर ');
};

const modeIcons={car:Car,motorcycle:Bike,bicycle:Bike,walking:Footprints};
const km=(n)=>Number(n||0).toFixed(1);

export default function NavigationPage() {
  const { mapData, shelters, location, setLocation, setToast, store } = useApp();
  const [params]=useSearchParams();
  const initial=params.get('destination')||'';
  const [destination,setDestination]=useState(initial);
  const [destinationPoint,setDestinationPoint]=useState(null);
  const [started,setStarted]=useState(false);
  const [step,setStep]=useState(0);
  const [route,setRoute]=useState([]);
  const [instructions,setInstructions]=useState([]);
  const [stepPoints,setStepPoints]=useState([]);
  const [stats,setStats]=useState({distanceKm:0,etaMinutes:0});
  const [loading,setLoading]=useState(false);
  const [mode,setMode]=useState('Safest Route');
  const [travelMode,setTravelMode]=useState('car');
  const [searching,setSearching]=useState(false);
  const [routeSafety,setRouteSafety]=useState(null);
  const [routeOffline,setRouteOffline]=useState(false);
  const [routeOptions,setRouteOptions]=useState([]);
  const [lastUpdated,setLastUpdated]=useState(null);
  const [showTrafficNote,setShowTrafficNote]=useState(false);
  const [viewMode,setViewMode]=useState('map');
  const watchRef=useRef(null);
  const rerouteRef=useRef(null);

  const defaultShelter=useMemo(()=>shelters.find(s=>s.status==='Open')||shelters[0], [shelters]);

  useEffect(()=>{
    if(location) return;
    getCurrentLocation().then(p=>setLocation(p)).catch(()=>{});
  },[]);

  useEffect(()=>()=>{stopSpeaking();watchRef.current?.();clearInterval(rerouteRef.current)},[]);

  useEffect(()=>{
    if(initial&&!destinationPoint){
      const match=shelters.find(s=>s.name.toLowerCase()===initial.toLowerCase());
      if(match)setDestinationPoint(match);
    }
  },[initial,shelters,destinationPoint]);

  const resolveDestination=async()=>{
    if(destinationPoint) return destinationPoint;
    const exact=shelters.find(s=>s.name.toLowerCase()===destination.trim().toLowerCase());
    if(exact){setDestinationPoint(exact);return exact;}
    if(!destination.trim()) return null;
    setSearching(true);
    try{
      const results=await searchLocation(destination.trim(),{online:navigator.onLine});
      if(!results.length){
        setToast(navigator.onLine
          ? 'Destination not found. Try a city, district, area or landmark.'
          : 'That place is not cached for offline search. Search it once while online, then it will remain available offline.');
        return null;
      }
      const normalized=cacheLocation(results[0]);
      normalized.name=[normalized.name,normalized.admin,normalized.country].filter(Boolean).join(', ');
      setDestinationPoint(normalized);
      setToast(`Destination found: ${normalized.name}${navigator.onLine?'':' · offline cache'}`);
      return normalized;
    }catch{setToast('Destination search needs an internet connection.');return null}
    finally{setSearching(false)}
  };

  const chooseShelter=()=>{if(defaultShelter){setDestination(defaultShelter.name);setDestinationPoint(defaultShelter);setToast(`${defaultShelter.name} selected.`)}};
  const useMyLocation=async()=>{try{const p=await getCurrentLocation();setLocation(p);setToast('Current GPS location updated.')}catch{setToast('Allow GPS access to use your current location.')}};

  const applyResult=(result)=>{
    const list=result.instructions?.length?result.instructions:['Continue toward your destination','You are approaching the destination'];
    setRoute(result.geometry||[]);setInstructions(list);setStepPoints(result.stepPoints||[]);setStats({distanceKm:result.distanceKm,etaMinutes:result.etaMinutes});setRouteSafety(result.safety||null);setRouteOffline(Boolean(result.offline));setStarted(true);setStep(0);setLastUpdated(new Date());
    setToast(`${result.travelLabel||'Route'} · ${result.distanceKm} km · ${result.etaMinutes} min${result.offline?' · Offline guidance':''}`);
    if(store.settings.navigationVoice) speak(localizeInstruction(list[0],store.settings.language),store.settings.language);
  };

  const calculate=async({auto=false}={})=>{
    setLoading(true);
    try{
      const origin=location||await getCurrentLocation();
      if(!location)setLocation(origin);
      const dest=await resolveDestination();
      if(!dest){setLoading(false);return;}
      const result=await buildSafeRoute(origin,{lat:dest.lat,lng:dest.lng,name:dest.name},mode,mapData,travelMode);
      applyResult(result);
      if(!auto){
        const options=await buildRouteOptions(origin,{lat:dest.lat,lng:dest.lng,name:dest.name},mode,mapData).catch(()=>[]);
        setRouteOptions(options);
      }
    }catch{setToast('No live road route could be calculated. Check GPS/internet and try again.')}finally{setLoading(false)}
  };

  const start=()=>calculate();

  useEffect(()=>{
    if(!started) return;
    watchRef.current?.();
    watchRef.current=watchCurrentLocation(pos=>setLocation(pos),()=>{});
    clearInterval(rerouteRef.current);
    rerouteRef.current=setInterval(()=>{ if(navigator.onLine) void calculate({auto:true}); },30000);
    return()=>{watchRef.current?.();watchRef.current=null;clearInterval(rerouteRef.current)};
  },[started,destinationPoint,travelMode,mode]);

  useEffect(()=>{
    if(params.get('autostart')==='1' && destination && destinationPoint && !started && !loading) void calculate();
  },[destinationPoint]);

  const end=()=>{stopSpeaking();watchRef.current?.();watchRef.current=null;clearInterval(rerouteRef.current);setStarted(false);setStep(0);setRoute([]);setInstructions([]);setStepPoints([]);setRouteSafety(null);setRouteOffline(false);setRouteOptions([])};
  const next=()=>{const n=Math.min(step+1,Math.max(0,instructions.length-1));setStep(n);if(store.settings.navigationVoice&&instructions[n])speak(localizeInstruction(instructions[n],store.settings.language),store.settings.language)};
  const current=localizeInstruction(instructions[step]||'Follow the highlighted route.',store.settings.language);
  const arrow=instructionArrow(instructions[step]||'');
  const safetyText=routeSafety?.blockedExposure?`Avoids/near ${routeSafety.blockedExposure} blocked road point${routeSafety.blockedExposure>1?'s':''}`:routeSafety?.redExposure?`Crosses/near ${routeSafety.redExposure} red zone${routeSafety.redExposure>1?'s':''}`:'No mapped red-zone or blocked-road exposure detected';

  const googleDirections=()=>{
    if(!location||!destinationPoint)return;
    const modeMap={car:'driving',motorcycle:'driving',bicycle:'bicycling',walking:'walking'};
    const url=`https://www.google.com/maps/dir/?api=1&origin=${location.lat},${location.lng}&destination=${destinationPoint.lat},${destinationPoint.lng}&travelmode=${modeMap[travelMode]||'driving'}`;
    window.open(url,'_blank','noopener,noreferrer');
  };
  const streetView=()=>{
    const p=destinationPoint||location;
    if(!p)return;
    window.open(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${p.lat},${p.lng}`,'_blank','noopener,noreferrer');
  };

  const ModeButton=({id,label})=>{const Icon=modeIcons[id]||Car;return <button className={travelMode===id?'selected':''} onClick={()=>setTravelMode(id)}><Icon/><span>{label}</span></button>};

  return <div className="page nav-page">
    <PageHeader title="Safe Navigation" subtitle="Live road routing with hazard-aware guidance" right={started?<button className="danger-outline" onClick={end}><XCircle/> Stop Navigating</button>:null}/>
    {!started ? <>
      <div className="route-input-card">
        <div className="route-live-head"><span className="live-indicator"><i/> LIVE GPS</span><span>{location?`Current location ±${Math.round(location.accuracy||0)} m`:'Waiting for GPS'}</span><button onClick={useMyLocation}><LocateFixed size={14}/> Use current location</button></div>
        <label>Starting point</label>
        <div className="route-input"><LocateFixed/><input value={location?'Current location':'Waiting for current location'} readOnly/><span className="route-distance-badge">LIVE</span></div>
        <label>Destination</label>
        <div className="route-input"><MapPinned/><input value={destination} onChange={e=>{setDestination(e.target.value);setDestinationPoint(null)}} placeholder="Search any city, area or landmark" onKeyDown={e=>e.key==='Enter'&&resolveDestination()}/><button onClick={chooseShelter}>Shelter</button></div>
        <div className="route-destination-actions"><button className="secondary-btn" onClick={resolveDestination} disabled={searching}><Search/>{searching?'Searching…':'Find destination'}</button>{destinationPoint&&<span><MapPin/> {destinationPoint.name} · {location?`${km(haversine(location,destinationPoint))} km away`:''}</span>}</div>
        <div className="route-options"><button className={mode==='Safest Route'?'selected':''} onClick={()=>setMode('Safest Route')}><ShieldCheck/> Safest Route</button><button className={mode==='Fastest'?'selected':''} onClick={()=>setMode('Fastest')}><NavIcon/> Fastest</button><button className={mode==='Emergency route'?'selected':''} onClick={()=>setMode('Emergency route')}><AlertTriangle/> Emergency</button></div>
        <div className="travel-mode-row"><ModeButton id="car" label="Car"/><ModeButton id="motorcycle" label="Bike / Motorcycle"/><ModeButton id="bicycle" label="Bicycle"/><ModeButton id="walking" label="Walk"/></div>
        <div className="route-action-row"><button className="primary-btn full" disabled={loading} onClick={start}>{loading?'Calculating live road route…':'Start Live Navigation'} <NavIcon/></button></div>
        <div className="route-data-note"><Clock3 size={13}/> ETA and distance are recalculated from the current GPS position. Traffic conditions are not supplied by the free OSM routing service; use Live Traffic for traffic-aware directions.</div>
      </div>
      <HazardMap mapData={mapData} shelters={shelters} userLocation={location} selectedLocation={destinationPoint} focusPosition={destinationPoint} route={[]} routeStart={location} routeDestination={destinationPoint} className="nav-map-preview"/>
    </> :
    <>
      <div className="turn-card">
        <div className="turn-top"><span>{routeOffline?<><WifiOff size={13}/> OFFLINE GUIDANCE</>:<><span className="live-indicator"><i/> LIVE ROUTE</span></>} </span><b>{stats.distanceKm} km</b></div>
        <div className="turn-main"><div className={`big-arrow nav-arrow-${arrow.type}`} aria-label={arrow.label}>{arrow.glyph}</div><div><h2>{current}</h2><p>{routeOffline?'Using cached guidance. Reconnect for live road-level rerouting.':'Follow the highlighted road route. Turn markers are shown directly on the map.'}</p></div></div>
        <div className="nav-stats"><span><b>{stats.distanceKm} km</b> remaining</span><span><b>{stats.etaMinutes} min</b> ETA</span><span className="safe"><ShieldCheck/> {mode}</span><span>{TRAVEL_MODES[travelMode]?.icon} {TRAVEL_MODES[travelMode]?.label}</span></div>
        {routeSafety&&<div className="route-safety-note"><RouteIcon size={14}/><span>{safetyText}</span></div>}
        <div className="route-live-tools"><button onClick={googleDirections}><ExternalLink/> Live traffic / Google Maps</button><button onClick={streetView}><MapPinned/> Road / Street View</button><button onClick={()=>void calculate({auto:true})}><RefreshCw/> Recalculate</button></div>
        {lastUpdated&&<div className="route-updated">Last route update {lastUpdated.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>}
      </div>
      <div className="navigation-visual-card">
        <div className="navigation-visual-head">
          <div><b>Live road view</b><span>All mapped roads, route line, turn markers and hazard layers stay visible together.</span></div>
          <div className="navigation-view-tabs"><button className={viewMode==='map'?'active':''} onClick={()=>setViewMode('map')}><MapPinned/> Road Map</button><button className={viewMode==='street'?'active':''} onClick={()=>setViewMode('street')}><Navigation2/> Street View</button></div>
        </div>
        {viewMode==='map' ? <HazardMap mapData={mapData} shelters={shelters} userLocation={location} selectedLocation={destinationPoint} route={route} routeStepPoints={stepPoints} routeStart={location} routeDestination={destinationPoint} fitRoute className="nav-map"/> : <div className="street-view-panel">
          {import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY && (location||destinationPoint) ? <iframe title="Live Street View" src={`https://www.google.com/maps/embed/v1/streetview?key=${import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY}&location=${(location||destinationPoint).lat},${(location||destinationPoint).lng}&heading=0&pitch=0&fov=90`} loading="lazy" allowFullScreen allow="accelerometer; gyroscope; fullscreen" referrerPolicy="strict-origin-when-cross-origin"/> : <div className="street-view-fallback"><div className="street-view-fallback-icon"><Navigation2/></div><h3>Live Street View</h3><p>Open the real Google Street View at the current GPS position. Add a Google Maps Embed API key in <code>VITE_GOOGLE_MAPS_EMBED_KEY</code> to render it directly inside E-Rakshan.</p><button className="primary-btn" onClick={streetView}><ExternalLink/> Open Live Street View</button><div className="street-road-mini"><MapPinned/><span>Road network remains available in Road Map view with the complete OpenStreetMap road layer.</span></div></div>}
        </div>}
      </div>
      <div className="nav-controls"><button className="danger-outline nav-stop-mobile" onClick={end}><XCircle/> Stop Navigating</button><button className="voice-toggle" onClick={()=>speak(current,store.settings.language)}><Mic/> Speak</button><button className="primary-btn" onClick={next}>{step>=instructions.length-1?'Arrived':'Next instruction'} <Volume2/></button></div>
      <div className="route-options-live"><b>Other live route estimates</b>{routeOptions.filter(x=>x.travelMode!==travelMode).map(x=>{const Icon=modeIcons[x.travelMode]||Car;return <button key={x.travelMode} onClick={()=>{setTravelMode(x.travelMode);applyResult(x)}}><Icon/><span>{x.travelLabel}</span><strong>{x.distanceKm} km · {x.etaMinutes} min</strong></button>})}</div>
      <button className="traffic-note-toggle" onClick={()=>setShowTrafficNote(x=>!x)}>{showTrafficNote?'Hide':'About'} live traffic</button>{showTrafficNote&&<div className="traffic-note">The in-app route uses live GPS and the current OpenStreetMap road graph. Live traffic speeds are not exposed by the free routing service. The Live Traffic button opens Google Maps so the user can see the provider's current traffic-aware route.</div>}
    </>}
  </div>;
}

function instructionArrow(text = "") {
  const t = text.toLowerCase();
  if (/u-turn|u turn/.test(t)) return { type:"uturn", glyph:"↶", label:"U-turn" };
  if (/roundabout|rotary/.test(t)) return { type:"roundabout", glyph:"⟳", label:"Roundabout" };
  if (/turn right|right/.test(t)) return { type:"right", glyph:"→", label:"Turn right" };
  if (/turn left|left/.test(t)) return { type:"left", glyph:"←", label:"Turn left" };
  if (/slight right/.test(t)) return { type:"slight-right", glyph:"↗", label:"Slight right" };
  if (/slight left/.test(t)) return { type:"slight-left", glyph:"↖", label:"Slight left" };
  if (/arrived|destination/.test(t)) return { type:"arrived", glyph:"●", label:"Destination" };
  return { type:"straight", glyph:"↑", label:"Continue straight" };
}

function haversine(a,b){
  const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180;
  const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}



