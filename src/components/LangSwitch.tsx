"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { LANGS, dict, langFromPath, switchHref } from "@/i18n";
import styles from "./LangSwitch.module.css";

/** RU / EN: the same page in the other language. Also keeps <html lang> in sync. */
export function LangSwitch({ className = "" }: { className?: string }) {
  const pathname = usePathname() || "/";
  const lang = langFromPath(pathname);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return (
    <nav className={`${styles.switch} ${className}`} aria-label={dict[lang].langSwitch}>
      {LANGS.map((l) => (
        <Link
          key={l}
          href={switchHref(pathname, l)}
          hrefLang={l}
          lang={l}
          aria-current={l === lang ? "true" : undefined}
          className={styles.item}
          scroll={false}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
