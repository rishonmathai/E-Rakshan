import { useState } from "react";
import { Mic, Volume2, VolumeX, WifiOff } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { speak, stopSpeaking } from "../../services/voice/voiceService";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";

export default function Voice() {
  const [active,setActive]=useState(false); const navigate=useNavigate(); const {store, updateSettings}=useApp();
  const demo="Move right in 600 meters. Continue for 1 kilometer.";
  const toggle=()=>{setActive(a=>!a); if(!active)speak(demo); else stopSpeaking();};
  return <div className="page"><PageHeader title="Voice Guidance" subtitle="Spoken directions and critical alerts"/>
    <section className="voice-hero"><div className={`voice-orb ${active?"active":""}`}><Mic size={58}/></div><p className="eyebrow">{active?"SPEAKING":"READY"}</p><h2>SAI Voice Guidance</h2><p>Visual arrows and spoken instructions work together during navigation.</p><button className="primary-btn" onClick={toggle}>{active?<><VolumeX/> Stop voice</>:<><Volume2/> Test voice guidance</>}</button></section>
    <div className="voice-settings"><div><b>Spoken critical alerts</b><span>Announce high-priority government alerts when enabled.</span></div><button className={`switch ${store.settings.voiceAlerts?"on":""}`} onClick={()=>updateSettings({voiceAlerts:!store.settings.voiceAlerts})} aria-label="Toggle voice alerts"><i/></button><div><b>Navigation voice</b><span>Automatically speak turn instructions.</span></div><button className={`switch ${store.settings.navigationVoice?"on":""}`} onClick={()=>updateSettings({navigationVoice:!store.settings.navigationVoice})} aria-label="Navigation voice enabled"><i/></button></div>
    <div className="offline-banner"><WifiOff/><div><b>Works with limitations offline</b><p>Previously available navigation instructions can still be shown. Live voice data needs connectivity.</p></div></div>
    <button className="secondary-btn full" onClick={()=>navigate("/navigation")}>Open Navigation</button>
  </div>;
}
