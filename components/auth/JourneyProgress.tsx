"use client";

export default function JourneyProgress({ steps, current, onBack, disabled = false, label }: {
  steps: string[]; current: number; onBack?: (step: number) => void; disabled?: boolean; label: string;
}) {
  return <nav className="wm-auth-journey__progress" aria-label={label}>
    <ol>{steps.map((name, index) => <li key={name} aria-current={index === current ? "step" : undefined} data-complete={index < current}>
      {onBack && index < current
        ? <button type="button" disabled={disabled} onClick={() => onBack(index)} aria-label={`${label} ${index + 1}: ${name}`}><span aria-hidden="true">{index + 1}</span><span>{name}</span></button>
        : <span><span aria-hidden="true">{index + 1}</span><span>{name}</span></span>}
    </li>)}</ol>
    <p aria-live="polite">{label} {current + 1} / {steps.length}<span>{steps[current]}</span></p>
  </nav>;
}
