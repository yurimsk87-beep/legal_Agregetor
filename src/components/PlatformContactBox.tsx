import Link from "next/link";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import { TrackableLink } from "@/components/TrackableLink";
import { platformContacts, platformTrustLinks } from "@/lib/platform";

export function PlatformContactBox({ cityName }: { cityName?: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-line bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <ShieldCheck className="h-4 w-4 text-trust" aria-hidden="true" />
          Контакты и гарантии платформы
        </div>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          {cityName ? `В ${cityName} консультации доступны онлайн через платформу. ` : ""}
          Мы не показываем личные контакты юристов: вопрос, вопрос и запись на консультацию проходят через сервис.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <TrackableLink href={platformContacts.phoneHref} external eventType="PLATFORM_PHONE_CLICKED" targetType="PLATFORM" className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-trust">
            <Phone className="h-4 w-4" aria-hidden="true" />
            {platformContacts.phone}
          </TrackableLink>
          <TrackableLink href={platformContacts.emailHref} external eventType="PLATFORM_EMAIL_CLICKED" targetType="PLATFORM" className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink hover:border-trust">
            <Mail className="h-4 w-4" aria-hidden="true" />
            {platformContacts.email}
          </TrackableLink>
          {platformTrustLinks.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-zinc-700 hover:border-trust hover:text-trust">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
