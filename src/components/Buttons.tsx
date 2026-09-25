"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { Magnetic } from "./Magnetic";
import { site } from "@/data/site";
import { scroll } from "@/animations/scroll";
import { asset } from "@/lib/asset";

export const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M3 8h9M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const PlayIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M5 3.5v9l7-4.5-7-4.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

export const PhoneIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M5.2 2.5 3.4 2.9c-.5.1-.9.6-.9 1.1.2 5.2 4.3 9.3 9.5 9.5.5 0 1-.4 1.1-.9l.4-1.8c.1-.4-.1-.8-.5-1l-2-.9c-.3-.1-.7 0-.9.2l-.8.9c-1.5-.7-2.7-1.9-3.4-3.4l.9-.8c.3-.2.4-.6.2-.9l-.9-2c-.2-.4-.6-.6-1-.5Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
  </svg>
);

/** on a computer there is nothing to dial with: show the finale with the number and Telegram instead */
export function onCallClick(e: MouseEvent<HTMLAnchorElement>) {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  e.preventDefault();
  const end = document.getElementById("contact-end");
  // the end of the finale: the logo with the number and Telegram
  if (end) scroll.scrollTo(end.offsetTop + end.offsetHeight - window.innerHeight, { duration: 2.4 });
  else window.location.href = asset("/#contact-end");
}

/** Primary action of the whole site: a phone call (on a computer, jumps to the contacts). */
export function DiscussButton({ label = "Обсудить проект", className = "" }: { label?: string; className?: string }) {
  return (
    <Magnetic>
      <a href={site.contacts.phone.href} className={`btn btn--primary ${className}`} onClick={onCallClick} aria-label={`${label}: позвонить ${site.contacts.phone.label}`}>
        <span>{label}</span>
        <span className="btn__icon" aria-hidden="true">
          <PhoneIcon />
        </span>
      </a>
    </Magnetic>
  );
}

export function LinkButton({ href, children, icon = "arrow", className = "" }: { href: string; children: React.ReactNode; icon?: "arrow" | "play" | "none"; className?: string }) {
  return (
    <Magnetic strength={0.22}>
      <Link href={href} className={`btn ${icon === "none" ? "btn--ghost" : ""} ${className}`}>
        <span>{children}</span>
        {icon !== "none" && (
          <span className="btn__icon" aria-hidden="true">
            {icon === "play" ? <PlayIcon /> : <ArrowIcon />}
          </span>
        )}
      </Link>
    </Magnetic>
  );
}
