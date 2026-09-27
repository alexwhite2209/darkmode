import { HomeView, homeMetadata } from "../_views/home";

export const metadata = homeMetadata("en");

export default function HomeEn() {
  return <HomeView lang="en" />;
}
