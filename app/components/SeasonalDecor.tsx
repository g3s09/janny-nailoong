export default function SeasonalDecor({ kind }: { kind: string }) {
  const motif =
    { flowers: "✿", hearts: "♡", birthday: "✦", winter: "❄", stars: "✧" }[
      kind
    ] || "✧";
  return (
    <div className={`seasonal-decor decor-${kind}`} aria-hidden="true">
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${5 + i * 8}%`,
            top: `${6 + (i % 3) * 3}%`,
            animationDelay: `-${i * 0.4}s`,
          }}
        >
          {motif}
        </span>
      ))}
      {kind === "birthday" && <div className="birthday-garland">PARA TI ♡</div>}
    </div>
  );
}
