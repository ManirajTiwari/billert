"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { updateUserProfile } from "@/app/actions/user";

export default function PaymentPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleBuyPlan = async (planType: "monthly" | "yearly") => {
    try {
      setLoadingPlan(planType);
      setMessage(null);

      const user = await getCurrentUser();
      if (!user || !user.email) {
        setMessage("User session not found. Please log in again.");
        setLoadingPlan(null);
        return;
      }

      // Activate subscription via server action
      const res = await updateUserProfile(user.email, {
        subscriptionActive: true,
      });

      if (res.success) {
        setMessage(`Successfully subscribed to ${planType} plan!`);
        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      } else {
        setMessage(res.error || "Failed to process payment.");
      }
    } catch (err) {
      setMessage("An unexpected error occurred.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      {/* Container matching wireframe */}
      <div className="relative min-h-[500px] rounded-3xl border-2 border-gray-800 bg-white p-6 shadow-sm md:p-10">
        
        {/* Back Button Arrow */}
        <Link
          href="/dashboard"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-800 bg-white transition hover:bg-gray-100"
          aria-label="Go Back to Dashboard"
        >
          <svg
            className="h-6 w-6 text-gray-800"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>

        {message && (
          <div className="mt-4 rounded-xl border-2 border-gray-800 bg-gray-100 p-3 text-center font-bold text-gray-800">
            {message}
          </div>
        )}

        {/* Subscription Plans Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          
          {/* Monthly Plan Card */}
          <div className="flex flex-col justify-between rounded-2xl border-2 border-gray-800 bg-white p-6 min-h-[380px]">
            <div className="space-y-6 text-center">
              <h2 className="text-xl font-extrabold uppercase tracking-wide text-gray-900">
                MONTHLY PLAN
              </h2>

              <div className="space-y-2">
                <p className="text-2xl font-black uppercase text-gray-900">
                  500 RUPEES
                </p>
                <p className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  EVERY THING IN APP
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleBuyPlan("monthly")}
              disabled={loadingPlan !== null}
              className="w-full rounded-2xl border-2 border-gray-800 bg-white py-3 font-extrabold uppercase text-gray-900 transition hover:bg-gray-100 disabled:opacity-50"
            >
              {loadingPlan === "monthly" ? "PROCESSING..." : "BUY"}
            </button>
          </div>

          {/* Yearly Subscription Card */}
          <div className="flex flex-col justify-between rounded-2xl border-2 border-gray-800 bg-white p-6 min-h-[380px]">
            <div className="space-y-6 text-center">
              <h2 className="text-xl font-extrabold uppercase tracking-wide text-gray-900">
                YEARLY SUBSCRIPTION
              </h2>

              <div className="space-y-2">
                <p className="text-2xl font-black uppercase text-gray-900">
                  5500 RUPEES
                </p>
                <p className="text-sm font-bold uppercase tracking-wider text-gray-700">
                  EVERY THING IN APP
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleBuyPlan("yearly")}
              disabled={loadingPlan !== null}
              className="w-full rounded-2xl border-2 border-gray-800 bg-white py-3 font-extrabold uppercase text-gray-900 transition hover:bg-gray-100 disabled:opacity-50"
            >
              {loadingPlan === "yearly" ? "PROCESSING..." : "BUY"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}