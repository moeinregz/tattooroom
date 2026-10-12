export default function StarRating({ value = 0, size = 16, interactive = false, onChange }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <span className="star-rating" style={{ '--star-size': `${size}px` }}>
      {stars.map((s) => (
        <span
          key={s}
          className={`star ${s <= Math.round(value) ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
          onClick={interactive ? () => onChange?.(s) : undefined}
          role={interactive ? 'button' : undefined}
          aria-label={interactive ? `${s} ستاره` : undefined}
        >
          ★
        </span>
      ))}
    </span>
  );
}
