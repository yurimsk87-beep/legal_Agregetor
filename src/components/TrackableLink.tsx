"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import { sendAnalyticsEvent, type AnalyticsEventType } from "@/lib/analytics-client";

type TrackableLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  title?: string;
  external?: boolean;
  target?: string;
  rel?: string;
  eventType: AnalyticsEventType;
  targetType?: string;
  targetId?: string;
  sourcePage?: string;
  payload?: Record<string, unknown>;
};

export function TrackableLink({
  href,
  children,
  className,
  ariaLabel,
  title,
  external = false,
  target,
  rel,
  eventType,
  targetType,
  targetId,
  sourcePage,
  payload
}: TrackableLinkProps) {
  function track(_: MouseEvent<HTMLAnchorElement>) {
    sendAnalyticsEvent({
      type: eventType,
      targetType,
      targetId,
      sourcePage,
      payload
    });
  }

  if (external) {
    return (
      <a href={href} className={className} aria-label={ariaLabel} title={title} target={target} rel={rel} onClick={track} data-seo-block={seoBlock(eventType)}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel} title={title} onClick={track} data-seo-block={seoBlock(eventType)}>
      {children}
    </Link>
  );
}

function seoBlock(eventType: AnalyticsEventType) {
  return eventType === "CTA_CLICK" || eventType === "STICKY_CTA_CLICKED" ? "cta" : undefined;
}
