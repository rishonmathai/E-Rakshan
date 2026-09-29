import { useMemo } from 'react';
import { MapPin, ShieldCheck, Phone, UsersRound } from 'lucide-react';

export default function FamilyShare(){
 const token=new URLSearchParams(window.location.search).get('token');
 const data=useMemo(()=>{try{return JSON.parse(decodeURIComponent(escape(atob(token||''))))}catch{return null}},[token]);
 if(!data)return <div className="family-share-page"><div className="family-share-card"><ShieldCheck/><h1>Family Safety Link</h1><p>This link is invalid or incomplete.</p></div></div>;
 const loc=data.location;
 return <div className="family-share-page"><div className="family-share-card"><div className="family-share-brand"><UsersRound/><span>E-Rakshan Family Safety</span></div><span className="live-indicator"><i/> SHARED LOCATION</span><h1>{data.name}</h1><p>{data.relation} · Shared from a primary family account</p><div className="family-share-location"><MapPin/><div><b>{loc?`${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`:'Location not available'}</b><small>{loc?.timestamp?new Date(loc.timestamp).toLocaleString():'No location timestamp'}</small></div></div>{data.phone&&<a className="primary-btn full" href={`tel:${data.phone}`}><Phone/> Call family member</a>}{loc&&<a className="secondary-btn full" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`}><MapPin/> Open location in Maps</a>}<div className="family-share-warning"><ShieldCheck/><span>This page shows the latest snapshot included in the shared link. A configured authorized backend is required for continuous cross-device live updates.</span></div></div></div>;
}
