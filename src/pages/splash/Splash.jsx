import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { ShieldCheck, MapPinned, WifiOff, Mic, BellRing, Navigation2 } from "lucide-react";

export default function Splash() {
  const navigate = useNavigate();
  const { store } = useApp();
  useEffect(() => {
    const t = setTimeout(() => navigate(store.onboardingDone ? (store.authenticated ? "/home" : "/login") : "/onboarding", { replace:true }), 3000);
    return () => clearTimeout(t);
  }, [navigate, store.onboardingDone, store.authenticated]);

  return <div className="splash premium-splash">
    <div className="splash-grid-glow"></div><div className="splash-bg-orb splash-bg-orb-a"></div><div className="splash-bg-orb splash-bg-orb-b"></div>
    <div className="splash-content">
      <div className="splash-brand-lockup">
        <div className="splash-mark-ring"><img src="/assets/e-rakshan-mark.svg" alt="E-Rakshan"/></div>
        <div className="splash-wordmark"><strong>E-Rakshan</strong><span>Citizen App</span></div>
      </div>
      <span className="splash-kicker"><i/> GOVERNMENT-CONNECTED CITIZEN SAFETY</span>
      <div className="splash-tag">Be Informed. Be Prepared.<br/><span>Be Safe.</span></div>
      <p className="splash-subtitle">Real-time safety information, hazard-aware navigation, emergency assistance, offline protection and SAI guidance — designed to stay useful when it matters.</p>
      <div className="splash-feature-row">
        <div><ShieldCheck/><span>Trusted safety</span></div><div><Navigation2/><span>Safe navigation</span></div><div><MapPinned/><span>Live maps</span></div><div><WifiOff/><span>Offline ready</span></div><div><Mic/><span>SAI voice</span></div><div><BellRing/><span>Live alerts</span></div>
      </div>
      <div className="splash-progress"><span></span></div>
      <div className="splash-status"><span><i/> SYSTEM READY</span><small>Preparing your safety workspace…</small></div>
    </div>
    <div className="splash-footer">E-Rakshan Citizen App · Your safety companion</div>
  </div>;
}
