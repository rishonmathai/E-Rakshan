import { useState } from "react";
import { BellRing, Map, ShieldCheck, Navigation, Mic, WifiOff, Siren, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";

const slides = [
  ["Stay Alert","Real-time alerts from verified sources.",BellRing],
  ["See the Risk","Explore hazards, red zones and roads on one map.",Map],
  ["Find Safe Places","Discover nearby shelters and safe sites.",ShieldCheck],
  ["Navigate Safely","Choose routes with hazard and blockage awareness.",Navigation],
  ["Talk to SAI","Use “Hey SAI” for quick safety actions.",Mic],
  ["Stay Connected Offline","Access previously synchronized essential information.",WifiOff],
  ["Emergency SOS","Hold to activate a safe, deliberate emergency flow.",Siren]
];

export default function Onboarding() {
  const [i,setI] = useState(0);
  const navigate = useNavigate();
  const { setOnboardingDone } = useApp();
  const finish = () => { setOnboardingDone(); navigate("/login"); };
  const [title,desc,Icon] = slides[i];
  return <div className="onboarding">
    <button className="skip-btn" onClick={finish}>Skip</button>
    <div className="onboard-art"><div className="mountain"></div><div className="onboard-icon"><Icon size={48}/></div></div>
    <div className="onboard-content"><div className="dots">{slides.map((_,n)=><i key={n} className={n===i?"active":""}></i>)}</div><p className="eyebrow">E-RAKSHAN CITIZEN APP</p><h1>{title}</h1><p>{desc}</p></div>
    <div className="onboard-actions">
      <button className="secondary-btn" disabled={i===0} onClick={()=>setI(i-1)}><ChevronLeft/>Previous</button>
      {i < slides.length-1 ? <button className="primary-btn" onClick={()=>setI(i+1)}>Next<ChevronRight/></button> : <button className="primary-btn" onClick={finish}>Get Started</button>}
    </div>
  </div>;
}
