"use client";

import { QuestionWizard } from "@/components/QuestionWizard";
import type { City, Service } from "@/lib/types";

type QuestionFormProps = {
  cities: City[];
  services: Service[];
  sourcePage: string;
  defaultCityId?: string;
  defaultServiceId?: string;
  compact?: boolean;
  onSuccess?: () => void;
};

export function QuestionForm(props: QuestionFormProps) {
  return <QuestionWizard {...props} />;
}
