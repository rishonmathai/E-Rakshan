import { useState } from 'react';
import { WifiOff, ArrowRight, CheckCircle2, UserRound, Phone, LockKeyhole, ShieldCheck, Sparkles, CalendarDays, MapPin, HeartPulse, UsersRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { demoUser } from '../../data/mockData';
import { t } from '../../i18n';

const initial={name:'',dob:'',gender:'',bloodGroup:'',address:'',emergencyContactName:'',emergencyContactPhone:'',emergencyContactRelation:'',medicalNotes:''};

export default function Login(){
  const [mode,setMode]=useState('register');
  const [form,setForm]=useState(initial);
  const [phone,setPhone]=useState(''); const [otp,setOtp]=useState(''); const [sent,setSent]=useState(false);
  const navigate=useNavigate(); const {setAuth,setToast,store}=useApp(); const lang=store.settings.language;
  const set=(key,value)=>setForm(f=>({...f,[key]:value}));

  const validRegistration=()=>{
    const required=[
      ['name','full name'],['dob','date of birth'],['gender','gender'],['bloodGroup','blood group'],
      ['address','current address'],['emergencyContactName','emergency contact name'],
      ['emergencyContactPhone','emergency contact number'],['emergencyContactRelation','emergency contact relation']
    ];
    const missing=required.find(([k])=>!String(form[k]||'').trim());
    if(missing){setToast(`Please enter your ${missing[1]}.`);return false;}
    if(!/^\d{10}$/.test(phone)){setToast('Enter a valid 10-digit mobile number.');return false}
    if(!/^\d{10}$/.test(form.emergencyContactPhone.replace(/\D/g,''))){setToast('Enter a valid 10-digit emergency contact number.');return false}
    return true;
  };

  const sendOtp=()=>{
    if(mode==='register'&&!validRegistration())return;
    if(mode==='login'&&!/^\d{10}$/.test(phone)){setToast('Enter a valid 10-digit mobile number.');return}
    setSent(true);setToast('Demo OTP sent. Use 123456.');
  };

  const submit=()=>{
    if(otp!=='123456'){setToast('Demo OTP is 123456.');return}
    const user=mode==='register'
      ? {...demoUser,...form,phone:'+91 '+phone,profileComplete:true}
      : {...(store.user||demoUser),phone:'+91 '+phone,profileComplete:true};
    setAuth(true,user);
    navigate('/home');
  };

  const switchMode=m=>{setMode(m);setSent(false);setOtp('');};

  const offline=()=>{
    if(store.user?.profileComplete){setAuth(true,store.user);navigate('/home');return;}
    setToast('Offline access is available after a citizen profile has been registered and synchronized on this device.');
  };

  return <div className="auth-page auth-modern">
    <div className="auth-decor auth-decor-one"/><div className="auth-decor auth-decor-two"/>
    <main className="auth-card strict-auth-card">
      <div className="auth-logo-word"><strong>E-Rakshan</strong><span>Citizen App</span></div>
      <div className="auth-welcome"><span><ShieldCheck size={14}/> Secure citizen identity</span><h1>{sent?'Verify your mobile':mode==='register'?'Create your secure account':'Welcome back'}</h1><p>{sent?'Enter the one-time password to continue.':'Your verified profile helps authorized responders provide the right assistance during an emergency.'}</p></div>
      <div className="auth-tabs"><button className={mode==='register'?'active':''} onClick={()=>switchMode('register')}>{t('Register',lang)}</button><button className={mode==='login'?'active':''} onClick={()=>switchMode('login')}>{t('Login',lang)}</button></div>

      {!sent&&mode==='register'&&<div className="strict-profile-fields">
        <div className="field-section-title"><UsersRound size={15}/><span>Citizen details</span><small>Required for emergency assistance</small></div>
        <label>{t('Full name',lang)} *</label>
        <div className="auth-input"><UserRound/><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Your full name" autoComplete="name"/></div>
        <div className="two-field-grid">
          <div><label>Date of birth *</label><div className="auth-input"><CalendarDays/><input type="date" value={form.dob} onChange={e=>set('dob',e.target.value)}/></div></div>
          <div><label>Gender *</label><select className="strict-select" value={form.gender} onChange={e=>set('gender',e.target.value)}><option value="">Select</option><option>Female</option><option>Male</option><option>Other</option><option>Prefer not to say</option></select></div>
        </div>
        <div className="two-field-grid">
          <div><label>Blood group *</label><select className="strict-select" value={form.bloodGroup} onChange={e=>set('bloodGroup',e.target.value)}><option value="">Select</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'].map(x=><option key={x}>{x}</option>)}</select></div>
          <div><label>Mobile number *</label><div className="auth-input"><Phone/><span>+91</span><input inputMode="numeric" maxLength="10" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="9876543210" autoComplete="tel"/></div></div>
        </div>
        <label><MapPin size={13}/> Current address *</label>
        <div className="auth-input"><MapPin/><input value={form.address} onChange={e=>set('address',e.target.value)} placeholder="City / district / address"/></div>

        <div className="field-section-title emergency-field-title"><HeartPulse size={15}/><span>Emergency contact</span><small>Someone responders can reach</small></div>
        <div className="two-field-grid">
          <div><label>Contact name *</label><div className="auth-input"><UserRound/><input value={form.emergencyContactName} onChange={e=>set('emergencyContactName',e.target.value)} placeholder="Family member"/></div></div>
          <div><label>Relation *</label><select className="strict-select" value={form.emergencyContactRelation} onChange={e=>set('emergencyContactRelation',e.target.value)}><option value="">Select</option><option>Parent</option><option>Spouse</option><option>Sibling</option><option>Child</option><option>Friend</option><option>Other</option></select></div>
        </div>
        <label>Contact number *</label>
        <div className="auth-input"><Phone/><span>+91</span><input inputMode="numeric" maxLength="10" value={form.emergencyContactPhone} onChange={e=>set('emergencyContactPhone',e.target.value.replace(/\D/g,''))} placeholder="Emergency contact number"/></div>
        <label>Important medical notes <span className="optional-label">(optional)</span></label>
        <textarea className="strict-textarea" value={form.medicalNotes} onChange={e=>set('medicalNotes',e.target.value)} placeholder="Allergies, accessibility needs or essential information for responders"/>
      </div>}

      {!sent&&mode==='login'&&<><label>{t('Mobile number',lang)}</label><div className="auth-input"><Phone/><span>+91</span><input inputMode="numeric" maxLength="10" value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="9876543210" autoComplete="tel"/></div></>}

      {sent&&<div className="otp-banner"><LockKeyhole/><div><b>OTP verification</b><small>Demo OTP sent to +91 {phone}</small></div><button onClick={()=>setSent(false)}>Edit</button></div>}
      {sent&&<><label>One-time password</label><input className="text-input otp-input" inputMode="numeric" maxLength="6" value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} placeholder="123456" autoComplete="one-time-code"/></>}
      {!sent?<button className="primary-btn full auth-submit" onClick={sendOtp}>{mode==='register'?'Review & Send OTP':t('Send OTP',lang)} <ArrowRight/></button>:<button className="primary-btn full auth-submit" onClick={submit}>{t('Verify & Continue',lang)} <CheckCircle2/></button>}

      <div className="auth-benefits"><span><CheckCircle2/> Verified alerts</span><span><CheckCircle2/> Safe routes</span><span><CheckCircle2/> Emergency profile</span></div>
      <div className="or"><span>or</span></div>
      <button className="offline-btn" onClick={offline}><WifiOff/> {t('Use Offline Mode',lang)} <small>Open previously synchronized citizen-safe information</small></button>
      <div className="auth-footer"><Sparkles size={13}/> Demo mode · OTP: <b>123456</b></div>
    </main>
  </div>;
}
