"use client";

import { Fragment, useEffect, useRef, useState, type CSSProperties } from "react";
import type { Chapter } from "@/types";
import { site } from "@/data/site";
import { scroll, ranges } from "@/animations/scroll";
import { FrameScrub, type ScrubState } from "@/animations/frame-scrub";
import { band, clamp, smoothstep } from "@/lib/math";
import { ambient, loading } from "@/lib/store";
import { SplitWords } from "@/components/SplitWords";
import { DiscussButton, LinkButton } from "@/components/Buttons";
import styles from "./CinematicHero.module.css";

const DURATION = site.video.duration;
/** the O at the final frame, as a fraction of the rendered video width (from the camera setup) */
const O_RADIUS = { desktop: 0.0891, mobile: 0.1188 };

type Mode = "video" | "static";

export function CinematicHero({ chapters }: { chapters: Chapter[] }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const caps = useRef<(HTMLDivElement | null)[]>([]);
  const scrimL = useRef<HTMLDivElement>(null);
  const scrimB = useRef<HTMLDivElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const hudTime = useRef<HTMLSpanElement>(null);
  const hudKind = useRef<HTMLSpanElement>(null);
  const hudArc = useRef<SVGCircleElement>(null);
  const cue = useRef<HTMLDivElement>(null);
  const exit = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<Mode>("video");
  const [ready, setReady] = useState(false);

  const posterRef = useRef<HTMLImageElement>(null);

  // intro entrance after the preloader opens
  useEffect(() => {
    loading.set({ hasHero: true });
    // the poster may finish loading before hydration, when React's onLoad never fires
    const img = posterRef.current;
    if (img && img.complete) loading.set({ poster: true });
    const check = (s: ReturnType<typeof loading.get>) => s.done && setReady(true);
    check(loading.get());
    return loading.subscribe(check);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setMode("static");
      loading.set({ video: 1, poster: true });
      return;
    }
    const sec = section.current!;
    const st = stage.current!;
    let orient: "desktop" | "mobile" = window.innerHeight > window.innerWidth ? "mobile" : "desktop";

    const onProgress = (f: number) => loading.set({ video: f });
    const onState = (s: ScrubState) => {
      st.dataset.video = s;
      if (s === "failed") loading.set({ video: 1 });
    };
    // the film is a picture sequence on a canvas (public/frames), a separate set for portrait screens
    let scrub: FrameScrub | undefined;
    let lastP = 0;
    const load = () => {
      scrub?.destroy();
      const set = site.video.frames[orient];
      scrub = new FrameScrub(canvas.current!, { path: set.path, count: set.count, version: site.video.frames.version, smoothing: 0.14, onProgress, onState });
      scrub.setTarget(lastP);
      scrub.load();
    };
    load();

    const onResize = () => {
      const next = window.innerHeight > window.innerWidth ? "mobile" : "desktop";
      if (next !== orient) {
        orient = next;
        load();
      }
    };
    window.addEventListener("resize", onResize, { passive: true });

    // ---- per-frame state, written to the DOM only on change
    const bands = chapters.map((c) => ({ a: c.start / DURATION, b: c.end / DURATION, op: -1, k: -1, side: c.placement }));
    const n = bands.length;
    let lastIntro = -1;
    let lastScrimL = -1;
    let lastScrimB = -1;
    let lastExit = -1;
    let lastCue = -1;
    let lastHudAt = 0;
    let lastTime = "";
    let lastKind = "";
    let lastArc = -1;
    const C = 2 * Math.PI * 9;

    const off = scroll.scene(sec, ranges.pinned, (p) => {
      lastP = p;
      scrub?.setTarget(p);

      // intro block leaves in the first seconds
      const io = 1 - smoothstep(p, 0.012, 0.06);
      if (Math.abs(io - lastIntro) > 0.004) {
        lastIntro = io;
        intro.current!.style.opacity = io.toFixed(3);
        intro.current!.style.transform = `translate3d(0, ${(-(1 - io) * 60).toFixed(1)}px, 0)`;
        intro.current!.style.visibility = io < 0.01 ? "hidden" : "visible";
      }
      const cueOp = 1 - smoothstep(p, 0.004, 0.03);
      if (Math.abs(cueOp - lastCue) > 0.01) {
        lastCue = cueOp;
        cue.current!.style.opacity = cueOp.toFixed(2);
      }

      // chapter captions
      let left = 0;
      let bottom = 0;
      for (let i = 0; i < n; i++) {
        const b = bands[i];
        const ramp = Math.min(0.012, (b.b - b.a) / 4);
        let op = band(p, b.a, b.b, ramp, { start: true, end: i !== n - 1 });
        if (i === n - 1) op *= 1 - smoothstep(p, 0.952, 0.972);
        const k = clamp((p - b.a) / (ramp * 2.2));
        const el = caps.current[i];
        if (!el) continue;
        if (Math.abs(op - b.op) > 0.004) {
          b.op = op;
          el.style.opacity = op.toFixed(3);
          el.style.visibility = op < 0.005 ? "hidden" : "visible";
        }
        if (Math.abs(k - b.k) > 0.008 || (k === 1 && b.k !== 1)) {
          b.k = k;
          el.style.setProperty("--k", k.toFixed(3));
        }
        if (b.side === "left") left = Math.max(left, op);
        else bottom = Math.max(bottom, op);
      }
      if (Math.abs(left - lastScrimL) > 0.01) {
        lastScrimL = left;
        scrimL.current!.style.opacity = left.toFixed(2);
      }
      if (Math.abs(bottom - lastScrimB) > 0.01) {
        lastScrimB = bottom;
        scrimB.current!.style.opacity = bottom.toFixed(2);
      }

      // HUD: timecode + chapter, ~10 Hz and only on change
      const now = performance.now();
      if (now - lastHudAt > 90) {
        lastHudAt = now;
        const sec = Math.min(DURATION, p * DURATION);
        const t = `00:${String(Math.floor(sec)).padStart(2, "0")}`;
        if (t !== lastTime && hudTime.current) {
          lastTime = t;
          hudTime.current.textContent = t;
        }
        let kind = "DARK MODE";
        for (const c of chapters) if (sec >= c.start - 0.3 && sec < c.end) kind = c.kind;
        if (kind !== lastKind && hudKind.current) {
          lastKind = kind;
          hudKind.current.textContent = kind;
        }
        const arc = Math.round(C * (1 - p) * 10) / 10;
        if (arc !== lastArc && hudArc.current) {
          lastArc = arc;
          hudArc.current.style.strokeDashoffset = String(arc);
        }
        const hudOp = smoothstep(p, 0.03, 0.06) * (1 - smoothstep(p, 0.93, 0.97));
        hud.current!.style.opacity = hudOp.toFixed(2);
      }

      // exit through the O: the black disk of the eclipse grows until it covers the frame
      const ex = smoothstep(p, 0.962, 0.998);
      // inside the O is space: it stays behind the rest of the page
      ambient.set({ after: smoothstep(p, 0.985, 1) });
      if (Math.abs(ex - lastExit) > 0.002) {
        lastExit = ex;
        const e = exit.current!;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const vidW = orient === "mobile" ? Math.max(vw, (vh * 9) / 16) : Math.max(vw, (vh * 16) / 9);
        const r0 = vidW * O_RADIUS[orient];
        const r1 = Math.hypot(vw, vh) / 2 + 40;
        const r = r0 + (r1 - r0) * (ex * ex * ex);
        e.style.opacity = ex > 0 ? "1" : "0";
        e.style.transform = `translate(-50%, -50%) scale(${(r / 100).toFixed(4)})`;
      }
    });

    return () => {
      off();
      scrub?.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [chapters]);

  const skip = () => scroll.scrollTo("#projects");

  return (
    <section
      ref={section}
      id="top"
      className={styles.hero}
      data-mode={mode}
      data-ready={ready}
      aria-label="DARK MODE: путешествие по мирам сайтов"
    >
      <div ref={stage} className={styles.stage} data-video="idle">
        <div className={styles.media} aria-hidden="true">
          <picture>
            <source media="(orientation: portrait)" srcSet={site.video.posterMobile} />
            <img
              ref={posterRef}
              className={styles.poster}
              src={site.video.posterDesktop}
              alt=""
              fetchPriority="high"
              decoding="async"
              onLoad={() => loading.set({ poster: true })}
              onError={() => loading.set({ poster: true })}
            />
          </picture>
          {mode === "video" && <canvas ref={canvas} className={styles.video} aria-hidden="true" />}
          <div className={styles.scrim} />
          <div ref={scrimL} className={styles.scrimLeft} />
          <div ref={scrimB} className={styles.scrimBottom} />
        </div>

        {/* first screen */}
        <div ref={intro} className={styles.intro}>
          <p className={styles.tagline}>{site.tagline}</p>
          <h1 className={`t-h1 ${styles.h1}`}>
            <SplitWords text="Мы делаем эволюцию сайтов" />
          </h1>
          <div className={styles.actions}>
            <DiscussButton />
            <LinkButton href="/#projects" icon="play">
              Смотреть проекты
            </LinkButton>
          </div>
        </div>

        {/* chapters of the journey */}
        {mode === "video" &&
          chapters.map((c, i) => (
            <div
              key={c.id}
              ref={(el) => {
                caps.current[i] = el;
              }}
              className={`${styles.cap} ${styles[`cap_${c.placement.replace("-", "_")}`]} ${styles[`fx_${c.id}`] ?? ""}`}
              style={{ opacity: 0, visibility: "hidden" } as CSSProperties}
            >
              <p className={styles.kind}>{c.kind}</p>
              <h2 className={styles.capTitle}>
                {c.title.split(" ").map((w, wi, arr) => (
                  <Fragment key={wi}>
                    <span className={styles.cw} style={{ "--wi": wi } as CSSProperties}>
                      <span>{w}</span>
                    </span>
                    {wi < arr.length - 1 ? " " : null}
                  </Fragment>
                ))}
              </h2>
              <p className={styles.capText}>{c.text}</p>
              {c.id === "final" && (
                <div className={styles.finalActions}>
                  <DiscussButton />
                  <LinkButton href="/#projects">Смотреть проекты</LinkButton>
                </div>
              )}
            </div>
          ))}

        <div ref={hud} className={styles.hud} aria-hidden="true" style={{ opacity: 0 }}>
          <svg viewBox="0 0 24 24" className={styles.hudRing}>
            <circle cx="12" cy="12" r="9" className={styles.hudTrack} />
            <circle ref={hudArc} cx="12" cy="12" r="9" className={styles.hudArc} strokeDasharray={2 * Math.PI * 9} strokeDashoffset={2 * Math.PI * 9} />
          </svg>
          <span ref={hudTime} className="t-num">00:00</span>
          <span className={styles.hudSep} />
          <span ref={hudKind}>DARK MODE</span>
        </div>

        <div ref={cue} className={styles.cue}>
          <span>Листайте вниз</span>
          <button type="button" className={styles.cueBtn} onClick={() => scroll.scrollTo(window.scrollY + window.innerHeight * 1.2)} aria-label="Прокрутить вниз">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 3v10M3.5 8.5 8 13l4.5-4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {mode === "video" && (
          <button type="button" className={styles.skip} onClick={skip}>
            Пропустить ролик
          </button>
        )}

        <div ref={exit} className={styles.exit} aria-hidden="true" />
      </div>

      {/* reduced motion: the journey as still frames */}
      {mode === "static" && (
        <div className={`container ${styles.worlds}`}>
          <h2 className="t-h3">Семь миров, семь типов сайтов</h2>
          <ol className={styles.worldList}>
            {chapters.map((c) => (
              <li key={c.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.still.src} alt={c.still.alt} loading="lazy" width={640} height={360} />
                <p className={styles.kind}>{c.kind}</p>
                <h3 className="t-h3">{c.title}</h3>
                <p className="t-small">{c.text}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
