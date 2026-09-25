import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPublications, kindFromPath, mediaKindLabel, mediaKindPath, publicationHref } from "@/services/content";
import { DiscussButton } from "@/components/Buttons";
import type { ContentBlock, Guide } from "@/types";
import styles from "../media.module.css";

export const dynamicParams = false;

const KIND = { news: "Новость", article: "Статья", guide: "Гайд" } as const;
const formatDate = (iso: string) =>
  new Date(iso + "T12:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

async function find(kindPath: string, slug: string) {
  const kind = kindFromPath(kindPath);
  if (!kind) return null;
  const all = await getAllPublications(kind);
  return all.find((p) => p.slug === slug) ?? null;
}

export async function generateStaticParams() {
  const all = await getAllPublications();
  return all.map((p) => ({ kind: mediaKindPath[p.kind], slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ kind: string; slug: string }> }): Promise<Metadata> {
  const { kind, slug } = await params;
  const p = await find(kind, slug);
  if (!p) return {};
  const url = publicationHref(p);
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: p.title,
      description: p.description,
      url,
      publishedTime: p.publishedAt,
      tags: p.tags,
      images: [{ url: p.image.src, width: 1280, height: 720, alt: p.image.alt }],
    },
  };
}

/** Текст с [ссылками](https://…) и **жирным** — так приходят материалы из News Engine (в том числе партнёрские ссылки). */
function Rich({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
        if (link)
          return (
            <a key={i} href={link[2]} target="_blank" rel="noopener sponsored">
              {link[1]}
            </a>
          );
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>;
        return part;
      })}
    </>
  );
}

function Block({ b }: { b: ContentBlock }) {
  switch (b.type) {
    case "h2":
      return <h2>{b.text}</h2>;
    case "list":
      return (
        <ul>
          {b.items.map((i) => (
            <li key={i}>
              <Rich text={i} />
            </li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote>
          <Rich text={b.text} />
        </blockquote>
      );
    default:
      return (
        <p>
          <Rich text={b.text} />
        </p>
      );
  }
}

export default async function PublicationPage({ params }: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await params;
  const p = await find(kind, slug);
  if (!p) notFound();
  const steps = p.kind === "guide" ? (p as Guide).steps : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": p.kind === "news" ? "NewsArticle" : "Article",
    headline: p.title,
    description: p.description,
    datePublished: p.publishedAt,
    image: p.image.src,
    author: { "@type": "Organization", name: "DARK MODE" },
  };
  return (
    <article className={styles.article}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={styles.wrap}>
        <Link href={`/${mediaKindPath[p.kind]}`} className={styles.back}>
          {mediaKindLabel[p.kind]}
        </Link>
        <p className={styles.meta}>
          <span className={styles.kind}>{KIND[p.kind]}</span>
          <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time>
          <span>{p.readingMinutes} мин чтения</span>
        </p>
        <h1 className={styles.title}>{p.title}</h1>
        <p className={styles.desc}>{p.description}</p>
        <figure className={styles.cover}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image.src} alt={p.image.alt} width={1280} height={720} />
        </figure>
        {steps && (
          <ol className={styles.steps} aria-label="Коротко">
            {steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        )}
        <div className={styles.body}>
          {p.content.map((b, i) => (
            <Block key={i} b={b} />
          ))}
        </div>
        <ul className={styles.tags} aria-label="Теги">
          {p.tags.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <aside className={styles.cta}>
          <p className="t-h3">Хотите такой сайт?</p>
          <DiscussButton />
        </aside>
      </div>
    </article>
  );
}
