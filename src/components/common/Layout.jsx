import { useEffect, useRef, useState } from "react";
import { Menu, X, Home, Map, Bell, Navigation, ShieldAlert, WifiOff, BookOpen, UserRound, RefreshCw, UsersRound, GripVertical } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import BottomNav from "./BottomNav";
import SAI from "../voice/SAI";
import { useApp } from "../../context/AppContext";

const links = [
  ["/home","Home",Home], ["/map","Live Map",Map], ["/navigation","Navigation",Navigation],
  ["/alerts","Alerts",Bell], ["/shelters","Safe Shelters",ShieldAlert],
  ["/sos","Emergency SOS",ShieldAlert], ["/offline","Offline Mode",WifiOff],
  ["/guidelines","Safety Guidelines",BookOpen], ["/family","Family Safety",UsersRound], ["/profile","Profile & Settings",UserRound]
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const [now,setNow]=useState(new Date());
  const [sidebarWidth,setSidebarWidth]=useState(()=>{ const n=Number(localStorage.getItem('erakshan.sidebarWidth')); return Number.isFinite(n)?Math.min(340,Math.max(220,n)):260; });
  const drag=useRef(null);
  const { store, sync, online } = useApp();
  useEffect(()=>{const id=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(id)},[]);
  const navigate = useNavigate();

  useEffect(()=>{
    const move=(e)=>{
      if(!drag.current) return;
      const next=drag.current.startWidth + (e.clientX-drag.current.startX);
      if(next<185){ setOpen(false); drag.current=null; return; }
      const w=Math.min(340,Math.max(220,next));
      setSidebarWidth(w); document.documentElement.style.setProperty('--sidebar-width',`${w}px`);
    };
    const up=()=>{ if(drag.current){ localStorage.setItem('erakshan.sidebarWidth',String(sidebarWidth)); drag.current=null; } };
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
    return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up)};
  },[sidebarWidth]);

  useEffect(()=>{ document.documentElement.style.setProperty('--sidebar-width',`${sidebarWidth}px`); },[sidebarWidth]);

  const startDrag=(e)=>{
    e.preventDefault();
    drag.current={startX:e.clientX,startWidth:sidebarWidth};
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-top"><Logo compact/><button className="icon-btn mobile-only" onClick={() => setOpen(false)}><X/></button></div>
        <div className="sidebar-brand"><Logo/><p>Be Informed. Be Prepared. Be Safe.</p></div>
        <nav className="side-nav">
          {links.map(([to,label,Icon]) => <NavLink key={to} to={to} onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}><Icon size={19}/><span>{label}</span></NavLink>)}
        </nav>
        <button className="sync-side" onClick={() => sync()}><RefreshCw size={17}/>Sync citizen data</button>
        <div className="sidebar-footer">
          <span className={`dot ${store.sync.status === "SYNCING" ? "pulse" : ""}`}></span>
          {store.sync.lastSynced ? `Last sync ${new Date(store.sync.lastSynced).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}` : "Not synchronized"}
        </div>
        <button className="sidebar-drag-handle" onPointerDown={startDrag} aria-label="Drag to resize or close menu" title="Drag to resize / close"><GripVertical size={16}/></button>
      </aside>
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <main className="main-content">
        <div className="mobile-topbar"><button className="icon-btn" onClick={() => setOpen(true)}><Menu/></button><Logo compact/><span className="online-mini"><i/> {online ? "Online" : "Offline"}</span></div>
        <div className="global-live-bar"><span className="live-indicator"><i/> LIVE</span><span>{online?"Government data connection active":"Offline · Showing synchronized data"}</span><strong>{now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit",second:"2-digit"})}</strong></div>
        {children}
      </main>
      <BottomNav/>
      <SAI/>
    </div>
  );
}
