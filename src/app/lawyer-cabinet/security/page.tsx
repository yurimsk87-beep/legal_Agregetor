import { LawyerPlaceholderPage } from "@/components/lawyer-cabinet/LawyerCabinetShell";

export const metadata = {
  title: "Безопасность | Кабинет юриста",
  robots: { index: false, follow: false }
};

export default function LawyerSecurityPage() {
  return (
    <LawyerPlaceholderPage
      title="Безопасность"
      description="Здесь будут настройки пароля, email-уведомлений и активных сессий. На MVP auth-система не расширяется."
    />
  );
}
