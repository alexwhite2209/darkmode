import { PublicationView, publicationMetadata, publicationStaticParams } from "../../../_views/publication";

export const dynamicParams = false;
export const generateStaticParams = publicationStaticParams;

type P = { params: Promise<{ kind: string; slug: string }> };
export const generateMetadata = async ({ params }: P) => {
  const { kind, slug } = await params;
  return publicationMetadata(kind, slug, "en");
};

export default async function PublicationPageEn({ params }: P) {
  const { kind, slug } = await params;
  return <PublicationView kind={kind} slug={slug} lang="en" />;
}
