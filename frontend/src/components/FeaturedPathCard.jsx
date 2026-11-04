export default function FeaturedPathCard({ badge, title, topics, className = "" }) {
  const items = Array.isArray(topics) ? topics : [topics];
  const normalizedClassName = className.trim();

  return (
    <article className={`featured-path-card ${normalizedClassName}`.trim()}>
      <span className="featured-path-card__badge">{badge}</span>
      <h3>{title}</h3>
      <div className="featured-path-card__topics">
        {items
          .filter((item) => typeof item === "string" && item.trim().length > 0)
          .map((item) => (
            <span key={item}>{item}</span>
          ))}
      </div>
    </article>
  );
}
