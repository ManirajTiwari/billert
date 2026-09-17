"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getPatientDetails,
  DetailedPatient,
  PatientInvoice,
} from "./action";
import BillInvoice, { InvoiceItem } from "@/app/(main)/bill_invoice/page";

// Helper function to convert numeric total to words
function numberToWords(num: number): string {
  if (num <= 0) return "ZERO ONLY";
  const a = [
    "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN",
    "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"
  ];
  const b = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
  
  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " HUNDRED" + (n % 100 ? " " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " THOUSAND" + (n % 1000 ? " " + inWords(n % 1000) : "");
    return n.toString();
  };

  return `${inWords(Math.floor(num))} ONLY`;
}

function PatientDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");

  const [patient, setPatient] = useState<DetailedPatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const fetchPatientData = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      setError("No patient ID provided.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await getPatientDetails(patientId);

    if (result.success && result.data) {
      setPatient(result.data);
      if (result.data.invoices && result.data.invoices.length > 0) {
        setSelectedInvoiceId(result.data.invoices[0].id);
      }
    } else {
      setError(result.error || "Patient record not found.");
    }
    setLoading(false);
  }, [patientId]);

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  const handlePrint = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleCancelClick = (invoiceId: string) => {
    if (!patientId) return;
    router.push(
      `/add-patient/about_patient/cancelbox?invoiceId=${invoiceId}&patientId=${patientId}`
    );
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-bold text-gray-500">
        Loading patient details...
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <div className="rounded-3xl border-2 border-gray-800 bg-white p-8 text-center font-bold text-gray-600">
          <p className="mb-4">{error || "Patient record not found."}</p>
          <Link
            href="/add-patient"
            className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-gray-800 bg-white px-4 text-xs font-bold uppercase transition hover:bg-gray-100"
          >
            ← Back to Patients
          </Link>
        </div>
      </div>
    );
  }

  const activeInvoice: PatientInvoice | undefined =
    patient.invoices?.find((inv) => inv.id === selectedInvoiceId) ||
    patient.invoices?.[0];

  const formattedItems: InvoiceItem[] =
    activeInvoice?.items?.map((item, idx) => {
      const unit = item.quantity || 1;
      const rate = item.price || 0;
      return {
        id: idx + 1,
        particular: item.name || "MEDICAL ITEM / SERVICE",
        date: activeInvoice.date,
        unit: unit,
        rate: rate,
        amount: unit * rate,
      };
    }) || [];

  return (
    <>
      {/* SCREEN UI */}
      <div className="mx-auto max-w-5xl space-y-6 p-4 print:hidden">
        <div className="relative min-h-[500px] rounded-3xl border-2 border-gray-800 bg-white p-6 shadow-sm md:p-10">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/add-patient"
              className="inline-flex h-10 items-center justify-center rounded-xl border-2 border-gray-800 bg-white px-4 text-xs font-bold uppercase transition hover:bg-gray-100"
            >
              ← Back to Patients
            </Link>
          </div>

          <div className="mb-8 space-y-1 border-b-2 border-gray-100 pb-6">
            <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900">
              {patient.name}
            </h1>
            <p className="text-sm font-bold uppercase tracking-wide text-gray-600">
              {patient.ptid} &nbsp;|&nbsp; {patient.age} YRS &nbsp;|&nbsp; {patient.gender}
            </p>
          </div>

          <div className="space-y-4">
            {!patient.invoices || patient.invoices.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center text-sm font-bold uppercase text-gray-400">
                No invoice records available for this patient.
              </div>
            ) : (
              patient.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`flex flex-col justify-between rounded-2xl border-2 p-5 transition hover:shadow-md sm:flex-row sm:items-center ${
                    invoice.isCancelled
                      ? "border-red-300 bg-red-50/40"
                      : "border-gray-800 bg-white"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`text-lg font-black uppercase ${
                          invoice.isCancelled
                            ? "text-gray-400 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {invoice.invoiceNumber}
                      </span>
                      <span className="text-xs font-bold uppercase text-gray-500">
                        {invoice.date}
                      </span>

                      {invoice.isCancelled && (
                        <span className="rounded-md border border-red-500 bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase text-red-600">
                          CANCELLED
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-semibold uppercase text-gray-600">
                      {invoice.items && invoice.items.length > 0
                        ? invoice.items
                            .map((item) => `${item.name} (₹${item.price})`)
                            .join(", ")
                        : "No items listed"}
                    </div>

                    {invoice.isCancelled && invoice.cancelRemark && (
                      <div className="text-xs font-semibold italic text-red-600">
                        Reason: {invoice.cancelRemark}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-6 sm:mt-0 sm:justify-end">
                    <div className="flex flex-col items-start sm:items-end">
                      <span
                        className={`text-sm font-black uppercase tracking-wide ${
                          invoice.isCancelled
                            ? "text-gray-400 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        TOTAL: ₹{invoice.totalPrice}
                      </span>
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <button
                          type="button"
                          onClick={() => handlePrint(invoice.id)}
                          className="hover:underline focus:outline-none"
                        >
                          print
                        </button>
                      </div>
                    </div>

                    {!invoice.isCancelled ? (
                      <button
                        type="button"
                        onClick={() => handleCancelClick(invoice.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-800 bg-white font-bold text-gray-800 transition hover:bg-red-50 hover:text-red-600"
                        title="Cancel Invoice"
                      >
                        ✕
                      </button>
                    ) : (
                      <div
                        className="flex h-8 items-center justify-center rounded-lg border-2 border-red-300 bg-red-100 px-2 text-[10px] font-black uppercase text-red-600"
                        title="This transaction has been cancelled"
                      >
                        Cancelled
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* PRINT LAYOUT */}
      {activeInvoice && (
        <div className="hidden print:block">
          <BillInvoice
            patientName={patient.name}
            ptid={patient.ptid}
            ageGender={`${patient.age} / ${patient.gender}`}
            phoneNumber={patient.phoneNumber}
            billNumber={activeInvoice.invoiceNumber}
            billDate={activeInvoice.date}
            items={formattedItems}
            billedAmount={activeInvoice.billedAmount}
            discountAmount={activeInvoice.discountAmount}
            paidAmount={activeInvoice.paidAmount}
            amountInWords={numberToWords(activeInvoice.paidAmount)}
          />
        </div>
      )}
    </>
  );
}

export default function AboutPatientPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center font-bold text-gray-500">Loading...</div>
      }
    >
      <PatientDetailContent />
    </Suspense>
  );
}