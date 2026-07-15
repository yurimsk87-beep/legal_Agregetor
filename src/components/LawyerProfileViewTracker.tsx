"use client";

import { useEffect } from "react";
import { sendAnalyticsEvent } from "@/lib/analytics-client";

type LawyerProfileViewTrackerProps = {
  lawyerId: string;
  lawyerSlug: string;
  cityId?: string;
  serviceId?: string;
};

export function LawyerProfileViewTracker({ lawyerId, cityId, serviceId }: LawyerProfileViewTrackerProps) {
  useEffect(() => {
    sendAnalyticsEvent({
      type: "LAWYER_PROFILE_VIEW",
      targetType: "LAWYER",
      targetId: lawyerId,
      payload: {
        lawyerId,
        cityId,
        serviceId
      }
    });
  }, [cityId, lawyerId, serviceId]);

  return null;
}
