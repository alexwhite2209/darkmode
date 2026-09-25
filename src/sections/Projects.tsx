"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { Project } from "@/types";
import { scroll, ranges } from "@/animations/scroll";
import { ticker } from "@/animations/ticker";
import { pointer } from "@/animations/pointer";
import { Spring2 } from "@/animations/spring";
import { clamp, smoothstep } from "@/lib/math";
import { SplitWords } from "@/components/SplitWords";
import styles from "./Projects.module.css";

/**
 * PROJECT -> IMAGE SCALE -> CROP -> TEXT REVEAL -> NEXT PROJECT
 * Each project pins for a stretch of scroll; its screen grows out of a cropped window,
 * the story reveals beside it, then the screen is cropped away as the next one arrives.
 */
function ProjectStage({ p, i, total }: { p: Project; i: number; total: number }) {
  const wrap = useRef<HTMLElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const phone = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current!;
    const mobile = window.matchMedia("(max-width: 900px)").matches;
    const reduced = document.documentElement.classList.contains("is-reduced");
    if (reduced) {
      el.dataset.static = "true";
      text.current!.style.setProperty("--k", "1");
      return;
    }
    let last = "";
    // desktop: from the moment the project enters the screen to the end of its short pin.
    // It grows while it arrives, so there is no empty screen between two projects:
    // the previous one simply scrolls away as the next one rises and opens.
    const arriveAndPin: typeof ranges.pinned = (m, vh) => [m.top - vh, m.top + m.height - vh];
    const off = scroll.scene(el, mobile ? ranges.through : arriveAndPin, (prog) => {
      const grow = mobile ? smoothstep(prog, 0.05, 0.4) : smoothstep(prog, 0.28, 0.8);
      const exit = 0;
      const k = mobile ? smoothstep(prog, 0.12, 0.45) : smoothstep(prog, 0.5, 0.86);
      const scale = 0.74 + 0.26 * grow;
      const inset = (1 - grow) * 14;
      const top = exit * 100;
      const key = `${scale.toFixed(3)}|${inset.toFixed(2)}|${top.toFixed(2)}|${k.toFixed(3)}`;
      if (key === last) return;
      last = key;
      const s = screen.current!;
      s.style.transform = `translate3d(0, ${(-exit * 12).toFixed(2)}vh, 0) scale(${scale.toFixed(4)})`;
      s.style.clipPath = `inset(${Math.max(inset, top).toFixed(2)}% ${inset.toFixed(2)}% ${inset.toFixed(2)}% ${inset.toFixed(2)}% round ${(18 + inset).toFixed(1)}px)`;
      text.current!.style.setProperty("--k", k.toFixed(3));
      text.current!.style.opacity = (1 - exit * 1.4).toFixed(3);
      if (phone.current) {
        phone.current.style.transform = `translate3d(0, ${((1 - grow) * 140 - exit * 60).toFixed(1)}px, 0) rotate(${((1 - grow) * -6).toFixed(2)}deg)`;
        phone.current.style.opacity = Math.min(clamp(grow * 1.6 - 0.3), clamp(1 - exit * 1.6)).toFixed(3);
      }
    });

    // pointer tilt (desktop)
    let offTilt = () => {};
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      const sp = new Spring2(0, 0, { stiffness: 120, damping: 20 });
      let rect = tilt.current!.getBoundingClientRect();
      let inside = false;
      const t = tilt.current!;
      const enter = () => {
        rect = t.getBoundingClientRect();
        inside = true;
        ticker.wake();
      };
      const leave = () => {
        inside = false;
        ticker.wake();
      };
      t.addEventListener("pointerenter", enter);
      t.addEventListener("pointerleave", leave);
      let lastT = "";
      const offT = ticker.add((_t, dt) => {
        if (inside) {
          const x = ((pointer.x - rect.left) / rect.width) * 2 - 1;
          const y = ((pointer.y - rect.top) / rect.height) * 2 - 1;
          sp.set(clamp(x, -1, 1), clamp(y, -1, 1));
        } else sp.set(0, 0);
        const moving = sp.step(dt);
        const css = `perspective(1400px) rotateY(${(sp.x.value * 4).toFixed(2)}deg) rotateX(${(-sp.y.value * 3).toFixed(2)}deg)`;
        if (css !== lastT) {
          lastT = css;
          t.style.transform = css;
          t.style.setProperty("--gx", `${((sp.x.value + 1) * 50).toFixed(1)}%`);
          t.style.setProperty("--gy", `${((sp.y.value + 1) * 50).toFixed(1)}%`);
        }
        return moving;
      });
      offTilt = () => {
        offT();
        t.removeEventListener("pointerenter", enter);
        t.removeEventListener("pointerleave", leave);
      };
    }
    return () => {
      off();
      offTilt();
    };
  }, []);

  const n = String(i + 1).padStart(2, "0");
  const N = String(total).padStart(2, "0");
  const Wrapper = p.liveUrl ? "a" : "div";

  return (
    <article ref={wrap} className={styles.project} aria-labelledby={`p-${p.slug}`}>
      <div className={styles.frame}>
        <div ref={text} className={styles.text} style={{ "--k": 0 } as CSSProperties}>
          <p className={`${styles.count} t-num`}>
            <span>{n}</span> / {N}
          </p>
          <h3 id={`p-${p.slug}`} className={styles.title}>
            {p.title}
          </h3>
          <p className={styles.category}>
            {p.category}
            {p.city ? `, ${p.city}` : ""}
          </p>
          {p.price ? (
            <p className={styles.price}>
              <span className={styles.priceLabel}>Цена</span>
              <span className={styles.priceValue}>{p.price.toLocaleString("ru-RU")} ₽</span>
            </p>
          ) : null}
          <p className={styles.summary}>{p.summary}</p>
          {p.highlights.length > 0 && (
            <ul className={styles.highlights}>
              {p.highlights.slice(0, 4).map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          )}
          {p.stack.length > 0 && (
            <ul className={styles.stack} aria-label="Технологии">
              {p.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          {p.liveUrl ? (
            <a className={styles.link} href={p.liveUrl} target="_blank" rel="noopener">
              Открыть сайт
            </a>
          ) : (
            <p className={styles.note}>Ссылка на сайт по запросу</p>
          )}
        </div>

        <div className={styles.visual}>
          <div ref={screen} className={styles.screen}>
            <div ref={tilt} className={styles.tilt}>
              <Wrapper
                className={styles.browser}
                {...(p.liveUrl ? { href: p.liveUrl, target: "_blank", rel: "noopener", "data-cursor": "Открыть" } : { "data-cursor": "Смотреть" })}
              >
                <span className={styles.chrome} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images.desktop.src} alt={p.images.desktop.alt} loading="lazy" decoding="async" width={1600} height={1000} />
                <span className={styles.glare} aria-hidden="true" />
              </Wrapper>
            </div>
          </div>
          {p.images.mobile && (
            <div ref={phone} className={styles.phone} aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.images.mobile.src} alt="" loading="lazy" decoding="async" width={390} height={844} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function Projects({ projects }: { projects: Project[] }) {
  return (
    <section id="projects" className={styles.section} aria-labelledby="projects-title">
      <div className={`container ${styles.head}`}>
        <p className={styles.eyebrowNum}>02</p>
        <h2 id="projects-title" className="t-h2" data-reveal="words">
          <SplitWords text="Проекты" />
        </h2>
        <p className="t-lead" data-reveal="up">
          Сайты, которые мы собрали для бизнеса: электромонтаж, автосервисы, охрана, стройматериалы, автошкола. У каждого свой мир и свой сценарий.
        </p>
      </div>
      {projects.length === 0 ? (
        <p className="container t-small">Проекты скоро появятся здесь.</p>
      ) : (
        projects.map((p, i) => <ProjectStage key={p.slug} p={p} i={i} total={projects.length} />)
      )}
    </section>
  );
}
