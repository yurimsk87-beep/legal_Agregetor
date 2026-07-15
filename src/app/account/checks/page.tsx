import type { Metadata } from "next";
import { AccountEmptyState, AccountPageHeader } from "@/components/account/AccountShell";

export const metadata: Metadata = {
  title: "Проверки документов",
  robots: {
    index: false,
    follow: false
  }
};

export default function AccountChecksPage() {
  return (
    <div className="mx-auto grid max-w-7xl gap-6">
      <AccountPageHeader
        title="Проверки документов"
        description="Здесь появятся документы, которые вы отправили юристу на проверку перед подачей или ответом."
      />
      <AccountEmptyState
        title="Проверок пока нет"
        description="Загрузите судебный приказ, постановление пристава, претензию, договор или другой юридический документ — разбор и статус проверки будут собираться здесь."
        actions={[{ href: "/document-check/", label: "Проверить документ", primary: true }]}
      />
    </div>
  );
}
