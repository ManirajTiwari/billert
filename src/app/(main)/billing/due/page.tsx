"use client";

import { useState, useEffect, useCallback } from "react";
import { getDraftBills, payDraftBill, DueRecord } from "./action";

export default function SaveDraftDuePage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [dueRecords, setDueRecords] = useState<DueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    const data = await getDraftBills({
      fromDate,
      toDate,
      searchQuery,
    });
    setDueRecords(data);
    setLoading(false);
  }, [fromDate, toDate, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDrafts();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchDrafts]);

  const handlePay = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await payDraftBill(id);

      if (res.success) {
        // Refresh the drafts list after successful payment
        await fetchDrafts();
      } else {
        alert(res.error || "Failed to process payment.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <div className="space-y-6 rounded-3xl border-2 border-gray-800 bg-white p-6 shadow-sm md:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          SAVE DRAFT
        </h1>

        {/* Date Filters Section */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-1 items-center gap-2 min-w-[200px]">
            <label className="text-xs font-bold uppercase text-gray-600 whitespace-nowrap">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-800 bg-white p-2 text-sm font-bold uppercase focus:outline-none"
            />
          </div>

          <div className="flex flex-1 items-center gap-2 min-w-[200px]">
            <label className="text-xs font-bold uppercase text-gray-600 whitespace-nowrap">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-800 bg-white p-2 text-sm font-bold uppercase focus:outline-none"
            />
          </div>
        </div>

        {/* Search Bar */}
        <div>
          <input
            type="text"
            placeholder="SEARCH BY PTID, NUMBER, NAME"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-800 p-3 font-medium text-sm placeholder-gray-400 focus:outline-none"
          />
        </div>

        {/* Records List */}
        <div className="space-y-4 pt-2">
          {loading ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center text-sm font-semibold text-gray-400">
              Loading draft records...
            </div>
          ) : dueRecords.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center text-sm font-semibold text-gray-400">
              No draft or due records found.
            </div>
          ) : (
            dueRecords.map((record) => (
              <div
                key={record.id}
                className="flex flex-col gap-4 rounded-2xl border-2 border-gray-800 bg-white p-5 transition hover:bg-gray-50/50 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Left: Patient Info */}
                <div className="space-y-1">
                  <span className="inline-block rounded-md border border-gray-800 bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-800">
                    PTID: {record.ptid}
                  </span>
                  <p className="text-base font-bold text-gray-900">{record.name}</p>
                  <p className="text-xs font-semibold text-gray-500">{record.phone}</p>
                </div>

                {/* Middle: Due Details */}
                <div className="space-y-1">
                  <div className="text-sm font-bold text-gray-800">
                    <span className="text-xs font-semibold uppercase text-gray-500">
                      Due Amount:{" "}
                    </span>
                    ₹{record.dueAmount.toFixed(2)}
                  </div>
                  <div className="text-xs font-semibold text-gray-500">
                    <span className="uppercase">Due Date: </span>
                    {record.dueDate}
                  </div>
                </div>

                {/* Right: Action Button */}
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    disabled={processingId === record.id}
                    onClick={() => handlePay(record.id)}
                    className="w-full rounded-xl border-2 border-gray-800 bg-white px-8 py-2 font-bold uppercase text-gray-800 transition hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
                  >
                    {processingId === record.id ? "Processing..." : "Pay"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}