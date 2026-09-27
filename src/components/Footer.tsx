"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { site } from "@/data/site";
import { dict, langFromPath, localHref } from "@/i18n";
import styles from "./Footer.module.css";

/** Inner pages only: the home page ends on the big logo of the finale. */
export function Footer() {
  const pathname = usePathname();
  const lang = langFromPath(pathname);
  const d = dict[lang];
  if (pathname === "/" || pathname === "/en") return null;
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <Link href={localHref(lang, "/")} className={styles.logo} aria-label={d.toHome}>
          <Logo idPrefix="ftr" />
        </Link>
        <nav aria-label={d.footerNav}>
          <ul className={styles.links}>
            {site.nav.map((n) => (
              <li key={n.id}>
                <Link href={localHref(lang, n.href)}>{d.nav[n.id as keyof typeof d.nav] ?? n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <address className={styles.contacts}>
          <a href={site.contacts.phone.href}>{site.contacts.phone.label}</a>
          <a href={site.contacts.telegram.href} target="_blank" rel="noopener">
            {site.contacts.telegram.label}
          </a>
        </address>
        <p className={styles.legal}>
          © {year} DARK MODE. {site.cityByLang[lang]}.
        </p>
      </div>
    </footer>
  );
}
