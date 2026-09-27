import { KindView, kindMetadata, kindStaticParams } from "../../_views/kind";

export const dynamicParams = false;
export const generateStaticParams = kindStaticParams;

type P = { params: Promise<{ kind: string }> };
export const generateMetadata = async ({ params }: P) => kindMetadata((await params).kind, "en");

export default async function KindPageEn({ params }: P) {
  return <KindView kindPath={(await params).kind} lang="en" />;
}
