import { HomeView, homeMetadata } from "./_views/home";

export const metadata = homeMetadata("ru");

export default function Home() {
  return <HomeView lang="ru" />;
}
