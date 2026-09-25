"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { MediaKind, Publication } from "@/types";
import { SplitWords } from "@/components/SplitWords";
import { mediaKindPath, publicationHref } from "@/lib/media-paths";
import styles from "./Media.module.css";

const TABS: { id: "all" | MediaKind; label: string }[] = [
  { id: "all", label: "Всё" },
  { id: "news", label: "Новости" },
  { id: "article", label: "Статьи" },
  { id: "guide", label: "Гайды" },
];
const KIND: Record<MediaKind, string> = { news: "Новость", article: "Статья", guide: "Гайд" };
const PAGES: { kind: MediaKind; label: string }[] = [
  { kind: "news", label: "Все новости" },
  { kind: "article", label: "Все статьи" },
  { kind: "guide", label: "Все гайды" },
];

export const formatDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

/**
 * News, articles, guides. On the home page: a mixed feed with tabs and links to the three pages.
 * On /news, /articles, /guides: one kind only (`kind`), no tabs.
 */
export function Media({ items, kind }: { items: Publication[]; kind?: MediaKind }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("all");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const uid = useId();
  const home = !kind;
  const shown = useMemo(() => (kind ? items : tab === "all" ? items : items.filter((i) => i.kind === tab)), [items, tab, kind]);
  const [feature, ...rest] = shown;

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((t) => t.id === tab);
    let n = i;
    if (e.key === "ArrowRight") n = (i + 1) % TABS.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = TABS.length - 1;
    else return;
    e.preventDefault();
    setTab(TABS[n].id);
    tabRefs.current[n]?.focus();
  };

  const body = (
    <>
      {feature && (
        <Link href={publicationHref(feature)} className={styles.feature} data-cursor="Читать" key={`f-${feature.slug}`}>
          <div className={styles.featureImg}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={feature.image.src} alt={feature.image.alt} loading="lazy" decoding="async" width={1280} height={720} />
          </div>
          <div className={styles.featureText}>
            <p className={styles.meta}>
              <span className={styles.kind}>{KIND[feature.kind]}</span>
              <time dateTime={feature.publishedAt}>{formatDate(feature.publishedAt)}</time>
            </p>
            <h3 className={styles.featureTitle}>{feature.title}</h3>
            <p className={styles.desc}>{feature.description}</p>
            <span className={styles.more}>Читать, {feature.readingMinutes} мин</span>
          </div>
        </Link>
      )}
      <ul className={styles.list}>
        {rest.map((p) => (
          <li key={p.slug}>
            <Link href={publicationHref(p)} className={styles.item}>
              <p className={styles.meta}>
                <span className={styles.kind}>{KIND[p.kind]}</span>
                <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time>
              </p>
              <h3 className={styles.itemTitle}>{p.title}</h3>
              <p className={styles.itemDesc}>{p.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );

  if (!home) {
    return (
      <section className={styles.section} aria-label="Публикации">
        <div className="container">
          <div className={styles.panel}>{body}</div>
        </div>
      </section>
    );
  }

  return (
    <section id="media" className={styles.section} aria-labelledby="media-title">
      <div className="container">
        <div className={styles.head}>
          <p className={styles.num}>05</p>
          <h2 id="media-title" className="t-h2" data-reveal="words">
            <SplitWords text="Новости, статьи, гайды" />
          </h2>
          <p className="t-lead" data-reveal="up">
            Новости студии, статьи о том, как сайты продают, и гайды, которые экономят время на старте.
          </p>
          <ul className={styles.pages} data-reveal="up">
            {PAGES.map((pg) => (
              <li key={pg.kind}>
                <Link href={`/${mediaKindPath[pg.kind]}`}>{pg.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Тип публикаций" onKeyDown={onKey}>
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              role="tab"
              id={`${uid}-tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`${uid}-panel`}
              tabIndex={tab === t.id ? 0 : -1}
              className={styles.tab}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${tab}`} className={styles.panel}>
          {body}
        </div>
      </div>
    </section>
  );
}
