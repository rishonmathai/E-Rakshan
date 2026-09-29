import { useEffect, useState } from "react";
import { UsersRound, Plus, MapPin, ShieldCheck, Phone, Trash2, X, Share2, CheckCircle2, UserRound, HeartPulse, Link2, Copy, LocateFixed, Clock3 } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { useApp } from "../../context/AppContext";
import { getCurrentLocation, watchCurrentLocation } from "../../services/location/locationService";

export default function Family(){
 const {store,family,addFamilyMember,updateFamilyMember,removeFamilyMember,setToast}=useApp();
 const [open,setOpen]=useState(false);
 const [form,setForm]=useState({name:"",relation:"",phone:"",age:"",bloodGroup:"",locationSharing:true});
 const [sharingId,setSharingId]=useState(null);
 const [shareLinks,setShareLinks]=useState({});
 const members=family?.members||[];
 const update=(k,v)=>setForm(f=>({...f,[k]:v}));

 useEffect(()=>{
   if(!sharingId)return;
   const stop=watchCurrentLocation(pos=>updateFamilyMember(sharingId,{connected:true,lastLocation:{...pos,timestamp:new Date().toISOString()}}),()=>{});
   return()=>stop?.();
 },[sharingId]);

 const add=()=>{
   if(!form.name.trim()||!form.relation||!/^(\d{10})$/.test(form.phone.replace(/\D/g,''))){setToast("Enter name, relation and a valid 10-digit mobile number.");return}
   addFamilyMember({...form,id:`family-${Date.now()}`,phone:"+91 "+form.phone.replace(/\D/g,''),connected:false,lastLocation:null,shareToken:null});
   setForm({name:"",relation:"",phone:"",age:"",bloodGroup:"",locationSharing:true});
   setOpen(false);setToast("Family member added to your primary safety circle.");
 };

 const startSharing=async(member)=>{
   try{
     const loc=await getCurrentLocation();
     updateFamilyMember(member.id,{locationSharing:true,connected:true,lastLocation:{...loc,timestamp:new Date().toISOString()}});
     setSharingId(member.id);
     setToast(`${member.name}'s location sharing is active on this device.`);
   }catch{setToast('Allow location permission to start live sharing.');}
 };
 const stopSharing=(member)=>{if(sharingId===member.id)setSharingId(null);updateFamilyMember(member.id,{locationSharing:false});setToast(`${member.name}'s location sharing was stopped.`)};
 const createLink=async(member)=>{
   const latest=member.lastLocation;
   const base=window.location.origin;
   const token=btoa(unescape(encodeURIComponent(JSON.stringify({memberId:member.id,name:member.name,relation:member.relation,phone:member.phone,location:latest,createdAt:new Date().toISOString()}))));
   const url=`${base}/family-share?token=${encodeURIComponent(token)}`;
   setShareLinks(x=>({...x,[member.id]:url}));
   try{await navigator.clipboard?.writeText(url);setToast('Family location link copied.');}catch{setToast('Share link generated.');}
 };
 const shareInvite=async(member)=>{
   const url=shareLinks[member.id];
   const text=`E-Rakshan Family Safety Circle\n${member.name} (${member.relation})\n${url||'Open the Family Safety Circle in E-Rakshan to view the latest shared details.'}`;
   try{if(navigator.share)await navigator.share({title:'E-Rakshan Family Safety',text});else{await navigator.clipboard?.writeText(text);setToast('Family link copied.')}}catch{}
 };

 return <div className="page family-page">
   <PageHeader title="Family Safety Circle" subtitle="One primary account can coordinate your household's safety"/>
   <section className="family-hero"><div className="family-hero-icon"><UsersRound/></div><div><span className="live-indicator"><i/> PRIMARY ACCOUNT</span><h2>{store.user?.name||"Primary Citizen"} manages the family</h2><p>Keep family profiles, emergency contacts, location-sharing preferences and latest shared locations together. Members can be managed from this primary account.</p></div></section>
   <div className="family-stats"><div><b>{members.length}</b><span>Linked members</span></div><div><b>{members.filter(x=>x.locationSharing).length}</b><span>Location sharing on</span></div><div><b>{members.filter(x=>x.connected).length}</b><span>Connected devices</span></div></div>
   <div className="section-head"><h3>Family members</h3><button className="primary-btn" onClick={()=>setOpen(true)}><Plus/> Add member</button></div>
   <div className="family-list">{members.map(member=><article className="family-card" key={member.id}>
     <div className="family-avatar">{member.name.slice(0,2).toUpperCase()}</div>
     <div className="family-main">
       <div className="family-title"><div><h3>{member.name}</h3><span>{member.relation}{member.age?` · ${member.age} yrs`:''}</span></div><span className={`family-status ${member.locationSharing?'sharing':'off'}`}><i/>{member.locationSharing?'Location sharing on':'Location sharing off'}</span></div>
       <div className="family-meta"><span><Phone size={12}/>{member.phone}</span><span><HeartPulse size={12}/>{member.bloodGroup||'Blood group not set'}</span></div>
       <div className="family-location"><MapPin size={14}/><span>{member.connected&&member.lastLocation?`Latest ${member.lastLocation.lat.toFixed(5)}, ${member.lastLocation.lng.toFixed(5)} · ${new Date(member.lastLocation.timestamp||Date.now()).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`:member.locationSharing?"Waiting for connected device location":"Location sharing is off"}</span></div>
       <div className="family-actions">
         {member.locationSharing?<button onClick={()=>stopSharing(member)}><MapPin/> Stop sharing</button>:<button onClick={()=>startSharing(member)}><LocateFixed/> Start sharing</button>}
         <button onClick={()=>createLink(member)}><Link2/> Generate link</button>
         <button onClick={()=>shareInvite(member)}><Share2/> Share</button>
         <button className="family-delete" onClick={()=>{if(sharingId===member.id)setSharingId(null);removeFamilyMember(member.id);setToast("Family member removed.")}}><Trash2/></button>
       </div>
       {shareLinks[member.id]&&<div className="family-share-link"><Link2/><input value={shareLinks[member.id]} readOnly/><button onClick={async()=>{await navigator.clipboard?.writeText(shareLinks[member.id]);setToast('Link copied.')}}><Copy/></button></div>}
       {sharingId===member.id&&<div className="family-live-note"><span className="live-indicator"><i/> LIVE SHARING</span><Clock3/> Location updates are being captured from this device while sharing remains enabled.</div>}
     </div>
   </article>)}</div>
   <section className="family-privacy"><ShieldCheck/><div><b>Private by design</b><p>Location sharing requires consent. The generated link contains the latest shared snapshot; with a configured authorized backend, the same session can be used for live cross-device updates.</p></div></section>

   {open&&<div className="modal-backdrop" onClick={()=>setOpen(false)}><div className="settings-modal family-modal" onClick={e=>e.stopPropagation()}>
     <button className="icon-btn modal-close" onClick={()=>setOpen(false)}><X/></button><h2>Add family member</h2><p>Add a person you are responsible for to your private Family Safety Circle.</p>
     <label>Full name *</label><div className="auth-input"><UserRound/><input value={form.name} onChange={e=>update("name",e.target.value)} placeholder="Family member name"/></div>
     <div className="two-field-grid"><div><label>Relation *</label><select className="strict-select" value={form.relation} onChange={e=>update("relation",e.target.value)}><option value="">Select</option><option>Parent</option><option>Spouse</option><option>Child</option><option>Sibling</option><option>Other</option></select></div><div><label>Age</label><input className="strict-select" value={form.age} onChange={e=>update("age",e.target.value.replace(/\D/g,''))} placeholder="Age"/></div></div>
     <label>Mobile number *</label><div className="auth-input"><Phone/><span>+91</span><input inputMode="numeric" maxLength="10" value={form.phone} onChange={e=>update("phone",e.target.value.replace(/\D/g,''))} placeholder="9876543210"/></div>
     <label>Blood group</label><select className="strict-select" value={form.bloodGroup} onChange={e=>update("bloodGroup",e.target.value)}><option value="">Unknown</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(x=><option key={x}>{x}</option>)}</select>
     <label className="family-check"><input type="checkbox" checked={form.locationSharing} onChange={e=>update("locationSharing",e.target.checked)}/><span>Enable location-sharing preference</span></label>
     <div className="modal-actions"><button className="secondary-btn" onClick={()=>setOpen(false)}>Cancel</button><button className="primary-btn" onClick={add}><CheckCircle2/> Add member</button></div>
   </div></div>}
 </div>;
}
