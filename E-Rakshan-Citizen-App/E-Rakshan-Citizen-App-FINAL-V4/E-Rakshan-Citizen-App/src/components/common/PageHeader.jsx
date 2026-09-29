import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function PageHeader({ title, subtitle, back = true, right }) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      <div className="header-left">
        {back && <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Go back"><ArrowLeft size={20}/></button>}
        <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      </div>
      {right}
    </header>
  );
}
