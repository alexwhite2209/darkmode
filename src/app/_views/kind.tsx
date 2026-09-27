import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Media } from "@/sections/Media";
import { getAllPublications, kindFromPath, mediaKindPath } from "@/services/content";
import { kindHref, mediaKinds } from "@/lib/media-paths";
import { t, localHref, type Lang } from "@/i18n";
import styles from "./media.module.css";

/** /news, /articles, /guides (and /en/…) — every other first-level path is a 404 */
export function kindStaticParams() {
  return mediaKinds.map((k) => ({ kind: mediaKindPath[k] }));
}

export async function kindMetadata(kindPath: string, lang: Lang): Promise<Metadata> {
  const kind = kindFromPath(kindPath);
  if (!kind) return {};
  const pg = t(lang).kindPage[kind];
  const ru = `/${mediaKindPath[kind]}`;
  return { title: pg.title, description: pg.description, alternates: { canonical: localHref(lang, ru), languages: { ru, en: localHref("en", ru) } } };
}

export async function KindView({ kindPath, lang }: { kindPath: string; lang: Lang }) {
  const kind = kindFromPath(kindPath);
  if (!kind) notFound();
  const d = t(lang);
  const items = await getAllPublications(kind, lang);
  return (
    <div className={styles.page}>
      <header className={`container ${styles.head}`}>
        <nav className={styles.kinds} aria-label={d.publications}>
          {mediaKinds.map((k) => (
            <Link key={k} href={kindHref(k, lang)} aria-current={k === kind ? "page" : undefined}>
              {d.kindMany[k]}
            </Link>
          ))}
        </nav>
        <h1 className="t-h2">{d.kindMany[kind]}</h1>
        <p className="t-lead">{d.kindPage[kind].lead}</p>
      </header>
      {items.length > 0 ? <Media items={items} kind={kind} /> : <p className="container t-small">{d.soon}</p>}
    </div>
  );
}
