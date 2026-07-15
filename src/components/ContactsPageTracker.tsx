"use client";

import { useEffect } from "react";
import { sendAnalyticsEvent } from "@/lib/analytics-client";

export function ContactsPageTracker() {
  useEffect(() => {
    sendAnalyticsEvent({
      type: "CONTACTS_PAGE_OPENED",
      sourcePage: "/contacts/",
      targetType: "PLATFORM",
      targetId: "contacts"
    });
  }, []);

  return null;
}
