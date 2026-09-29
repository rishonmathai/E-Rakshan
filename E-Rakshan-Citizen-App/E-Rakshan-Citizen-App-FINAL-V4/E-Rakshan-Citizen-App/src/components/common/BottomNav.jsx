import { Home, Map, Bell, ShieldAlert, MoreHorizontal } from "lucide-react";
import { NavLink } from "react-router-dom";
const items = [
  ["/home","Home",Home], ["/map","Map",Map], ["/alerts","Alerts",Bell], ["/sos","SOS",ShieldAlert], ["/profile","More",MoreHorizontal]
];
export default function BottomNav() {
  return <nav className="bottom-nav">{items.map(([to,label,Icon]) =>
    <NavLink key={to} to={to} className={({isActive}) => isActive ? "active" : ""}>
      <Icon size={20}/><span>{label}</span>
    </NavLink>
  )}</nav>;
}
