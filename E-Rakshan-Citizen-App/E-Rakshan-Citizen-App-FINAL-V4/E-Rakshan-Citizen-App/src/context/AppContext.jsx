import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadStore, saveStore } from "../services/storage/localStore";
import { alerts as demoAlerts, shelters as demoShelters, mapPoints as demoMap } from "../data/mockData";
import { syncCitizenData } from "../services/sync/syncService";
import { citizenApi, DEMO_MODE } from "../services/api/citizenApi";
import { translateStatic } from "../i18n";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [store, setStore] = useState(loadStore());
  const [alerts, setAlerts] = useState(demoAlerts);
  const [shelters, setShelters] = useState(demoShelters);
  const [mapData, setMapData] = useState(demoMap);
  const [location, setLocation] = useState(null);
  const [toast, setToast] = useState("");
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => { saveStore(store); }, [store]);
  useEffect(() => {
    if (store.cached?.alerts?.length) setAlerts(store.cached.alerts);
    if (store.cached?.shelters?.length) setShelters(store.cached.shelters);
    if (store.cached?.mapPoints) setMapData(store.cached.mapPoints);
    if (DEMO_MODE) return;
    let active=true;
    citizenApi.getInitialData().then(data=>{
      if(!active) return;
      if(data.alerts?.length) setAlerts(data.alerts);
      if(data.shelters?.length) setShelters(data.shelters);
      if(data.mapData) setMapData(data.mapData);
    }).catch(()=>{});
    return()=>{active=false};
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = store.settings.theme || "light"; document.documentElement.lang = store.settings.language === "Hindi" ? "hi" : store.settings.language === "Marathi" ? "mr" : "en"; }, [store.settings.theme, store.settings.language]);
  useEffect(() => {
    const run=()=>translateStatic(document.body,store.settings.language);
    const observer=new MutationObserver(()=>run()); observer.observe(document.body,{subtree:true,childList:true}); run();
    return()=>observer.disconnect();
  }, [store.settings.language]);
  useEffect(() => {
    const onlineHandler=()=>setOnline(true);
    const offlineHandler=()=>setOnline(false);
    window.addEventListener("online",onlineHandler); window.addEventListener("offline",offlineHandler);
    return()=>{window.removeEventListener("online",onlineHandler);window.removeEventListener("offline",offlineHandler)};
  }, []);
  useEffect(() => { if (!toast) return; const t=setTimeout(()=>setToast(""),2800); return()=>clearTimeout(t); }, [toast]);

  const sync = async () => {
    setStore(s => ({ ...s, sync: { ...s.sync, status: "SYNCING" } }));
    try { const next=await syncCitizenData(); setStore(next); setAlerts(next.cached.alerts||demoAlerts); setShelters(next.cached.shelters||demoShelters); setMapData(next.cached.mapPoints||demoMap); setToast("Citizen-safe data synchronized."); return true; }
    catch { setStore(s=>({...s,sync:{...s.sync,status:"SYNC_FAILED"}})); setToast("Unable to sync. Showing last synchronized information."); return false; }
  };
  const setAuth=(authenticated,user=null)=>setStore(s=>({...s,authenticated,user}));
  const updateProfile=(patch)=>setStore(s=>({...s,user:{...(s.user||{}),...patch}}));
  const setOnboardingDone=()=>setStore(s=>({...s,onboardingDone:true}));
  const updateSettings=patch=>setStore(s=>({...s,settings:{...s.settings,...patch}}));
  const markRead=id=>setAlerts(a=>a.map(x=>x.id===id?{...x,unread:false}:x));
  const dismissAlert=id=>setAlerts(a=>a.map(x=>x.id===id?{...x,dismissed:true}:x));
  const restoreAlerts=()=>setAlerts(a=>a.map(x=>({...x,dismissed:false})));
  const addSavedLocation=place=>setStore(s=>({...s,savedLocations:[...(s.savedLocations||[]).filter(x=>x.id!==place.id),place]}));
  const removeSavedLocation=id=>setStore(s=>({...s,savedLocations:(s.savedLocations||[]).filter(x=>x.id!==id)}));
  const addContact=contact=>setStore(s=>({...s,emergencyContacts:[...(s.emergencyContacts||[]),contact]}));
  const removeContact=id=>setStore(s=>({...s,emergencyContacts:(s.emergencyContacts||[]).filter(x=>x.id!==id)}));
  const addFamilyMember=member=>setStore(s=>({...s,family:{...(s.family||{}),primaryAccount:true,members:[...(s.family?.members||[]),member]}}));
  const updateFamilyMember=(id,patch)=>setStore(s=>({...s,family:{...(s.family||{}),members:(s.family?.members||[]).map(m=>m.id===id?{...m,...patch}:m)}}));
  const removeFamilyMember=id=>setStore(s=>({...s,family:{...(s.family||{}),members:(s.family?.members||[]).filter(m=>m.id!==id)}}));
  const updateSosState=patch=>setStore(s=>({...s,sos:typeof patch==="function"?patch(s.sos||{}):{...(s.sos||{}),...patch}}));
  const value=useMemo(()=>({store,alerts:alerts.filter(a=>!a.dismissed),allAlerts:alerts,shelters,mapData,savedLocations:store.savedLocations||[],location,setLocation,toast,online,sync,setAuth,updateProfile,setOnboardingDone,updateSettings,markRead,dismissAlert,restoreAlerts,setToast,addSavedLocation,removeSavedLocation,addContact,removeContact,
    family:store.family||{primaryAccount:true,members:[]},addFamilyMember,updateFamilyMember,removeFamilyMember,updateSosState}),[store,alerts,shelters,mapData,location,toast,online]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp(){const ctx=useContext(AppContext);if(!ctx)throw new Error("useApp must be used inside AppProvider");return ctx;}
