import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Media } from "@/sections/Media";
import { getAllPublications, kindFromPath, mediaKindLabel, mediaKindPath } from "@/services/content";
import { mediaKinds } from "@/lib/media-paths";
import type { MediaKind } from "@/types";
import styles from "./media.module.css";

/** /news, /articles, /guides — every other first-level path is a 404 */
export const dynamicParams = false;

const PAGE: Record<MediaKind, { title: string; description: string; lead: string }> = {
  news: {
    title: "Новости студии",
    description: "Новости студии DARK MODE: запуски сайтов, новые проекты и то, что меняется в работе.",
    lead: "Запуски, новые проекты и то, что меняется в нашей работе.",
  },
  article: {
    title: "Статьи о сайтах",
    description: "Статьи DARK MODE о том, как сайты продают: скролл-видео, первый экран, скорость и заявки.",
    lead: "Как сайты продают: первый экран, скролл-видео, скорость и путь до звонка.",
  },
  guide: {
    title: "Гайды",
    description: "Гайды DARK MODE: как подготовиться к запуску сайта, что собрать заранее и как сэкономить время.",
    lead: "Короткие инструкции, которые экономят время на старте проекта.",
  },
};

export function generateStaticParams() {
  return mediaKinds.map((k) => ({ kind: mediaKindPath[k] }));
}

export async function generateMetadata({ params }: { params: Promise<{ kind: string }> }): Promise<Metadata> {
  const kind = kindFromPath((await params).kind);
  if (!kind) return {};
  const pg = PAGE[kind];
  return { title: pg.title, description: pg.description, alternates: { canonical: `/${mediaKindPath[kind]}` } };
}

export default async function KindPage({ params }: { params: Promise<{ kind: string }> }) {
  const kind = kindFromPath((await params).kind);
  if (!kind) notFound();
  const items = await getAllPublications(kind);
  const pg = PAGE[kind];
  return (
    <div className={styles.page}>
      <header className={`container ${styles.head}`}>
        <nav className={styles.kinds} aria-label="Публикации">
          {mediaKinds.map((k) => (
            <Link key={k} href={`/${mediaKindPath[k]}`} aria-current={k === kind ? "page" : undefined}>
              {mediaKindLabel[k]}
            </Link>
          ))}
        </nav>
        <h1 className="t-h2">{mediaKindLabel[kind]}</h1>
        <p className="t-lead">{pg.lead}</p>
      </header>
      {items.length > 0 ? <Media items={items} kind={kind} /> : <p className="container t-small">Скоро здесь появятся публикации.</p>}
    </div>
  );
}
