"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { site } from "@/data/site";
import styles from "./Footer.module.css";

/** Inner pages only: the home page ends on the big logo of the finale. */
export function Footer() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        <Link href="/" className={styles.logo} aria-label="DARK MODE, на главную">
          <Logo idPrefix="ftr" />
        </Link>
        <nav aria-label="Разделы">
          <ul className={styles.links}>
            {site.nav.map((n) => (
              <li key={n.id}>
                <Link href={n.href}>{n.label}</Link>
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
          © {year} DARK MODE. {site.contacts.city}.
        </p>
      </div>
    </footer>
  );
}
