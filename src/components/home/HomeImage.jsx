export default function HomeImage({ src, alt = "", className = "" }) {
  return (
    <span className={`home-image-slot ${className}`}>
      <img src={src} alt={alt} onError={(event) => { event.currentTarget.hidden = true; }} />
      <span className="home-image-fallback" aria-hidden="true">+</span>
    </span>
  );
}
