"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { getMedicines, deleteMedicine } from "./action";
import { Medicine } from "@/types/auth";

type FilterType = "ALL" | "LOW_STOCK" | "EXPIRED";

export default function MedicineStorePage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");
  const [isPending, startTransition] = useTransition();

  const fetchMedicinesData = (search: string, filter: FilterType) => {
    startTransition(async () => {
      const res = await getMedicines(search, filter);
      if (res.success && res.data) {
        setMedicines(Array.isArray(res.data) ? res.data : [res.data]);
      }
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedicinesData(searchQuery, activeFilter);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return;
    const res = await deleteMedicine(id);
    if (res.success) {
      fetchMedicinesData(searchQuery, activeFilter);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Medicine Store
        </h1>
      </div>

      {/* Action / Filter Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="w-full lg:w-72">
          <input
            type="text"
            placeholder="Search medicine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-zinc-900"
          />
        </div>

        {/* Filter & Sub-Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setActiveFilter(activeFilter === "LOW_STOCK" ? "ALL" : "LOW_STOCK")
            }
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border rounded-xl transition ${
              activeFilter === "LOW_STOCK"
                ? "bg-amber-500 text-white border-amber-500"
                : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            LOW STOCK
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveFilter(activeFilter === "EXPIRED" ? "ALL" : "EXPIRED")
            }
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border rounded-xl transition ${
              activeFilter === "EXPIRED"
                ? "bg-rose-600 text-white border-rose-600"
                : "border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            EXPIRED
          </button>

          <Link
            href="/add-medicine/add-medicine-modal"
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            ADD MEDICINE
          </Link>

          <Link
            href="/add-medicine/excel-add-medicine"
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            EXCEL ADD MEDICINE
          </Link>
        </div>
      </div>

      {/* Medicine Items List */}
      <div className="space-y-3 pt-2">
        {isPending ? (
          <div className="text-center py-12 text-sm text-zinc-500">
            Loading medicines...
          </div>
        ) : medicines.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl text-sm text-zinc-500">
            No medicine items found.
          </div>
        ) : (
          medicines.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-2xl shadow-sm hover:border-zinc-400 dark:hover:border-zinc-700 transition"
            >
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {item.name}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span>Company: {item.company}</span>
                  <span>•</span>
                  <span>Type: {item.type}</span>
                  <span>•</span>
                  <span>Stock: {item.noOfBoxes} Box(es)</span>
                  <span>•</span>
                  <span>
                    Price: ₹{item.priceOfBox || item.priceOfStrip || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/add-medicine/add-medicine-modal?id=${item.id}`}
                  className="px-6 py-2 text-sm font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}