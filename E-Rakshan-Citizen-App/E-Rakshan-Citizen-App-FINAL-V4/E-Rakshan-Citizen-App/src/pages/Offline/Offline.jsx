import { useState } from "react";
import { CheckCircle2, Map, Bell, Shield, RefreshCw, AlertTriangle, Navigation, Siren, UsersRound, BookOpen, Download, WifiOff, Database, Route, Smartphone, Zap, Search, MapPinned, ArrowLeft, Sparkles } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { useApp } from "../../context/AppContext";
import { getSyncLabel } from "../../services/sync/syncService";
import { getCurrentLocation } from "../../services/location/locationService";
import { loadStore, saveStore } from "../../services/storage/localStore";
import Alerts from "../Alerts/Alerts";
import MapPage from "../Map/MapPage";
import Shelters from "../Shelters/Shelters";
import NavigationPage from "../Navigation/Navigation";
import SOS from "../Emergency/SOS";
import Guidelines from "../Guidelines/Guidelines";
import Family from "../Family/Family";

const PANELS={alerts:Alerts,map:MapPage,shelters:Shelters,navigation:NavigationPage,sos:SOS,guidelines:Guidelines,family:Family};

export default function Offline() {
  const { store, sync, alerts, shelters, mapData, online, location, setLocation, setToast }=useApp();
  const [preparing,setPreparing]=useState(false);
  const [panel,setPanel]=useState(null);
  const offline=!online;
  const routeCount=Math.max(Object.keys(store.routeCache||{}).length,store.cached?.offlineRoadPack?.routeCount||store.cached?.offlineRoadPack?.routes?.length||0);
  const savedCount=(store.savedLocations||[]).length;
  const familyCount=store.family?.members?.length||0;

  const items=[
    ["Alerts",alerts.length,Bell,"Live when online · cached offline"],
    ["Shelters",shelters.length,Shield,"Saved government-safe locations"],
    ["Red zones",mapData.redZones?.length||0,AlertTriangle,"Cached hazard boundaries"],
    ["Roads",mapData.roads?.length||0,Map,"Cached road status"],
  ];

  const prepareOffline=async()=>{
    setPreparing(true);
    try{
      const p=location||await getCurrentLocation().catch(()=>null);
      if(p&&!location)setLocation(p);

      let roadPack=null;

      try{
        const { citizenApi } = await import("../../services/api/citizenApi");
        roadPack=await citizenApi.getOfflineRoadPack();
      }catch{}

      if("serviceWorker" in navigator){
        try{
          const registration=await navigator.serviceWorker.getRegistration();
          registration?.active?.postMessage({
            type:"CACHE_MAP_AREA",
            lat:p?.lat||19.005,
            lng:p?.lng||73.125
          });
        }catch{}
      }

      const next=loadStore();

      saveStore({
        ...next,
        cached:{
          ...(next.cached||{}),
          offlineRoadPack:roadPack||next.cached?.offlineRoadPack||null
        },
        offlinePack:{
          ...(next.offlinePack||{}),
          preparedAt:new Date().toISOString(),
          mapReady:true,
          roadPackReady:Boolean(roadPack?.routes?.length)
        }
      });

      const routeCount=roadPack?.routeCount||roadPack?.routes?.length||0;

      setToast(
        routeCount
          ? `Offline Safe Pack prepared with ${routeCount} road routes.`
          : "Offline Safe Pack prepared. Cached data is ready; road routes were not downloaded."
      );
    }catch{
      setToast("Offline preparation could not complete. Cached data is still available.");
    }finally{
      setPreparing(false);
    }
  };

  const clearOfflineRoutes=()=>{const next=loadStore();saveStore({...next,routeCache:{}});setToast("Cached routes cleared.");window.location.reload();};
  const openPanel=(key)=>setPanel(key);
  if(panel){
    const Panel=PANELS[panel];
    return <div className="page offline-workspace">
      <div className="offline-workspace-bar"><button className="secondary-btn" onClick={()=>setPanel(null)}><ArrowLeft/> Back to Offline Safe Pack</button><span><WifiOff/> Offline workspace · {panel}</span></div>
      <Panel/>
    </div>;
  }

  const quick=[
    [Navigation,"Offline Navigation","Use cached routes or saved destinations","navigation"],
    [Map,"Offline Map","Open the same E-Rakshan map with cached tiles/data","map"],
    [Bell,"Cached Alerts","Review synchronized alerts without leaving Offline Mode","alerts"],
    [Shield,"Saved Shelters","Find cached shelters and navigate to one","shelters"],
    [BookOpen,"Safety Guidelines","Full safety content remains available offline","guidelines"],
    [Siren,"Emergency SOS","Device status, GPS and emergency sharing","sos"],
    [UsersRound,"Family Safety","Latest saved family sharing snapshots","family"],
  ];

  return <div className="page offline-page">
    <PageHeader title="Offline Mode" subtitle="Premium offline safety tools using the same E-Rakshan map and synchronized data"/>
    <div className="offline-status">
      <div className="offline-icon">{offline?<WifiOff/>:<CheckCircle2/>}</div>
      <div><strong>{offline?"OFFLINE MODE":"ONLINE · OFFLINE READY"}</strong><p>{offline?"Cached alerts, shelters, map data, saved routes, SAI commands and safety guidance remain available.":"You are online. Prepare your offline pack now so the same information remains available during a network loss."}</p></div>
    </div>

    <div className="offline-pack-card">
      <div className="offline-pack-head"><div><span className="status-pill green"><Database size={12}/> SAFE PACK</span><h2>Offline Safe Pack</h2><p>Keep essential citizen tools usable when connectivity drops.</p></div><button className="primary-btn" onClick={prepareOffline} disabled={preparing}><Download size={16}/>{preparing?"Preparing…":"Prepare / Refresh"}</button></div>
      <div className="offline-pack-grid">
        <div><MapPinned/><b>Same Map</b><span>Existing Leaflet map, cached tiles, roads and hazard layers.</span></div>
        <div><Route/><b>Saved Routes</b><span>{routeCount} route{routeCount===1?'':'s'} cached for offline guidance.</span></div>
        <div><Search/><b>Location Search</b><span>{savedCount} saved/cached location{savedCount===1?'':'s'} available offline.</span></div>
        <div><Smartphone/><b>SAI + SOS</b><span>Voice/text commands, emergency data and safety guidance stay accessible.</span></div>
      </div>
      {store.offlinePack?.preparedAt&&<div className="offline-pack-meta">Prepared {new Date(store.offlinePack.preparedAt).toLocaleString()} · {store.offlinePack.mapReady?"Map cache ready":"Map cache not prepared"}</div>}
    </div>

    <div className="stale-warning"><AlertTriangle/><div><b>Last synchronization</b><span>{getSyncLabel(store)}</span><small>Offline data is a snapshot. Reconnect and sync when possible for the latest government information.</small></div></div>
    <div className="cache-grid">{items.map(([name,n,Icon,desc])=><div key={name}><Icon/><b>{name}</b><span>{n} cached</span><small>{desc}</small></div>)}</div>

    <div className="offline-actions">
      <button className="primary-btn full" onClick={sync}><RefreshCw/> Sync Now</button>
      {quick.map(([Icon,label,desc,key])=><button className="secondary-btn full offline-quick" key={key} onClick={()=>openPanel(key)}><Icon/><span><b>{label}</b><small>{desc}</small></span><span className="offline-go">›</span></button>)}
      <button className="secondary-btn full" onClick={clearOfflineRoutes} disabled={!routeCount}><Zap/> Clear cached routes ({routeCount})</button>
    </div>

    <div className="offline-premium-grid">
      <div><Sparkles/><b>Offline Safety Center</b><span>All essential tools open inside this page instead of redirecting away.</span></div>
      <div><MapPinned/><b>Road-aware map cache</b><span>Prepare a larger local tile area before travel for road visibility during network loss.</span></div>
      <div><Search/><b>Location memory</b><span>Locations searched while online can remain available to the offline search flow.</span></div>
      <div><Shield/><b>Emergency ready</b><span>SOS, family snapshots and safety guidance remain accessible from the offline workspace.</span></div>
    </div>
    <div className="offline-footer-grid">
      <div><b>Offline family snapshot</b><span>{familyCount} family member{familyCount===1?'':'s'} stored locally.</span></div>
      <div><b>Emergency readiness</b><span>Keep battery, GPS and emergency contacts ready before going offline.</span></div>
    </div>
  </div>;
}
