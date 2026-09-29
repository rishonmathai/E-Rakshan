import { useState } from 'react';
import { Volume2, X, WifiOff, Mic, Settings2, Send, Keyboard, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listenOnce, speak } from '../../services/voice/voiceService';
import { useApp } from '../../context/AppContext';

const SAI_ICON='/assets/sai-icon.png';
const hav=(a,b)=>{const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLon=(b.lng-a.lng)*Math.PI/180;const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));};

export default function SAI(){
 const [open,setOpen]=useState(false); const [state,setState]=useState('IDLE'); const [typed,setTyped]=useState('');
 const {store,setToast,shelters,mapData,location,online}=useApp(); const navigate=useNavigate(); const lang=store.settings.language;
 const reply=(en,hi,mr)=>speak(lang==='Hindi'?hi:lang==='Marathi'?mr:en,lang);
 const nearestShelter=()=>{const origin=location||{lat:19.005,lng:73.125}; return [...shelters].filter(s=>s.status==='Open').sort((a,b)=>hav(origin,a)-hav(origin,b))[0]||shelters[0];};
 const execute=async text=>{const t0=text.toLowerCase().trim(); if(!t0)return;
   if(/alert|अलर्ट|सूचना|notification/.test(t0)){navigate('/alerts');reply('Opening the latest alerts.','नवीनतम अलर्ट खोल रहा हूँ।','नवीनतम सूचना उघडत आहे.');return}
   if(/shelter|आश्रय|निवारा|safe place|सुरक्षित जगह|सुरक्षित ठिकाण/.test(t0)){
     const s=nearestShelter();
     if(/nearest|near|जवळ|नज़दीकी|पास|पास में|जवळचा|जवळचे/.test(t0) && s){
       navigate(`/navigation?destination=${encodeURIComponent(s.name)}&autostart=1`);
       const actualDistance=(location?hav(location,s):s.distance).toFixed(1);
       reply(`The nearest open shelter is ${s.name}, about ${actualDistance} kilometers away.`, `सबसे नज़दीकी खुला आश्रय ${s.name} है, लगभग ${s.distance} किलोमीटर दूर।`, `सर्वात जवळचा खुला निवारा ${s.name} आहे, सुमारे ${s.distance} किलोमीटर दूर आहे.`);
     } else { navigate('/shelters'); reply('Opening nearby safe shelters.','नज़दीकी सुरक्षित आश्रय खोल रहा हूँ।','जवळचे सुरक्षित निवारे उघडत आहे.'); }
     return;
   }
   if(/red zone|रेड झोन|redzone/.test(t0)){
     const count=mapData.redZones?.filter(z=>!location||hav(location,z)<=3).length ?? 0;
     navigate('/map?focus=redzones');
     reply(count?`${count} red zone${count>1?'s':''} are within about 3 kilometers of your location.`:'No red zone is currently listed near your location.', count?`आपकी लोकेशन से लगभग 3 किलोमीटर के अंदर ${count} रेड ज़ोन हैं।`:'आपकी लोकेशन के पास अभी कोई रेड ज़ोन सूचीबद्ध नहीं है।', count?`तुमच्या स्थानापासून सुमारे 3 किलोमीटरमध्ये ${count} रेड झोन आहेत.`:'तुमच्या स्थानाजवळ सध्या कोणताही रेड झोन सूचीबद्ध नाही.');
     return;
   }
   if(/road|blocked|रास्ता|सड़क|रोड|रस्ता|blocked roads|बंद/.test(t0)){
     const blocked=(mapData.roads||[]).filter(r=>/blocked|closed/i.test(r.status||''));
     navigate('/map?focus=roads');
     reply(blocked.length?`${blocked.length} blocked road${blocked.length>1?'s':''} are currently listed.`:'No blocked roads are currently listed.', blocked.length?`${blocked.length} बंद सड़कों की जानकारी उपलब्ध है।`:'अभी कोई बंद सड़क सूचीबद्ध नहीं है।', blocked.length?`${blocked.length} बंद रस्त्यांची नोंद आहे.`:'सध्या कोणताही बंद रस्ता सूचीबद्ध नाही.');
     return;
   }
   if(/risk|danger|खतरा|जोखिम|धोका/.test(t0)){
     const nearbyRed=mapData.redZones?.filter(z=>!location||hav(location,z)<=3).length??0;
     const nearbyHazards=mapData.hazards?.filter(z=>!location||hav(location,z)<=3).length??0;
     navigate('/home');
     const level=nearbyRed?'high':nearbyHazards?'elevated':'no nearby hazard listed';
     reply(`Your current safety picture is ${level}. I found ${nearbyRed} nearby red zones and ${nearbyHazards} nearby hazard points.`, `आपकी वर्तमान सुरक्षा स्थिति ${nearbyRed?'उच्च':'सामान्य से अधिक ध्यान देने योग्य'} है। आपके पास ${nearbyRed} रेड ज़ोन और ${nearbyHazards} खतरे के बिंदु सूचीबद्ध हैं।`, `तुमची सध्याची सुरक्षा स्थिती ${nearbyRed?'उच्च':'लक्ष देण्यासारखी'} आहे. जवळ ${nearbyRed} रेड झोन आणि ${nearbyHazards} धोका बिंदू आहेत.`);
     return;
   }
   if(/map|नक्शा|नकाशा|location|लोकेशन|स्थान/.test(t0)){navigate('/map');reply('Opening the live safety map.','लाइव सुरक्षा नक्शा खोल रहा हूँ।','लाइव्ह सुरक्षा नकाशा उघडत आहे.');return}
   if(/stop navigation|navigation band|नेविगेशन बंद|नेव्हिगेशन बंद|stop route/.test(t0)){ window.dispatchEvent(new CustomEvent('stop-navigation')); navigate('/navigation'); reply('Navigation stopped.','नेविगेशन बंद कर दिया गया है।','नेव्हिगेशन बंद केले आहे.'); return; }
   if(/navigation|navigate|रास्ता|नेविगेशन|मार्ग|route|रूट/.test(t0)){
     const s=nearestShelter();
     if(/shelter|आश्रय|निवारा/.test(t0) && s) navigate(`/navigation?destination=${encodeURIComponent(s.name)}&autostart=1`); else navigate('/navigation');
     reply('Opening safe navigation.','सुरक्षित नेविगेशन खोल रहा हूँ।','सुरक्षित नेव्हिगेशन उघडत आहे.');return;
   }
   if(/weather|मौसम|हवामान/.test(t0)){navigate('/weather');reply('Opening live weather.','लाइव मौसम खोल रहा हूँ।','लाइव्ह हवामान उघडत आहे.');return}
   if(/offline|ऑफलाइन/.test(t0)){navigate('/offline');reply('Opening offline mode.','ऑफलाइन मोड खोल रहा हूँ।','ऑफलाइन मोड उघडत आहे.');return}
   if(/sos|emergency|आपातकाल|आपत्कालीन/.test(t0)){navigate('/sos');reply('Opening emergency assistance.','आपातकालीन सहायता खोल रहा हूँ।','आपत्कालीन मदत उघडत आहे.');return}
   if(/guideline|what should|क्या कर|मार्गदर्शन|काय करावे/.test(t0)){navigate('/guidelines');reply('Opening safety guidelines.','सुरक्षा दिशानिर्देश खोल रहा हूँ।','सुरक्षा मार्गदर्शक उघडत आहे।');return}
   if(/what should i do|what do i do|help me|how do i|क्या करूं|क्या करूँ|क्या करना चाहिए|मदद|काय करावे|काय करू/.test(t0)){
     try{
       const apiUrl=import.meta.env.VITE_AI_API_URL;
       if(apiUrl && navigator.onLine){
         const r=await fetch(apiUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:text,language:lang,context:'E-Rakshan citizen emergency safety assistant'})});
         if(r.ok){
           const data=await r.json();
           const answer=data.answer||data.text||data.response;
           if(answer){reply(answer,answer,answer);setToast('SAI safety response generated.');navigate('/guidelines');return;}
         }
       }
     }catch{}
     const offlineAnswers = /flood|water|बाढ़|पानी|पूर|पाऊस/.test(t0)
       ? 'Move away from low-lying or flowing water, keep electricity away from water, follow official evacuation instructions, and call 112 if immediate help is needed.'
       : /fire|आग|आग लगी|आगी/.test(t0)
       ? 'Leave using the safest exit, do not use lifts, stay low in smoke, and call 112 or the fire service from a safe location.'
       : /earthquake|भूकंप|भूकंप|भूकंप/.test(t0)
       ? 'Drop, cover and hold on during shaking. After it stops, move away from damaged structures and follow official instructions.'
       : /road|blocked|सड़क|रस्ता|रस्ता/.test(t0)
       ? 'Avoid blocked or barricaded roads and use the highlighted safe route. Open the map to review the latest cached road status.'
       : 'Follow the latest authorized alert, move to a safer location when advised, keep your phone and GPS available if safe, and use SOS for immediate assistance.';
     reply(offlineAnswers,offlineAnswers,offlineAnswers);
     navigate('/guidelines');
     return;
   }
   if(/where am i|my location|मैं कहाँ|मेरी लोकेशन|माझे स्थान/.test(t0)){
     if(location) reply(`Your current location is approximately ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}.`,`आपकी वर्तमान लोकेशन लगभग ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} है।`,`तुमचे सध्याचे स्थान अंदाजे ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} आहे.`);
     else reply('Your location is not available yet. Please allow location access.','आपकी लोकेशन अभी उपलब्ध नहीं है। कृपया लोकेशन की अनुमति दें।','तुमचे स्थान अजून उपलब्ध नाही. कृपया स्थानाची परवानगी द्या.');
     navigate('/map'); return;
   }
   setToast(`SAI heard: “${text}”.`); reply('Try alerts, nearest shelter, risk, red zones, roads, map, weather, navigation or SOS.','अलर्ट, नज़दीकी आश्रय, जोखिम, रेड ज़ोन, सड़क, नक्शा, मौसम, नेविगेशन या SOS बोलकर देखें।','सूचना, जवळचा निवारा, धोका, रेड झोन, रस्ते, नकाशा, हवामान, नेव्हिगेशन किंवा SOS बोला.');
 };
 async function listen(){setState('LISTENING');try{const text=await listenOnce(lang);setState('PROCESSING');await execute(text);setState('IDLE');}catch(e){setState('ERROR');setToast(e.message);setTimeout(()=>setState('IDLE'),2200)}}
 const submitTyped=()=>{void execute(typed);setTyped('')};
 const offline=!online;
 const commands=lang==='Hindi'?['अलर्ट दिखाओ','नज़दीकी आश्रय','मेरे क्षेत्र का जोखिम','रेड ज़ोन दिखाओ','बंद सड़कें दिखाओ','मौसम दिखाओ','नक्शा खोलो','नेविगेशन शुरू करो','आपातकालीन SOS']:lang==='Marathi'?['सूचना दाखवा','जवळचा निवारा','माझ्या भागाचा धोका','रेड झोन दाखवा','बंद रस्ते दाखवा','हवामान दाखवा','नकाशा उघडा','नेव्हिगेशन सुरू करा','आपत्कालीन SOS']:['Show alerts','Find nearest shelter','Check my risk','Show red zones','Show blocked roads','Show weather','Open hazard map','Start navigation','Emergency SOS'];
 return <>{!open&&<button className="sai-fab" onClick={()=>setOpen(true)} aria-label="Open SAI"><img src={SAI_ICON} alt="SAI" className="sai-icon sai-fab-icon"/><span>SAI</span></button>}
 {open&&<div className="sai-panel"><div className="sai-head"><div className="sai-head-brand"><img src={SAI_ICON} alt="SAI"/><div><strong>SAI</strong><small>Safety AI · {lang}</small></div></div><button className="icon-btn" onClick={()=>setOpen(false)}><X/></button></div>
 <div className={`sai-orb ${state.toLowerCase()}`}><img src={SAI_ICON} alt="SAI" className="sai-icon sai-orb-icon"/><span>{state==='IDLE'?'Hey SAI':state}</span></div>
 {offline&&<div className="sai-offline"><WifiOff size={15}/> Offline mode: cached commands and citizen-safe data remain available.</div>}
 <button className="sai-listen" onClick={listen} disabled={state==='LISTENING'}><Mic/> {state==='LISTENING'?'Listening…':state==='PROCESSING'?'Processing…':state==='ERROR'?'Try again':'Tap to speak'}</button>
 <div className="sai-typed"><Keyboard size={15}/><input value={typed} onChange={e=>setTyped(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submitTyped()} placeholder={lang==='Hindi'?'या command लिखें…':lang==='Marathi'?'किंवा command लिहा…':'Or type a command…'}/><button onClick={submitTyped} disabled={!typed.trim()}><Send size={15}/></button></div>
 <div className="command-grid">{commands.map(c=><button key={c} onClick={()=>void execute(c)}><Volume2 size={14}/>{c}</button>)}</div>
 <div className="sai-status"><ShieldCheck size={14}/> Voice uses your browser microphone and speech recognition.</div>
 <button className="sai-language-note" onClick={()=>navigate('/profile')}><Settings2/> Change SAI language in Profile</button></div>}</>;
}
