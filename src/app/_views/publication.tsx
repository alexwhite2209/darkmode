import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPublications, kindFromPath, mediaKindPath, publicationHref } from "@/services/content";
import { kindHref } from "@/lib/media-paths";
import { DiscussButton } from "@/components/Buttons";
import { t, formatDate, type Lang } from "@/i18n";
import type { ContentBlock, Guide } from "@/types";
import styles from "./media.module.css";

async function find(kindPath: string, slug: string, lang: Lang) {
  const kind = kindFromPath(kindPath);
  if (!kind) return null;
  const all = await getAllPublications(kind, lang);
  return all.find((p) => p.slug === slug) ?? null;
}

export async function publicationStaticParams() {
  const all = await getAllPublications();
  return all.map((p) => ({ kind: mediaKindPath[p.kind], slug: p.slug }));
}

export async function publicationMetadata(kind: string, slug: string, lang: Lang): Promise<Metadata> {
  const p = await find(kind, slug, lang);
  if (!p) return {};
  const url = publicationHref(p, lang);
  return {
    title: p.title,
    description: p.description,
    alternates: { canonical: url, languages: { ru: publicationHref(p, "ru"), en: publicationHref(p, "en") } },
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

/** Text with [links](https://…) and **bold** — the way materials arrive from News Engine (partner links included). */
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

export async function PublicationView({ kind, slug, lang }: { kind: string; slug: string; lang: Lang }) {
  const p = await find(kind, slug, lang);
  if (!p) notFound();
  const d = t(lang);
  const steps = p.kind === "guide" ? (p as Guide).steps : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": p.kind === "news" ? "NewsArticle" : "Article",
    headline: p.title,
    description: p.description,
    datePublished: p.publishedAt,
    inLanguage: lang,
    image: p.image.src,
    author: { "@type": "Organization", name: "DARK MODE" },
  };
  return (
    <article className={styles.article}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className={styles.wrap}>
        <Link href={kindHref(p.kind, lang)} className={styles.back}>
          {d.kindMany[p.kind]}
        </Link>
        <p className={styles.meta}>
          <span className={styles.kind}>{d.kindOne[p.kind]}</span>
          <time dateTime={p.publishedAt}>{formatDate(p.publishedAt, lang)}</time>
          <span>{d.minRead(p.readingMinutes)}</span>
        </p>
        <h1 className={styles.title}>{p.title}</h1>
        <p className={styles.desc}>{p.description}</p>
        <figure className={styles.cover}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image.src} alt={p.image.alt} width={1280} height={720} />
        </figure>
        {steps && (
          <ol className={styles.steps} aria-label={d.inShort}>
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
        <ul className={styles.tags} aria-label={d.tagsLabel}>
          {p.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
        <aside className={styles.cta}>
          <p className="t-h3">{d.wantSite}</p>
          <DiscussButton />
        </aside>
      </div>
    </article>
  );
}
