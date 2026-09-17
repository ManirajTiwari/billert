"use client";

import { useState, Suspense, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cancelInvoice } from "./action";

function CancelBoxContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const invoiceId = searchParams.get("invoiceId");
  const patientId = searchParams.get("patientId");

  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!invoiceId) {
      setError("Missing invoice reference.");
      return;
    }

    if (!remark.trim()) {
      setError("Please provide a cancellation remark.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await cancelInvoice(invoiceId, remark);

    setSubmitting(false);

    if (result.success) {
      // Return to patient details page on success
      if (patientId) {
        router.push(`/add-patient/about_patient?id=${patientId}`);
      } else {
        router.push("/add-patient");
      }
    } else {
      setError(result.error || "Failed to cancel invoice.");
    }
  };

  const backUrl = patientId
    ? `/add-patient/about_patient?id=${patientId}`
    : "/add-patient";

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center p-4">
      <div className="w-full rounded-3xl border-2 border-gray-800 bg-white p-6 shadow-xl md:p-8">
        <div className="mb-6 flex items-center justify-between border-b-2 border-gray-100 pb-4">
          <h1 className="text-xl font-black uppercase text-gray-900">
            Cancel Invoice
          </h1>
          <Link
            href={backUrl}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-800 font-bold text-gray-800 hover:bg-gray-100"
          >
            ✕
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
              Cancellation Remark / Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Enter reason for canceling this invoice..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full rounded-2xl border-2 border-gray-800 p-3 font-medium text-gray-900 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href={backUrl}
              className="rounded-xl border-2 border-gray-800 bg-white px-5 py-2.5 text-xs font-bold uppercase text-gray-800 hover:bg-gray-100"
            >
              Back
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl border-2 border-gray-800 bg-red-600 px-6 py-2.5 text-xs font-bold uppercase text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Cancelling..." : "Confirm Cancel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CancelBoxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center font-bold text-gray-500">
          Loading cancel form...
        </div>
      }
    >
      <CancelBoxContent />
    </Suspense>
  );
}