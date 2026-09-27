"use client";

import { usePathname } from "next/navigation";
import { dict, langFromPath, type Lang } from "./index";

/** language of the current page, from the address (/en/… = English) */
export function useLang(): Lang {
  return langFromPath(usePathname());
}

export function useT() {
  return dict[useLang()];
}
