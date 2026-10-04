import { useState } from "react";

export default function CollectibleSprite({ item, size = "tile", className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const sprite = item?.sprite;
  const sheet = item?.sheet;
  const classes = `collectible-sprite collectible-sprite-${size} ${className}`.trim();

  if (!sprite || !sheet || imageFailed) {
    return <span className={`${classes} collectible-sprite-fallback`} role="img" aria-label={item?.name || "Koleksi"}>{item?.emoji || "?"}</span>;
  }

  const ratio = (sheet.width * 3) / (sheet.height * 5);
  return (
    <span
      className={classes}
      role="img"
      aria-label={item.name}
      style={{ "--sprite-ratio": ratio, "--sprite-column": sprite.column, "--sprite-row": sprite.row }}
    >
      <img src={sheet.src} alt="" aria-hidden="true" onError={() => setImageFailed(true)} />
    </span>
  );
}
