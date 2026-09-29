import { useEffect, useRef, useState } from "react";
import { Phone, Radio, Volume2, X, CheckCircle2, Siren, Share2, HeartPulse, LocateFixed, BatteryMedium, UsersRound, ShieldCheck, Send, Navigation2 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { useApp } from "../../context/AppContext";
import { getBatteryLevel, getCurrentLocation, watchCurrentLocation } from "../../services/location/locationService";
import { citizenApi } from "../../services/api/citizenApi";

export default function SOS(){
 const [progress,setProgress]=useState(0);
 const [armed,setArmed]=useState(false);
 const [confirm,setConfirm]=useState(false);
 const [sharing,setSharing]=useState(false);
 const [dispatch,setDispatch]=useState(null);
 const [liveLocation,setLiveLocation]=useState(null);
 const [battery,setBattery]=useState(null);
 const [batteryCharging,setBatteryCharging]=useState(null);
 const [network,setNetwork]=useState(navigator.onLine);
 const [deviceTime,setDeviceTime]=useState(new Date());
 const timer=useRef(null); const watchRef=useRef(null); const sendingRef=useRef(false);
 const {setToast,store,updateSosState}=useApp();
 const user=store.user||{name:"Citizen User",phone:"+91 9876543210"};
 const family=store.family?.members||[];

 const playSound=()=>{
   try{
     const a=new Audio('/sounds/sos-alert.wav'); a.volume=1;
     const promise=a.play(); promise?.catch(()=>setToast('Audio permission is required to play the SOS tone.'));
   }catch{setToast('SOS sound could not be played on this device.')}
 };

 useEffect(()=>{const id=setInterval(()=>setDeviceTime(new Date()),1000);const on=()=>setNetwork(true),off=()=>setNetwork(false);window.addEventListener('online',on);window.addEventListener('offline',off);return()=>{clearInterval(id);window.removeEventListener('online',on);window.removeEventListener('offline',off)}},[]);

 const buildPayload=async(position)=>{
   const loc=position||liveLocation||await getCurrentLocation();
   const level=await getBatteryLevel();
   setLiveLocation(loc); setBattery(level);
   try{if(navigator.getBattery){const b=await navigator.getBattery();setBatteryCharging(Boolean(b.charging))}}catch{}
   return {
     user:{
       name:user.name, phone:user.phone, dob:user.dob||null, gender:user.gender||null,
       bloodGroup:user.bloodGroup||null, address:user.address||null,
       emergencyContactName:user.emergencyContactName||null,
       emergencyContactPhone:user.emergencyContactPhone||null,
       emergencyContactRelation:user.emergencyContactRelation||null,
       medicalNotes:user.medicalNotes||null
     },
     location:{...loc, timestamp:new Date().toISOString()},
     batteryPercentage:level,
     family:family.map(x=>({id:x.id,name:x.name,relation:x.relation,phone:x.phone,locationSharing:x.locationSharing})),
     source:"E-Rakshan Citizen App",
     event:"EMERGENCY_SOS"
   };
 };

 const sendInitialSOS=async()=>{
   try{
     const payload=await buildPayload();
     const result=await citizenApi.sendSOS(payload);
     const sessionId=result.dispatchId||`SOS-${Date.now()}`;
     setDispatch({sessionId,...result});
     updateSosState({active:true,sessionId,lastEvent:payload,updates:[payload]});
     setToast(result.mode==='demo'?'SOS dispatch created for Government + Linked Family (Demo).':'SOS sent to authorized emergency services.');
     return sessionId;
   }catch{
     setToast('SOS is active, but the emergency network could not be reached. Keep 112 available.');
     updateSosState({active:true,lastEvent:null});
     return null;
   }
 };

 const startLiveTracking=(sessionId)=>{
   watchRef.current?.();
   watchRef.current=watchCurrentLocation(async(pos)=>{
     setLiveLocation(pos);
     const level=await getBatteryLevel(); setBattery(level);
     if(sessionId){
       const payload={location:{...pos,timestamp:new Date().toISOString()},batteryPercentage:level};
       await citizenApi.updateSOS(sessionId,payload).catch(()=>{});
       updateSosState(current=>({...current,updates:[...(current.updates||[]),payload].slice(-30),lastEvent:payload}));
     }
   },()=>{});
 };

 const start=()=>{
   if(sendingRef.current || armed) return;
   clearInterval(timer.current);
   setProgress(0);
   timer.current=setInterval(()=>setProgress(p=>{
     if(p>=100){
       clearInterval(timer.current);
       if(sendingRef.current) return 100;
       sendingRef.current=true;
       setArmed(true);
       setConfirm(false);
       playSound();
       if(navigator.vibrate)navigator.vibrate([150,80,150,80,250]);
       sendInitialSOS().then(startLiveTracking);
       return 100;
     }
     return p+5;
   }),150);
 };
 const stop=()=>{
   clearInterval(timer.current);
   if(progress<100)setProgress(0);
 };
 useEffect(()=>()=>{clearInterval(timer.current);watchRef.current?.();},[]);

 const call=()=>{window.location.href='tel:112'};

 const share=async()=>{
   setSharing(true);
   try{
     const payload=await buildPayload();
     const maps=`https://www.google.com/maps/search/?api=1&query=${payload.location.lat},${payload.location.lng}`;
     const text=[
       'E-RAKSHAN EMERGENCY SOS',
       `Name: ${user.name}`,
       `Mobile: ${user.phone}`,
       `Blood group: ${user.bloodGroup||'Not provided'}`,
       `Emergency contact: ${user.emergencyContactName||'Not provided'} ${user.emergencyContactPhone||''}`,
       `Location: ${maps}`,
       `Coordinates: ${payload.location.lat}, ${payload.location.lng}`,
       `Accuracy: ±${Math.round(payload.location.accuracy||0)} m`,
       `Battery: ${payload.batteryPercentage??'Unknown'}%${batteryCharging?' (charging)':''}`,
       `Time: ${new Date().toLocaleString()}`,
       `Network: ${network?'Online':'Offline'}`,
       'Please contact emergency services / 112 if immediate assistance is required.'
     ].join('\n');
     if(navigator.share) await navigator.share({title:'E-Rakshan Emergency SOS',text});
     else {await navigator.clipboard?.writeText(text);setToast('Complete emergency details copied.')}
   }catch{setToast('Unable to access GPS/share. Allow location permission and try again.')}
   finally{setSharing(false)}
 };

 const copyDetails=async()=>{
   try{const payload=await buildPayload();const text=JSON.stringify({...payload,deviceTime:deviceTime.toISOString(),network},null,2);await navigator.clipboard?.writeText(text);setToast('Complete emergency payload copied.')}catch{setToast('Could not prepare emergency details.')}
 };

 const cancel=()=>{
   clearInterval(timer.current); watchRef.current?.(); watchRef.current=null;
   sendingRef.current=false;
   setConfirm(false);setArmed(false);setProgress(0);
   updateSosState({active:false});
   setToast('SOS cancelled. Live location sharing stopped.');
 };

 return <div className="page sos-page">
   <PageHeader title="Emergency SOS" subtitle="Use only when you need emergency assistance"/>
   {!armed&&!confirm?
   <section className="sos-hero sos-enhanced">
     <div className="sos-orbit orbit-a"></div><div className="sos-orbit orbit-b"></div>
     <div className="sos-ring"><button onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onTouchStart={start} onTouchEnd={stop} aria-label="Hold to activate SOS"><span>{progress>=100?'RELEASE':'SOS'}</span><small>{progress>=100?'Sending alert…':'Hold for 3 seconds'}</small></button></div>
     <div className="sos-live-badge"><Siren/> Emergency ready</div>
     <h2>Emergency assistance</h2><p>Hold for 3 seconds. Once activated, the app prepares your latest location, battery and registered emergency details for authorized responders and your linked family circle.</p>
     <div className="sos-progress"><i style={{width:`${progress}%`}}/></div>
     <div className="sos-hint"><HeartPulse/> Linked family members: {family.length}</div>
   </section>:
   <section className="confirm-sos sos-active-card">
     <div className="active-pulse"><CheckCircle2/></div><div className="sos-live-status"><i/> LIVE EMERGENCY LOCATION</div>
     <h2>SOS is active</h2>
     <p>Your emergency profile is being prepared for authorized response and your linked family circle.</p>
     <div className="sos-live-grid">
       <div><LocateFixed/><span>Latest location</span><b>{liveLocation?`${liveLocation.lat.toFixed(5)}, ${liveLocation.lng.toFixed(5)}`:'Locating…'}</b></div>
       <div><BatteryMedium/><span>Battery</span><b>{battery==null?'Checking…':`${battery}%${batteryCharging?' · Charging':''}`}</b></div>
       <div><UsersRound/><span>Family circle</span><b>{family.length} linked</b></div>
       <div><ShieldCheck/><span>Dispatch</span><b>{dispatch?'Sent / Demo':'Sending…'}</b></div>
     </div>
     <div className="sos-recipient-note"><Send size={15}/><span>Latest GPS updates, battery state, profile details and family-circle information are sent to the configured OSIRIS emergency endpoint. Accuracy: ±{Math.round(liveLocation?.accuracy||0)} m · Network: {network?'Online':'Offline'} · {deviceTime.toLocaleTimeString()}</span></div>
     <button className="danger-btn" onClick={call}><Phone/> Call 112 emergency services</button>
     <div className="sos-share-grid"><button className="primary-btn" onClick={share}><Share2/> {sharing?'Sharing…':'Share all emergency details'}</button><button className="secondary-btn" onClick={copyDetails}><Send/> Copy data</button></div>
     <button className="secondary-btn" onClick={cancel}><X/> Cancel SOS</button>
   </section>}
   <div className="emergency-links"><button onClick={call}><Radio/> Local control / 112</button><button onClick={playSound}><Volume2/> Test SOS sound</button></div>
   {armed&&<div className="sos-footer-note"><Navigation2 size={14}/> Live location tracking continues while SOS is active.</div>}
 </div>;
}
