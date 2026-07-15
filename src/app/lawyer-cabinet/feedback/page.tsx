import { LawyerFeedbackForm } from "@/components/lawyer-cabinet/LawyerCabinetMocks";
import { LawyerPlaceholderPage } from "@/components/lawyer-cabinet/LawyerCabinetShell";

export const metadata = {
  title: "Предложить идею | Кабинет юриста",
  robots: { index: false, follow: false }
};

export default function LawyerFeedbackPage() {
  return (
    <LawyerPlaceholderPage title="Предложить идею" description="Напишите, что можно улучшить в личном кабинете или работе платформы.">
      <LawyerFeedbackForm />
    </LawyerPlaceholderPage>
  );
}
