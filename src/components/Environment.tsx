import styles from "./Environment.module.css";

/** One fixed background environment behind the page: star dust, a slow corona drift and grain. */
export function Environment() {
  return (
    <div className={styles.env} aria-hidden="true">
      <div className={styles.stars} />
      <div className={styles.glow} />
      <div className={styles.glow2} />
      <svg className={styles.grain} xmlns="http://www.w3.org/2000/svg">
        <filter id="env-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#env-grain)" />
      </svg>
    </div>
  );
}
