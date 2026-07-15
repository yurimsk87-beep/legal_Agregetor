import Link from "next/link";
import { redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/server-auth";

export const metadata = buildMetadata({
  title: "Вопросы для ответа",
  description: "Кабинет юриста: опубликованные вопросы, на которые можно ответить.",
  path: "/lawyer/questions/",
  isIndexable: false
});

export default async function LawyerQuestionsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login/?next=/lawyer/questions/");
  }
  if (user.role !== "LAWYER") {
    redirect("/");
  }

  const questions = await prisma.question.findMany({
    where: { status: "PUBLISHED", qualityStatus: "APPROVED" },
    include: { city: true, service: true },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 50
  }).catch(() => []);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-semibold text-ink">Вопросы, на которые можно ответить</h1>
      <div className="mt-8 grid gap-4">
        {questions.map((question) => (
          <Link key={question.id} href={`/lawyer/questions/${question.id}/answer/`} className="rounded-lg border border-line bg-white p-5 hover:border-trust">
            <h2 className="font-semibold text-ink">{question.title}</h2>
            <p className="mt-2 text-sm text-zinc-600">
              {question.city?.name ?? "Россия"} · {question.service?.name ?? "Юридический вопрос"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
