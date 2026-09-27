"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dict, langFromPath, localHref } from "@/i18n";

export default function NotFound() {
  const lang = langFromPath(usePathname());
  const d = dict[lang];
  return (
    <section style={{ minHeight: "80vh", display: "grid", placeItems: "center", padding: "120px var(--gutter) 60px", textAlign: "center" }}>
      <div style={{ display: "grid", gap: 20, justifyItems: "center" }}>
        <div
          aria-hidden="true"
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "#020203",
            boxShadow: "inset -8px 0 16px -6px rgba(255,170,90,.95), 0 0 0 1.5px rgba(255,122,26,.8), 0 0 50px rgba(255,122,26,.35)",
          }}
        />
        <h1 className="t-h2">{d.notFoundTitle}</h1>
        <p className="t-lead">{d.notFoundText}</p>
        <Link href={localHref(lang, "/")} className="btn btn--ghost">
          {d.toMain}
        </Link>
      </div>
    </section>
  );
}
