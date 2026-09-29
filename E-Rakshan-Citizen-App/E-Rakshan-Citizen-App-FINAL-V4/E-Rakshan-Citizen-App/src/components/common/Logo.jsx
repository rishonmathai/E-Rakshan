export default function Logo({ compact = false }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`} aria-label="E-Rakshan Citizen App">
      <div className="brand-text-only">
        <strong>E-Rakshan</strong>
        {!compact && <span>Citizen App</span>}
      </div>
    </div>
  );
}
