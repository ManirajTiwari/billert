"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";

type UserData = {
  pharmacyName?: string | null;
  logoUrl?: string | null;
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);

  const navItems = [
    { label: "Billing", href: "/billing" },
    { label: "Account", href: "/account" },
    { label: "Dashboard", href: "/dashboard" },
    { label: "Add medicine", href: "/add-medicine" },
    { label: "Add patient", href: "/add-patient" },
  ];

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((res) => {
        if (isMounted && res) {
          // Adjust property based on what getCurrentUser returns (e.g., res.user or res)
          setUser("user" in res ? (res.user as UserData) : res);
        }
      })
      .catch(() => {
        if (isMounted) setUser(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const initial = user?.pharmacyName
    ? user.pharmacyName.charAt(0).toUpperCase()
    : "P";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 print:bg-white print:min-h-0">
      {/* Hidden completely in print view */}
      <header className="flex items-center justify-between border-b border-gray-300 bg-white px-6 py-3 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-400 bg-gray-100 text-sm font-semibold text-gray-700">
            {user?.logoUrl ? (
              <img
                src={user.logoUrl}
                alt="Pharmacy Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initial}</span>
            )}
          </div>
          <span className="font-medium text-gray-800">
            {user?.pharmacyName || "Pharmacy Name"}
          </span>
        </div>

        <nav className="flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg border border-gray-800 px-4 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-gray-800 text-white"
                    : "text-gray-800 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Padding removed in print view to keep page clear */}
      <main className="flex-1 p-6 print:p-0">{children}</main>
    </div>
  );
}