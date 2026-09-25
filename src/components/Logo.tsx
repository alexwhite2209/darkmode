/** DARK MODE wordmark, traced from the original logo (production/brand/wordmark-geometry.json). */
type Props = {
  variant?: "inline" | "stacked";
  className?: string;
  /** unique prefix for gradient ids when several logos share a page */
  idPrefix?: string;
  title?: string;
};

const DARK =
  "M170,322H288A93,93 0 0 1 288,508H170V463.5H288A48.5,48.5 0 0 0 288,366.5H170Z" +
  "M495,322L537,322L650.5,508L599.5,508L516,371L432.5,508L381.5,508Z" +
  "M653,322H775A61,61 0 0 1 796.6,439L833.5,508H777.5L724.7,444H687L655,404H775A20,20 0 0 0 775,364H653Z" +
  "M871,322L914,322L914,508L871,508Z" +
  "M1020,322L1080,322L978,415L1080,508L1020,508L918,415Z";

const MODE =
  "M170,541L212,541L288,624L362,541L406,541L406,727L362,727L362,607L288,687L212,606L212,727L170,727Z" +
  "M722,541H817A93,93 0 0 1 817,727H722V682.5H817A48.5,48.5 0 0 0 817,585.5H722Z" +
  "M936,541L1085,541L1085,580L936,580Z" +
  "M936,612L1085,612L1085,651L936,651Z" +
  "M936,687L1085,687L1085,727L936,727Z";

export function Logo({ variant = "inline", className, idPrefix = "dm", title = "DARK MODE" }: Props) {
  const chrome = `${idPrefix}-chrome`;
  const ring = `${idPrefix}-ring`;
  const inline = variant === "inline";
  // inline: MODE row moved to the right of DARK on the same baseline
  const dx = inline ? 985 : 0;
  const dy = inline ? -219 : 0;
  const viewBox = inline ? "160 280 1925 276" : "160 300 935 490";
  const cx = 564 + dx;
  const cy = 636 + dy;
  return (
    <svg className={className} viewBox={viewBox} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <defs>
        <linearGradient id={chrome} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f7f8fa" />
          <stop offset="0.46" stopColor="#c3c6cd" />
          <stop offset="0.52" stopColor="#8e929a" />
          <stop offset="1" stopColor="#eceef1" />
        </linearGradient>
        <linearGradient id={ring} x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0" stopColor="#b8410e" />
          <stop offset="0.55" stopColor="#ff7a1a" />
          <stop offset="0.85" stopColor="#ffd9a6" />
          <stop offset="1" stopColor="#ff9a3c" />
        </linearGradient>
      </defs>
      <g fill={`url(#${chrome})`}>
        <path d={DARK} />
        <path d={MODE} transform={`translate(${dx} ${dy})`} />
      </g>
      <circle cx={cx} cy={cy} r={128} fill="#020203" stroke={`url(#${ring})`} strokeWidth={inline ? 16 : 10} />
    </svg>
  );
}
