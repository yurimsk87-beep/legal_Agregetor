import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, organizationJsonLd } from "@/lib/jsonld";
import { platformContacts } from "@/lib/platform";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Контакты и реквизиты — ПравоПоиск",
  description:
    "Контакты и реквизиты ООО «ПравоПоиск»: обращения по работе сервиса, юридическим документам и обработке персональных данных.",
  path: "/contacts/",
  isIndexable: true
});

const requisites = [
  ["Наименование", platformContacts.fullLegalName],
  ["Сокращенное наименование", platformContacts.legalName],
  ["ИНН", platformContacts.inn],
  ["КПП", platformContacts.kpp],
  ["ОГРН", platformContacts.ogrn],
  ["Юридический адрес", platformContacts.address],
  ["Директор", platformContacts.director]
];

const bankRequisites = [
  ["Расчетный счет", platformContacts.bankAccount],
  ["Банк", platformContacts.bankName],
  ["БИК", platformContacts.bankBik],
  ["Корреспондентский счет", platformContacts.correspondentAccount]
];

export default function ContactsPage() {
  const breadcrumbs = [
    { name: "Главная", path: "/" },
    { name: "Контакты", path: "/contacts/" }
  ];

  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs), organizationJsonLd()]} />
      <Breadcrumbs items={breadcrumbs} />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <section>
          <p className="text-sm font-semibold uppercase tracking-wide text-trust">Контакты</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-ink sm:text-5xl">Контакты</h1>
          <p className="mt-5 text-lg leading-8 text-zinc-700">
            Если у вас есть вопрос по работе сервиса, документам, консультациям юристов или обработке персональных данных, напишите нам на электронную почту.
          </p>
          <p className="mt-5 text-lg leading-8 text-zinc-700">
            E-mail:{" "}
            <a href={platformContacts.emailHref} className="font-semibold text-trust hover:text-ink">
              {platformContacts.email}
            </a>
          </p>
          <p className="mt-3 leading-7 text-zinc-700">Мы рассматриваем обращения пользователей и отвечаем по мере их поступления.</p>
        </section>

        <RequisitesSection title="Реквизиты" items={requisites} />
        <RequisitesSection title="Банковские реквизиты" items={bankRequisites} />

        <section className="mt-8 rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-ink">Обращения по персональным данным</h2>
          <p className="mt-4 leading-7 text-zinc-700">
            По вопросам обработки персональных данных, удаления аккаунта, уточнения информации или отзыва согласия на обработку данных вы можете обратиться по адресу:
          </p>
          <p className="mt-4">
            <a href={platformContacts.emailHref} className="font-semibold text-trust hover:text-ink">
              {platformContacts.email}
            </a>
          </p>
          <p className="mt-4 leading-7 text-zinc-700">
            В обращении укажите ваше имя, контактный email и суть запроса. Это поможет быстрее найти информацию и подготовить ответ.
          </p>
        </section>

        <section className="mt-8 rounded-lg border border-line bg-zinc-50 p-5">
          <h2 className="text-2xl font-semibold text-ink">Важно</h2>
          <p className="mt-4 leading-7 text-zinc-700">
            Материалы на сайте ПравоПоиск носят справочный характер и помогают пользователю разобраться в юридической ситуации, подготовить документы и понять возможные дальнейшие действия.
          </p>
          <p className="mt-4 leading-7 text-zinc-700">
            Информация на сайте не является индивидуальной юридической консультацией и не гарантирует конкретный результат. В сложной ситуации рекомендуется обратиться к юристу.
          </p>
        </section>

        <section className="mt-8 rounded-lg border border-line bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-semibold text-ink">Юридические документы</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              ["/legal/privacy/", "Политика конфиденциальности"],
              ["/legal/terms/", "Пользовательское соглашение"],
              ["/legal/personal-data-consent/", "Согласие на обработку персональных данных"],
              ["/legal/disclaimer/", "О проекте и ограничения"]
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded-md border border-line px-4 py-3 text-sm font-semibold text-ink hover:border-trust hover:text-trust">
                {label}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function RequisitesSection({ title, items }: { title: string; items: string[][] }) {
  return (
    <section className="mt-8 rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <dl className="mt-4 grid gap-3 text-sm leading-6 text-zinc-700">
        {items.map(([label, value]) => (
          <div key={label} className="grid gap-1 sm:grid-cols-[220px_1fr]">
            <dt className="font-semibold text-ink">{label}:</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
