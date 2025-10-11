export function Stars({ value }: { value: number }) {
  const numeric = Number.isFinite(value) ? value : 0;
  const v = Math.round(numeric * 2) / 2;
  return (
    <span aria-label={`${v} out of 5`}>
      {'★★★★★'.split('').map((s, i) => (
        <span key={i} style={{ opacity: i + 1 <= v ? 1 : 0.25 }}>{s}</span>
      ))}
    </span>
  );
}
