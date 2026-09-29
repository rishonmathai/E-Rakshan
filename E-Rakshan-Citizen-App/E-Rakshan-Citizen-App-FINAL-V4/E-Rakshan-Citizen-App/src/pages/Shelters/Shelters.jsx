import { useEffect, useMemo, useState } from "react";
import { Search, Map, List, Navigation, HeartPulse, Accessibility, CheckCircle2, LocateFixed, RefreshCw, Info } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import HazardMap from "../../components/map/HazardMap";
import { useApp } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { getCurrentLocation } from "../../services/location/locationService";

const EARTH_KM=6371;
const distanceKm=(a,b)=>{const dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180;const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLng/2)**2;return EARTH_KM*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));};

async function fetchNearbyShelters(origin){
  const q=`[out:json][timeout:12];(nwr(around:15000,${origin.lat},${origin.lng})[amenity=shelter];nwr(around:15000,${origin.lat},${origin.lng})[emergency=shelter];);out center tags;`;
  const r=await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`);
  if(!r.ok)throw new Error('Nearby shelter lookup failed');
  const data=await r.json();
  return (data.elements||[]).map((x,i)=>{
    const lat=Number(x.lat ?? x.center?.lat),lng=Number(x.lon ?? x.center?.lon),tags=x.tags||{};
    if(!Number.isFinite(lat)||!Number.isFinite(lng))return null;
    return {id:`osm-${x.type}-${x.id}`,name:tags.name||tags['name:en']||'Nearby emergency shelter',area:[tags['addr:city'],tags['addr:district'],tags['addr:state']].filter(Boolean).join(', ')||'Nearby area',distance:Number(distanceKm(origin,{lat,lng}).toFixed(1)),capacity:tags.capacity?Number(tags.capacity):null,status:'Listed',medical:/hospital|clinic|medical/i.test(tags.amenity||tags.name||''),accessible:Boolean(tags.wheelchair==='yes'),family:true,lat,lng,source:'OpenStreetMap',verified:false};
  }).filter(Boolean).sort((a,b)=>a.distance-b.distance);
}

export default function Shelters() {
  const { shelters, location, setLocation, setToast } = useApp();
  const navigate=useNavigate(); const [view,setView]=useState("list"); const [q,setQ]=useState(""); const [filter,setFilter]=useState("All"); const [details,setDetails]=useState(null); const [nearby,setNearby]=useState([]); const [loading,setLoading]=useState(false);

  const locate=async()=>{try{const p=await getCurrentLocation();setLocation(p);setToast('Current location updated. Finding nearby safety locations…');}catch{setToast('Allow GPS access to find safety locations near you.')}};
  useEffect(()=>{if(!location)void locate();},[]);
  useEffect(()=>{
    if(!location)return;
    let active=true;setLoading(true);
    fetchNearbyShelters(location).then(items=>{if(active)setNearby(items)}).catch(()=>{if(active)setNearby([])}).finally(()=>active&&setLoading(false));
    return()=>{active=false};
  },[location?.lat,location?.lng]);

  const combined=useMemo(()=>{
    const gov=(shelters||[]).map(s=>({...s,verified:true,source:'Government synchronized data',distance:location?Number(distanceKm(location,s).toFixed(1)):s.distance}));
    const all=[...gov,...nearby];
    const seen=new Set();
    return all.filter(s=>{const key=`${s.name}|${Number(s.lat).toFixed(4)}|${Number(s.lng).toFixed(4)}`;if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>(a.distance??999)-(b.distance??999));
  },[shelters,nearby,location]);

  const filtered=useMemo(()=>combined.filter(s=>(filter==="All"||(filter==="Open"&&s.status==="Open")||(filter==="Medical"&&s.medical)||(filter==="Accessible"&&s.accessible)||(filter==="Family"&&s.family))&&`${s.name} ${s.area}`.toLowerCase().includes(q.toLowerCase())),[combined,q,filter]);
  return <div className="page"><PageHeader title="Nearby Safe Shelters" subtitle="Government-synchronized shelters plus nearby mapped emergency facilities" right={<div className="segmented"><button className={view==="list"?"active":""} onClick={()=>setView("list")}><List/> List</button><button className={view==="map"?"active":""} onClick={()=>setView("map")}><Map/> Map</button></div>}/>
    <div className="shelter-live-bar"><span className="live-indicator"><i/> LIVE LOCATION</span><span>{location?`Showing facilities around your current GPS position.`:'Waiting for GPS.'}</span><button onClick={locate}><LocateFixed/> Update</button><button onClick={()=>location&&setLocation({...location})} disabled={loading}><RefreshCw className={loading?'spin':''}/></button></div>
    <div className="search-box"><Search/><input placeholder="Search shelter or area…" value={q} onChange={e=>setQ(e.target.value)}/></div>
    <div className="filter-scroll">{["All","Open","Medical","Accessible","Family"].map(x=><button key={x} className={filter===x?"selected":""} onClick={()=>setFilter(x)}>{x}</button>)}</div>
    {view==="map" ? <HazardMap mapData={{redZones:[],hazards:[],roads:[],incidents:[]}} shelters={filtered} userLocation={location} className="shelter-map"/> :
    <div className="shelter-list">{filtered.map(s=><article className="shelter-card" key={s.id}><div className="shelter-avatar">⌂</div><div className="shelter-main"><div className="shelter-title"><h3>{s.name}</h3><span className="open-badge"><CheckCircle2 size={13}/> {s.verified?'Government verified':'Mapped facility'}</span></div><p>{s.area} · {s.distance??'—'} km</p><div className="shelter-meta"><span>{s.capacity?`Capacity ${s.capacity}`:'Capacity not listed'}</span>{s.medical&&<span><HeartPulse/> Medical</span>}{s.accessible&&<span><Accessibility/> Accessible</span>}</div>{!s.verified&&<div className="shelter-unverified"><Info/> OpenStreetMap facility; verify designation with local authorities.</div>}<div className="card-actions"><button onClick={()=>{setToast("Safe route selected.");navigate(`/navigation?destination=${encodeURIComponent(s.name)}`)}}><Navigation/> Directions</button><button className="ghost" onClick={()=>setDetails(s)}>Details</button></div></div></article>)}</div>}
    {!filtered.length&&<div className="empty-state"><LocateFixed/><h3>No nearby locations found</h3><p>Try a different search or refresh your current GPS position.</p></div>}
    {details&&<div className="modal-backdrop" onClick={()=>setDetails(null)}><div className="settings-modal shelter-details-modal" onClick={e=>e.stopPropagation()}><button className="icon-btn modal-close" onClick={()=>setDetails(null)}>×</button><h2>{details.name}</h2><p>{details.area} · {details.distance} km away</p><div className="about-points"><span>✓ Source: {details.source}</span><span>✓ Status: {details.status}</span><span>✓ Capacity: {details.capacity||'Not listed'}</span><span>{details.medical?'✓ Medical support listed':'• Medical support not listed'}</span><span>{details.accessible?'✓ Accessible facility':'• Accessibility not listed'}</span></div><div className="modal-actions"><button className="secondary-btn" onClick={()=>setDetails(null)}>Close</button><button className="primary-btn" onClick={()=>{setDetails(null);navigate(`/navigation?destination=${encodeURIComponent(details.name)}`)}}><Navigation/> Directions</button></div></div></div>}
  </div>;
}
