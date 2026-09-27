import { KindView, kindMetadata, kindStaticParams } from "../_views/kind";

/** /news, /articles, /guides — every other first-level path is a 404 */
export const dynamicParams = false;
export const generateStaticParams = kindStaticParams;

type P = { params: Promise<{ kind: string }> };
export const generateMetadata = async ({ params }: P) => kindMetadata((await params).kind, "ru");

export default async function KindPage({ params }: P) {
  return <KindView kindPath={(await params).kind} lang="ru" />;
}
