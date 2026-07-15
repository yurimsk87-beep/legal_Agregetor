import { LawyerPlaceholderPage } from "@/components/lawyer-cabinet/LawyerCabinetShell";

export const metadata = {
  title: "Реклама | Кабинет юриста",
  robots: { index: false, follow: false }
};

export default function LawyerAdvertisingPage() {
  return (
    <LawyerPlaceholderPage
      title="Реклама"
      description="Раздел продвижения находится в разработке. Позже здесь можно будет подключить продвижение профиля в городе и по специализации."
    />
  );
}
