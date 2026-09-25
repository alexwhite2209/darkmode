"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { DiscussButton, onCallClick } from "./Buttons";
import { scroll } from "@/animations/scroll";
import { site } from "@/data/site";
import styles from "./Header.module.css";

export function Header() {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const home = pathname === "/";
  const links = site.nav;

  // glass after leaving the very top; hide while scrolling down, show on the way up
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let lastY = 0;
    let hidden = false;
    let solid = false;
    return scroll.onScroll((y) => {
      const s = y > 40;
      if (s !== solid) {
        solid = s;
        el.dataset.solid = String(s);
      }
      const dy = y - lastY;
      if (Math.abs(dy) > 6) {
        const h = dy > 0 && y > window.innerHeight * 0.6;
        if (h !== hidden) {
          hidden = h;
          el.dataset.hidden = String(h);
        }
        lastY = y;
      }
    });
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    scroll.lock();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      scroll.unlock();
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header ref={ref} className={styles.header} data-open={open}>
      <div className={styles.bar}>
        <Link href={home ? "/#top" : "/"} className={styles.logo} aria-label="DARK MODE, на главную">
          <Logo idPrefix="hdr" />
        </Link>
        <nav className={styles.nav} aria-label="Основная навигация">
          <ul>
            {links.map((l) => (
              <li key={l.id}>
                <Link href={l.href} className={styles.link}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className={styles.cta}>
          <DiscussButton />
        </div>
        <button
          type="button"
          className={styles.burger}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
        </button>
      </div>

      <div id="mobile-menu" className={styles.menu} hidden={!open}>
        <nav aria-label="Меню">
          <ol>
            {site.nav.map((l) => (
              <li key={l.id}>
                <Link href={l.href} onClick={() => setOpen(false)}>
                  <span className={styles.menuIndex}>{l.index}</span>
                  <span>{l.label}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
        <a
          href={site.contacts.phone.href}
          className={`btn btn--primary ${styles.menuCta}`}
          onClick={(e) => {
            setOpen(false);
            onCallClick(e);
          }}
        >
          Обсудить проект
        </a>
        <p className={styles.menuContacts}>
          <a href={site.contacts.phone.href}>{site.contacts.phone.label}</a>
          <a href={site.contacts.telegram.href} target="_blank" rel="noopener">
            {site.contacts.telegram.label}
          </a>
        </p>
      </div>
    </header>
  );
}
