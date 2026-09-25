"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/data/site";
import { scroll, ranges } from "@/animations/scroll";
import { FrameScrub, type ScrubState } from "@/animations/frame-scrub";
import { smoothstep } from "@/lib/math";
import { ambient } from "@/lib/store";
import { PhoneIcon } from "@/components/Buttons";
import { Magnetic } from "@/components/Magnetic";
import styles from "./Finale.module.css";

/**
 * The way back out. At the start of the film we flew into the O; here the first seconds of the film
 * play backwards: from the black of the O the camera pulls out onto the big DARK MODE logo, and the
 * page stays there with the three ways to reach the studio.
 */
/** the finale plays this much of the start of the film, backwards */
const OUTRO_SECONDS = 2.8;

export function Finale() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cover = useRef<HTMLDivElement>(null);
  const actions = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"video" | "static">("video");

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setMode("static");
      return;
    }
    const sec = section.current!;
    let orient: "desktop" | "mobile" = window.innerHeight > window.innerWidth ? "mobile" : "desktop";
    const onState = (s: ScrubState) => (sec.dataset.video = s);
    let scrub: FrameScrub | undefined;
    let lastT = 1;
    let loaded = false;
    const load = () => {
      loaded = true;
      // the first 2.8 s of the same frame sequence as the hero (already in the browser cache)
      scrub?.destroy();
      const set = site.video.frames[orient];
      scrub = new FrameScrub(canvas.current!, { path: set.path, count: set.count, version: site.video.frames.version, use: Math.round(OUTRO_SECONDS * site.video.frames.fps), smoothing: 0.16, onState });
      scrub.setTarget(lastT);
      scrub.load();
    };
    // fetch only when the finale is near
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting) && !loaded) load();
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(sec);
    const onResize = () => {
      const next = window.innerHeight > window.innerWidth ? "mobile" : "desktop";
      if (next !== orient) {
        orient = next;
        if (loaded) load();
      }
    };
    window.addEventListener("resize", onResize, { passive: true });

    let lastCover = -1;
    let lastAct = -1;
    // space fades out as the section arrives
    const offAmb = scroll.scene(sec, (m, vh) => [m.top - vh, m.top], (p) => ambient.set({ finale: smoothstep(p, 0.2, 1) }));
    const off = scroll.scene(sec, ranges.pinned, (p) => {
      // film backwards: from the black of the O to the first frame
      lastT = 1 - smoothstep(p, 0.08, 0.78);
      scrub?.setTarget(lastT);
      const c = 1 - smoothstep(p, 0.0, 0.1);
      if (Math.abs(c - lastCover) > 0.004) {
        lastCover = c;
        cover.current!.style.opacity = c.toFixed(3);
      }
      const a = smoothstep(p, 0.74, 0.92);
      if (Math.abs(a - lastAct) > 0.004) {
        lastAct = a;
        actions.current!.style.setProperty("--k", a.toFixed(3));
        actions.current!.style.visibility = a < 0.01 ? "hidden" : "visible";
      }
    });

    return () => {
      off();
      offAmb();
      io.disconnect();
      scrub?.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section ref={section} id="contact-end" className={styles.finale} data-mode={mode} aria-labelledby="finale-title">
      <div className={styles.stage}>
        <picture className={styles.poster} aria-hidden="true">
          <source media="(orientation: portrait)" srcSet={site.video.posterMobile} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={site.video.posterDesktop} alt="" loading="lazy" decoding="async" />
        </picture>
        {mode === "video" && <canvas ref={canvas} className={styles.video} aria-hidden="true" />}
        <div ref={cover} className={styles.cover} aria-hidden="true" />
        <div className={styles.scrim} aria-hidden="true" />

        <div ref={actions} className={styles.actions} style={{ "--k": mode === "static" ? 1 : 0 } as React.CSSProperties}>
          <h2 id="finale-title" className={styles.title}>
            Позвоните или напишите
          </h2>
          <div className={styles.buttons}>
            <Magnetic>
              <a className="btn btn--primary" href={site.contacts.phone.href}>
                <span>Позвонить {site.contacts.phone.label}</span>
                <span className="btn__icon" aria-hidden="true">
                  <PhoneIcon />
                </span>
              </a>
            </Magnetic>
            <Magnetic strength={0.22}>
              <a className="btn" href={site.contacts.sms.href}>
                <span>Написать</span>
              </a>
            </Magnetic>
            <Magnetic strength={0.22}>
              <a className="btn" href={site.contacts.telegram.href} target="_blank" rel="noopener">
                <span>Написать в Telegram</span>
              </a>
            </Magnetic>
          </div>
          <p className={styles.legal}>
            © {new Date().getFullYear()} DARK MODE. {site.contacts.city}.
          </p>
        </div>
      </div>
    </section>
  );
}
