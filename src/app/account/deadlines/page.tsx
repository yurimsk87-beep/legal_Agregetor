import type { Metadata } from "next";
import { AccountEmptyState, AccountPageHeader } from "@/components/account/AccountShell";

export const metadata: Metadata = {
  title: "Сроки",
  robots: {
    index: false,
    follow: false
  }
};

export default function AccountDeadlinesPage() {
  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <AccountPageHeader
        title="Сроки"
        description="Здесь будут важные даты и напоминания по вашим юридическим вопросам."
      />
      <AccountEmptyState
        title="Важных сроков пока нет"
        description="Здесь будут важные даты и напоминания по вашим юридическим вопросам: подать документ, проверить ответ, подготовить жалобу или уточнить срок."
        actions={[
          { href: "/tools/sudebnyy-prikaz-deadline/", label: "Добавить срок", primary: true },
          { href: "/problems/", label: "Разобрать ситуацию" }
        ]}
      />
    </div>
  );
}
