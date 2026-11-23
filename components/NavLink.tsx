"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "font-bold text-slate-900 underline decoration-indigo-600 decoration-2 underline-offset-4"
          : "hover:text-slate-900"
      }
    >
      {children}
    </Link>
  );
}
