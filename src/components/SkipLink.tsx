"use client";

import { useT } from "@/i18n/client";

/** "Skip to content" in the language of the page */
export function SkipLink() {
  return (
    <a className="skip-link" href="#main">
      {useT().skip}
    </a>
  );
}