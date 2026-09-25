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

export default async function Home() {
  const [content, projects, media] = await Promise.all([getContent(), getProjects(), getAllPublications()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DARK MODE",
    url: site.url,
    logo: `${site.url}/icon.svg`,
    description: site.description,
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
