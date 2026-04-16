"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authLogout } from "@/services/auth";
import { imagesAndIcons } from "@/constants/imagesAndIcons";
import { useAtomValue } from "jotai";
import { authSessionAtom, setAuthSession } from "@/state/appState";
import { useEffect, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: keyof typeof imagesAndIcons;
  activeIcon: keyof typeof imagesAndIcons;
};

const navItems: NavItem[] = [
  {
    label: "Portfolio",
    href: "/dashboard",
    icon: "portfolio",
    activeIcon: "portfolioActive",
  },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: "transactionsInactive",
    activeIcon: "transactionsActive",
  },
  {
    label: "My Profile",
    href: "/dashboard/profile",
    icon: "myProfile",
    activeIcon: "myProfileActive",
  },
];

export default function Sidebar({
  onNavigate,
}: {
  /** Called after nav actions so a mobile drawer can close */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isSettingsActive =
    pathname === "/dashboard/settings" ||
    pathname.startsWith("/dashboard/settings/");
  const session = useAtomValue(authSessionAtom);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fullName = session
    ? `${session.firstName} ${session.lastName}`.trim()
    : "";
  const displayName = mounted ? fullName || "Account" : "Account";

  return (
    <aside className="w-[210px] bg-[#F6F6F6] border-r border-[#EEEEEE] min-h-screen flex flex-col">
      {/* Logo (in sidebar) */}
      <div className="px-6 pt-6 pb-8">
        <Image
          src={imagesAndIcons.moneylotIconOne}
          alt="Moneylot"
          width={120}
          height={40}
          priority
          className="h-auto w-[120px]"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pt-2">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard" ||
                  pathname.startsWith("/dashboard/investments")
                : pathname === item.href ||
                  pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => onNavigate?.()}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-[8px] transition-colors ${
                    isActive
                      ? "bg-[#1B332D] text-white"
                      : "text-[#5F6368] hover:bg-[#EFEFEF]"
                  }`}
                >
                  <Image
                    src={imagesAndIcons[isActive ? item.activeIcon : item.icon]}
                    alt={item.label}
                    width={18}
                    height={18}
                    className="w-[18px] h-[18px]"
                  />
                  <span className="text-[14px] font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="px-4 pb-5">
        <div className="w-full overflow-hidden rounded-[8px] bg-[#F4F4F4]">
          <Link
            href="/dashboard/settings"
            onClick={() => onNavigate?.()}
            className="flex h-[44px] w-full items-center gap-2.5 px-3 transition-colors hover:bg-[#EFEFEF]"
          >
            <span
              className={`flex h-[32px] w-[32px] items-center justify-center rounded-[8px] ${
                isSettingsActive ? "bg-[#1B332D]" : "bg-white"
              }`}
            >
              <Image
                src={
                  isSettingsActive
                    ? imagesAndIcons.settingsActiveIcon
                    : imagesAndIcons.settingsIcon
                }
                alt="Settings"
                width={24}
                height={24}
                className="h-[24px] w-[24px]"
              />
            </span>
            <span className="text-[14px] font-medium text-[#2E2E2E]">
              {displayName}
            </span>
          </Link>

          <div className="h-px w-full bg-[#E9E9E9]" />

          <button
            type="button"
            onClick={() => {
              void (async () => {
                onNavigate?.();
                try {
                  await authLogout();
                } catch {
                  // Still clear local session if the network call fails
                }
                if (typeof window === "undefined") return;
                try {
                  setAuthSession(null);
                  window.localStorage.removeItem("moneylot_auth_session");
                  window.localStorage.removeItem("moneylot_user_email");
                } catch {
                  // ignore
                }
                try {
                  window.location.replace("/login");
                } catch {
                  try {
                    router.replace("/login");
                  } catch {
                    try {
                      window.location.href = "/login";
                    } catch {
                      // ignore
                    }
                  }
                }
              })();
            }}
            className="flex h-[44px] w-full items-center gap-2.5 px-3 text-left transition-colors hover:bg-[#EFEFEF]"
          >
            <span className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-white">
              <Image
                src={imagesAndIcons.logout}
                alt="Log Out"
                width={24}
                height={24}
                className="h-[24px] w-[24px]"
              />
            </span>
            <span className="text-[14px] font-semibold text-[#EB001B]">
              Log Out
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
