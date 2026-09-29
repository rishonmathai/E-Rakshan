import { useMemo, useState } from "react";
import { Backpack, ShieldCheck, HeartHandshake, ChevronDown, Sparkles, Wand2, CheckCircle2, AlertTriangle } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { guidelines } from "../../data/mockData";
import { useApp } from "../../context/AppContext";

const icons={Before:Backpack,During:ShieldCheck,After:HeartHandshake};
const situations=["All emergencies","Flood / Heavy rain","Landslide / Flood","Earthquake","Fire","Lightning / Thunderstorm","Family preparedness","Evacuation","Recovery"];

const aiGuides={
 "Flood / Heavy rain":[
   ["Move to higher ground when advised.","Avoid rivers, drains, bridges and low-lying roads. Never walk or drive through moving floodwater.","During flood conditions"],
   ["Keep essential items with you.","Carry water, medicines, ID, phone, power bank and emergency contacts.","Before evacuation"],
   ["Do not return without clearance.","Floodwater may hide electrical hazards, unstable structures and contaminated water.","After flooding"]
 ],
 "Earthquake":[
   ["Drop, cover and hold on.","Protect your head and neck and stay away from windows until the shaking stops.","During an earthquake"],
   ["Check for structural danger.","Do not enter visibly damaged buildings until authorities declare them safe.","After an earthquake"],
   ["Keep family communication simple.","Use a predefined meeting point and short status messages when networks are busy.","Family safety"]
 ],
 "Fire":[
   ["Use the nearest safe exit.","Do not use lifts and stay low if there is smoke.","During a fire"],
   ["Call emergency services from a safe location.","Give the exact location and follow fire-service instructions.","Emergency response"],
   ["Do not re-enter.","A building can remain unsafe even after flames are no longer visible.","After a fire"]
 ],
 "Landslide / Flood":[
   ["Move away from slopes and channels.","Avoid roads beneath unstable slopes and areas showing cracks or falling debris.","During landslide risk"],
   ["Do not cross a blocked road.","Turn back and use an officially designated safe route.","Travel safety"],
   ["Report new ground movement.","Use authorized channels to report cracks, debris or blocked access.","Post-event"]
 ],
 "Lightning / Thunderstorm":[
   ["Move indoors.","Avoid open fields, isolated trees, water and exposed metal structures.","During lightning"],
   ["Disconnect from unnecessary outdoor equipment.","Stay away from windows and exposed electrical equipment where practical.","During storm"],
   ["Wait before going outside.","Lightning can remain dangerous after the rain appears to ease.","After storm"]
 ],
 "Family preparedness":[
   ["Assign a family safety lead.","One primary account can coordinate contacts, safe locations and emergency updates for the household.","Before an emergency"],
   ["Record important needs.","Keep age, blood group and essential medical information current for each family member.","Preparedness"],
   ["Agree on a meeting point.","Choose a safe location and a backup communication method.","Preparedness"]
 ]
};

export default function Guidelines() {
 const {setToast}=useApp();
 const [tab,setTab]=useState("Before");
 const [open,setOpen]=useState(null);
 const [situation,setSituation]=useState("All emergencies");
 const [aiItems,setAiItems]=useState([]);
 const [generating,setGenerating]=useState(false);
 const [question,setQuestion]=useState('');
 const [aiAnswer,setAiAnswer]=useState('');
 const Icon=icons[tab];

 const items=useMemo(()=>[
   ...(guidelines[tab]||[]),
   ...aiItems
 ],[tab,aiItems]);

 const generateAI=async()=>{
   setGenerating(true);
   try{
     const prompt=question.trim()||`Give practical safety guidance for ${situation}.`;
     const apiUrl=import.meta.env.VITE_AI_API_URL;
     if(apiUrl){
       const r=await fetch(apiUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,language:'English',context:'Citizen emergency safety guidance'})});
       if(!r.ok)throw new Error('AI service unavailable');
       const data=await r.json();
       const answer=data.answer||data.text||data.response||'No answer returned.';
       setAiAnswer(answer);
       setAiItems([{title:question.trim()||`${situation} guidance`,details:answer,situation, id:`ai-${Date.now()}`,ai:true}]);
     }else{
       await new Promise(r=>setTimeout(r,550));
       const source=aiGuides[situation]||[["Follow current official instructions.","Use only verified alerts and do not enter an area under an active warning.","All emergencies"],["Keep your location and contacts ready.","If it is safe, keep GPS and emergency contacts available for responders.","Emergency assistance"],["Prepare for changing conditions.","Keep essential items ready and use the app's latest official updates.","Preparedness"]];
       const contextual=question.trim()?[["SAI safety response",`For “${question.trim()}”: ${source[0][1]} ${source[1][1]} If the situation is immediately dangerous, move to a safer location when authorities advise it and call 112.`,situation],...source]:source;
       setAiItems(contextual.map(([title,details,sit],i)=>({title,details,situation:sit,id:`ai-${Date.now()}-${i}`,ai:true})));
       setAiAnswer(contextual[0]?.[1]||'Follow current official instructions and contact emergency services for immediate danger.');
     }
     setToast(`AI-assisted guidance generated for ${situation}.`);
   }catch{setAiAnswer('The AI service is unavailable right now. Use the official guidance below and follow instructions from authorized authorities.');setToast('AI service unavailable; showing safe fallback guidance.');}
   finally{setGenerating(false)}
 };

 return <div className="page">
   <PageHeader title="Safety Guidelines" subtitle="Situation-based, expandable safety guidance"/>
   <div className="guide-tabs">{Object.keys(guidelines).map(t=><button className={tab===t?"active":""} onClick={()=>{setTab(t);setOpen(null)}} key={t}>{t}</button>)}</div>

   <section className="guide-hero">
     <div><Icon/></div><span>SAFETY GUIDE · {tab.toUpperCase()}</span>
     <h2>{tab === "Before" ? "Prepare before danger arrives." : tab === "During" ? "Stay calm and follow official instructions." : "Wait for clearance and stay cautious."}</h2>
   </section>

   <section className="ai-guide-panel">
     <div className="ai-guide-heading"><div className="ai-icon"><Sparkles/></div><div><b>AI-assisted safety guidance</b><small>Generate situation-specific reminders for the current scenario.</small></div></div>
     <div className="ai-question-row"><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Ask a safety question, e.g. What should I do if water enters my home?"/><button className="secondary-btn" onClick={()=>{setQuestion('');setAiAnswer('')}}>Clear</button></div>
     <div className="ai-guide-controls">
       <select value={situation} onChange={e=>setSituation(e.target.value)} aria-label="Emergency situation">
         {situations.map(x=><option key={x}>{x}</option>)}
       </select>
       <button className="primary-btn" onClick={generateAI} disabled={generating}><Wand2 size={16}/>{generating?"Generating…":"Generate with AI"}</button>
     </div>
     <small className="ai-disclaimer"><AlertTriangle size={13}/> AI guidance is supplementary. Always follow current instructions from authorized authorities.</small>{aiAnswer&&<div className="ai-answer"><Sparkles size={15}/><div><b>AI / SAI response</b><p>{aiAnswer}</p></div></div>}
   </section>

   <div className="guide-list">
     {items.map((x,i)=>{
       const isOpen=open===x.id;
       return <article key={x.id||x.title} className={`${isOpen?"expanded":""} ${x.ai?"ai-generated":""}`}>
         <button className="guide-row-btn" onClick={()=>setOpen(isOpen?null:(x.id||x.title))}>
           <div className="guide-number">{i+1}</div>
           <span><b>{x.title||x}</b><small>{x.situation||"Safety guidance"}</small></span>
           {x.ai&&<span className="ai-badge"><Sparkles size={11}/> AI</span>}
           <ChevronDown size={18}/>
         </button>
         {isOpen&&<div className="guide-details"><CheckCircle2 size={16}/><p>{x.details||x}</p></div>}
       </article>
     })}
   </div>

   <div className="official-note"><ShieldCheck/><p><b>Official information matters.</b><br/>These are citizen-friendly reminders. Always follow current instructions from authorized authorities.</p></div>
 </div>;
}
