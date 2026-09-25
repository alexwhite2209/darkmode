import { Fragment } from "react";

/**
 * Splits text into words that slide up from under their line (use with data-reveal="words").
 * Screen readers get the plain sentence; the animated copy is hidden from them.
 */
export function SplitWords({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <>
      <span className="sr-only">{text}</span>
      <span className="words" aria-hidden="true" style={delay ? ({ "--d": `${delay}ms` } as React.CSSProperties) : undefined}>
        {words.map((w, i) => (
          <Fragment key={i}>
            <span className="w">
              <span className="wi" style={{ "--i": i } as React.CSSProperties}>
                {w}
              </span>
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </span>
    </>
  );
}
