import type { Metadata } from "next";
import { AccountEmptyState, AccountFeatureGrid, AccountPageHeader } from "@/components/account/AccountShell";

export const metadata: Metadata = {
  title: "Мои дела",
  robots: {
    index: false,
    follow: false
  }
};

export default function AccountCasesPage() {
  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <AccountPageHeader
        title="Мои дела"
        description="Здесь будут храниться ваши юридические ситуации: разбор, документы, вопросы юристу, проверки и важные сроки."
      />

      <AccountEmptyState
        title="У вас пока нет сохранённых юридических вопросов"
        description="Опишите проблему, сформируйте документ или загрузите файл на проверку — мы сохраним всё в одном месте."
        note="Дело — это сохранённая юридическая ситуация: разбор, документы, сроки, вопросы юристу и следующие шаги."
        actions={[
          { href: "/", label: "Описать проблему", primary: true },
          { href: "/documents/", label: "Сформировать документ" },
          { href: "/document-check/", label: "Проверить документ" },
          { href: "/questions/#question", label: "Задать вопрос юристу" }
        ]}
      />

      <AccountFeatureGrid />
    </div>
  );
}
