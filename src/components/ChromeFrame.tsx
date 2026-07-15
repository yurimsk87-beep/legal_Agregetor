"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

type ChromeFrameProps = {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
};

const privatePrefixes = ["/admin", "/lawyer-cabinet", "/account"];

export function ChromeFrame({ header, footer, children }: ChromeFrameProps) {
  const pathname = usePathname();
  const isPrivateArea = privatePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isPrivateArea) {
    return <main>{children}</main>;
  }

  return (
    <>
      {header}
      <main>{children}</main>
      {footer}
    </>
  );
}
