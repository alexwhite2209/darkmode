import type { Metadata } from "next";
import { CinematicHero } from "@/sections/CinematicHero";
import { Projects } from "@/sections/Projects";
import { Capabilities } from "@/sections/Capabilities";
import { Process } from "@/sections/Process";
import { Media } from "@/sections/Media";
import { Contact } from "@/sections/Contact";
import { Finale } from "@/sections/Finale";
import { Rail } from "@/components/Rail";
import { getAllPublications, getContent, getProjects } from "@/services/content";
import { site } from "@/data/site";
import { t, type Lang } from "@/i18n";
import { asset } from "@/lib/asset";

export function homeMetadata(lang: Lang): Metadata {
  const d = t(lang);
  return {
    title: { absolute: d.htmlTitle },
    description: d.description,
    alternates: { canonical: lang === "en" ? "/en" : "/", languages: { ru: "/", en: "/en" } },
    openGraph: {
      type: "website",
      locale: lang === "en" ? "en_US" : "ru_RU",
      url: lang === "en" ? "/en" : "/",
      siteName: "DARK MODE",
      title: d.htmlTitle,
      description: d.description,
      images: [{ url: asset("/images/og.jpg"), width: 1200, height: 630, alt: d.ogAlt }],
    },
  };
}

export async function HomeView({ lang }: { lang: Lang }) {
  const [content, projects, media] = await Promise.all([getContent(lang), getProjects(lang), getAllPublications(undefined, lang)]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DARK MODE",
    url: site.url,
    logo: `${site.url}/icon.svg`,
    description: t(lang).description,
    slogan: site.tagline,
    telephone: site.contacts.phone.href.replace("tel:", ""),
    sameAs: [site.contacts.telegram.href],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CinematicHero chapters={content.chapters} />
      <Projects projects={projects} />
      <Capabilities items={content.capabilities} />
      <Process steps={content.process} />
      <Media items={media.slice(0, 7)} />
      <Contact />
      <Finale />
      <Rail />
    </>
  );
}
