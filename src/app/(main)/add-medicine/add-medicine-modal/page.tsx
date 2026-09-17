"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addMedicineAction,
  getMedicineById,
  updateMedicineAction,
  BatchItem,
} from "./action";

export default function AddMedicineModalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const medicineId = searchParams.get("id");

  const [isLoading, setIsLoading] = useState(!!medicineId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Form State
  const [medicineName, setMedicineName] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState("Tablet");

  const [noOfBoxes, setNoOfBoxes] = useState<number | "">("");
  const [stripsPerBox, setStripsPerBox] = useState<number | "">("");
  const [tabletsPerBox, setTabletsPerBox] = useState<number | "">("");
  const [priceOfBox, setPriceOfBox] = useState<number | "">("");
  const [priceOfStrip, setPriceOfStrip] = useState<number | "">("");
  const [priceOfTablet, setPriceOfTablet] = useState<number | "">("");

  const [lowStockNumber, setLowStockNumber] = useState<number | "">("");
  const [lowStockType, setLowStockType] = useState("Box");

  const [batches, setBatches] = useState<BatchItem[]>([
    { batchNumber: "", unitType: "Box", quantity: 0, expiryDate: "" },
  ]);

  // Load Medicine Data if ID exists in URL query params
  useEffect(() => {
    if (!medicineId) return;

    async function loadMedicine() {
      setIsLoading(true);
      const res = await getMedicineById(medicineId as string);

      if (res.success && res.data) {
        const med = res.data;
        setMedicineName(med.name || "");
        setCompany(med.company || "");
        setType(med.type || "Tablet");

        setNoOfBoxes(med.noOfBoxes ?? "");
        setStripsPerBox(med.stripsPerBox ?? "");
        setTabletsPerBox(med.tabletsPerBox ?? "");

        setPriceOfBox(med.priceOfBox ?? "");
        setPriceOfStrip(med.priceOfStrip ?? "");
        setPriceOfTablet(med.priceOfTablet ?? "");

        setLowStockNumber(med.lowStockThreshold ?? "");
        setLowStockType(med.lowStockUnit || "Box");

        if (med.batches && med.batches.length > 0) {
          setBatches(
            med.batches.map((b: any) => ({
              batchNumber: b.batchNumber || "",
              unitType: b.unitType || "Box",
              quantity: b.quantity || 0,
              expiryDate: b.expiryDate
                ? new Date(b.expiryDate).toISOString().split("T")[0]
                : "",
            }))
          );
        }
      } else {
        setMessage({
          text: res.error || "Failed to load medicine details.",
          isError: true,
        });
      }
      setIsLoading(false);
    }

    loadMedicine();
  }, [medicineId]);

  const handleAddBatch = () => {
    setBatches((prev) => [
      ...prev,
      { batchNumber: "", unitType: "Box", quantity: 0, expiryDate: "" },
    ]);
  };

  const handleRemoveBatch = (index: number) => {
    if (batches.length === 1) return;
    setBatches((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBatchChange = (
    index: number,
    field: keyof BatchItem,
    value: string | number
  ) => {
    setBatches((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const payload = {
      name: medicineName,
      company,
      type,
      noOfBoxes: Number(noOfBoxes) || 0,
      stripsPerBox: Number(stripsPerBox) || 0,
      tabletsPerBox: Number(tabletsPerBox) || 0,
      priceOfBox: Number(priceOfBox) || 0,
      priceOfStrip: Number(priceOfStrip) || 0,
      priceOfTablet: Number(priceOfTablet) || 0,
      lowStockNumber: Number(lowStockNumber) || 0,
      lowStockType,
      batches: batches.map((b) => ({
        ...b,
        quantity: Number(b.quantity) || 0,
      })),
    };

    let res;
    if (medicineId) {
      // Update Mode
      res = await updateMedicineAction(medicineId, payload);
    } else {
      // Create Mode
      res = await addMedicineAction(payload);
    }

    setIsSubmitting(false);

    if (res.success) {
      setMessage({
        text: medicineId
          ? "Medicine updated successfully!"
          : "Medicine added successfully!",
        isError: false,
      });

      if (!medicineId) {
        // Reset form fields only on creation
        setMedicineName("");
        setCompany("");
        setNoOfBoxes("");
        setStripsPerBox("");
        setTabletsPerBox("");
        setPriceOfBox("");
        setPriceOfStrip("");
        setPriceOfTablet("");
        setLowStockNumber("");
        setBatches([{ batchNumber: "", unitType: "Box", quantity: 0, expiryDate: "" }]);
      } else {
        // Return to medicine list after successful update
        setTimeout(() => router.push("/medicine-store"), 1200);
      }
    } else {
      setMessage({ text: res.error || "Something went wrong.", isError: true });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-sm font-semibold text-zinc-500">
        Loading medicine data...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-2xl shadow-sm space-y-6">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
        {medicineId ? "Edit Medicine Details" : "Add Medicine Details"}
      </h2>

      {message && (
        <div
          className={`p-3 text-sm rounded-lg ${
            message.isError
              ? "bg-red-100 text-red-700 border border-red-200"
              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. MEDICINE SECTION */}
        <fieldset className="border border-zinc-300 dark:border-zinc-700 rounded-xl p-4 space-y-3">
          <legend className="px-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
            Medicine
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Medicine Name
              </label>
              <input
                type="text"
                required
                placeholder="MEDICINE NAME"
                value={medicineName}
                onChange={(e) => setMedicineName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Company
              </label>
              <input
                type="text"
                required
                placeholder="COMPANY"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Type Dropdown
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Ointment">Ointment</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* 2. MEDICINE COUNT SECTION */}
        <fieldset className="border border-zinc-300 dark:border-zinc-700 rounded-xl p-4 space-y-4">
          <legend className="px-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
            Medicine Count
          </legend>
          {/* Row 1: Quantities */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                No of Box
              </label>
              <input
                type="number"
                min="0"
                placeholder="NO OF BOX"
                value={noOfBoxes}
                onChange={(e) =>
                  setNoOfBoxes(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Strip in One Box
              </label>
              <input
                type="number"
                min="0"
                placeholder="STRIP IN ONE BOX"
                value={stripsPerBox}
                onChange={(e) =>
                  setStripsPerBox(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Tablet in One Box
              </label>
              <input
                type="number"
                min="0"
                placeholder="TABLET IN ONE BOX"
                value={tabletsPerBox}
                onChange={(e) =>
                  setTabletsPerBox(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
              />
            </div>
          </div>

          {/* Row 2: Prices */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Price of Box
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="PRICE OF BOX"
                value={priceOfBox}
                onChange={(e) =>
                  setPriceOfBox(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Price of One Strip
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="PRICE OF ONE STRIP"
                value={priceOfStrip}
                onChange={(e) =>
                  setPriceOfStrip(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Price of One Tablet
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="PRICE OF ONE TABLET"
                value={priceOfTablet}
                onChange={(e) =>
                  setPriceOfTablet(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
              />
            </div>
          </div>
        </fieldset>

        {/* 3. LOW STOCK WARNING SECTION */}
        <fieldset className="border border-zinc-300 dark:border-zinc-700 rounded-xl p-4 space-y-3">
          <legend className="px-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
            Low Stock Warning
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Number Threshold
              </label>
              <input
                type="number"
                min="0"
                placeholder="NUMBER"
                value={lowStockNumber}
                onChange={(e) =>
                  setLowStockNumber(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">
                Type Dropdown
              </label>
              <select
                value={lowStockType}
                onChange={(e) => setLowStockType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
              >
                <option value="Box">Box</option>
                <option value="Strip">Strip</option>
                <option value="Tablet">Tablet</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* 4. EXPIRY DATE SECTION */}
        <fieldset className="border border-zinc-300 dark:border-zinc-700 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <legend className="px-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase">
              Expiry Date
            </legend>
            <button
              type="button"
              onClick={handleAddBatch}
              className="px-4 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              ADD EXPIRY DATE
            </button>
          </div>

          <div className="space-y-3">
            {batches.map((batch, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800"
              >
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BATCH NUMBER"
                    value={batch.batchNumber}
                    onChange={(e) =>
                      handleBatchChange(index, "batchNumber", e.target.value)
                    }
                    className="w-full px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1">
                    Type Dropdown
                  </label>
                  <select
                    value={batch.unitType}
                    onChange={(e) =>
                      handleBatchChange(index, "unitType", e.target.value)
                    }
                    className="w-full px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
                  >
                    <option value="Box">Box</option>
                    <option value="Strip">Strip</option>
                    <option value="Tablet">Tablet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1">
                    Quantity / Number
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="NUMBER"
                    value={batch.quantity || ""}
                    onChange={(e) =>
                      handleBatchChange(index, "quantity", Number(e.target.value))
                    }
                    className="w-full px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase font-semibold text-zinc-400 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      required
                      value={batch.expiryDate}
                      onChange={(e) =>
                        handleBatchChange(index, "expiryDate", e.target.value)
                      }
                      className="w-full px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
                    />
                  </div>
                  {batches.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBatch(index)}
                      className="mt-5 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md text-xs"
                      title="Remove batch row"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </fieldset>

        {/* Submit Controls */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 text-sm font-semibold text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
          >
            {isSubmitting
              ? "Saving..."
              : medicineId
              ? "Update Medicine"
              : "Save Medicine"}
          </button>
        </div>
      </form>
    </div>
  );
}