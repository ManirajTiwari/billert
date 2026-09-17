"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  searchPatients,
  searchMedicines,
  processPayment,
  saveDraftBill,
  FoundPatient,
  FoundMedicine as BaseFoundMedicine,
} from "./action";

type UnitType = "BOX" | "STRIP" | "TABLET";

export interface FoundMedicine extends BaseFoundMedicine {
  currencySymbol?: string | null;
}

interface BillItem {
  id: string;
  medicineId: string;
  name: string;
  type: UnitType;
  quantity: number;
  priceOfBox: number;
  priceOfStrip: number;
  priceOfTablet: number;
  price: number;
  discount: number;
  expiryDate?: string;
  batchNumber?: string;
}

interface BillingPageProps {
  currencySymbol?: string | null;
}

type ActionResult =
  | { success: true; data?: unknown; error?: never }
  | { success: false; error: string };

type ConfirmationAction = "pay" | "draft" | null;

export default function BillingPage({ currencySymbol = "" }: BillingPageProps) {
  // Search state
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<FoundPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<FoundPatient | null>(null);
  const [isSearchingPatients, setIsSearchingPatients] = useState(false);

  const [medicineSearch, setMedicineSearch] = useState("");
  const [medicineResults, setMedicineResults] = useState<FoundMedicine[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<FoundMedicine | null>(null);
  const [selectedExpiry, setSelectedExpiry] = useState("");
  const [selectedBatchNumber, setSelectedBatchNumber] = useState("");
  const [isSearchingMedicines, setIsSearchingMedicines] = useState(false);

  // Billing state
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card">("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmationAction>(null);

  // Formatting helper
  const formatCurrency = (amount: number, customSymbol?: string | null) => {
    const symbol = customSymbol ?? currencySymbol ?? "";
    return `${symbol}${amount.toFixed(2)}`;
  };

  // Debounced Patient Search
  useEffect(() => {
    let isCancelled = false;
    const fetchPatients = async () => {
      if (!patientSearch.trim()) {
        setPatientResults([]);
        return;
      }
      setIsSearchingPatients(true);
      try {
        const results = await searchPatients(patientSearch);
        if (!isCancelled) setPatientResults(results || []);
      } catch {
        if (!isCancelled) setPatientResults([]);
      } finally {
        if (!isCancelled) setIsSearchingPatients(false);
      }
    };

    const timer = setTimeout(fetchPatients, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [patientSearch]);

  // Debounced Medicine Search
  useEffect(() => {
    let isCancelled = false;
    const fetchMeds = async () => {
      if (!medicineSearch.trim()) {
        setMedicineResults([]);
        setSelectedMedicine(null);
        return;
      }
      setIsSearchingMedicines(true);
      try {
        const results = await searchMedicines(medicineSearch);
        if (!isCancelled) setMedicineResults(results || []);
      } catch {
        if (!isCancelled) setMedicineResults([]);
      } finally {
        if (!isCancelled) setIsSearchingMedicines(false);
      }
    };

    const timer = setTimeout(fetchMeds, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [medicineSearch]);

  // Computed Values
  const grossPrice = billItems.reduce(
    (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
    0
  );
  const totalDiscount = billItems.reduce((acc, item) => acc + (item.discount || 0), 0);
  const netPrice = Math.max(0, grossPrice - totalDiscount);

  // Handlers
  const handleSelectPatient = (patient: FoundPatient) => {
    setSelectedPatient(patient);
    setPatientSearch(patient.name);
    setPatientResults([]);
  };

  const handleSelectMedicineResult = (med: FoundMedicine) => {
    setSelectedMedicine(med);
    if (med.batches && med.batches.length > 0) {
      const firstBatch = med.batches[0];
      setSelectedExpiry(new Date(firstBatch.expiryDate).toISOString());
      setSelectedBatchNumber(firstBatch.batchNumber);
    } else {
      setSelectedExpiry("");
      setSelectedBatchNumber("");
    }
  };

  const handleBatchChange = (batchIndexStr: string) => {
    if (!selectedMedicine?.batches) return;
    const index = parseInt(batchIndexStr, 10);
    const batch = selectedMedicine.batches[index];
    if (batch) {
      setSelectedExpiry(new Date(batch.expiryDate).toISOString());
      setSelectedBatchNumber(batch.batchNumber);
    } else {
      setSelectedExpiry("");
      setSelectedBatchNumber("");
    }
  };

  const handleAddMedicine = () => {
    if (!selectedMedicine) return;

    const newItem: BillItem = {
      id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${selectedMedicine.id}-${Date.now()}`,
      medicineId: selectedMedicine.id,
      name: selectedMedicine.name,
      type: "BOX",
      quantity: 1,
      priceOfBox: selectedMedicine.priceOfBox || 0,
      priceOfStrip: selectedMedicine.priceOfStrip || 0,
      priceOfTablet: selectedMedicine.priceOfTablet || 0,
      price: selectedMedicine.priceOfBox || 0,
      discount: 0,
      expiryDate: selectedExpiry || undefined,
      batchNumber: selectedBatchNumber || undefined,
    };

    setBillItems((prev) => [...prev, newItem]);
    setMedicineSearch("");
    setSelectedMedicine(null);
    setMedicineResults([]);
    setSelectedExpiry("");
    setSelectedBatchNumber("");
  };

  const handleUpdateItemType = (id: string, newType: UnitType) => {
    setBillItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        let autoPrice = item.price;
        if (newType === "BOX") autoPrice = item.priceOfBox;
        else if (newType === "STRIP") autoPrice = item.priceOfStrip;
        else if (newType === "TABLET") autoPrice = item.priceOfTablet;

        return { ...item, type: newType, price: autoPrice };
      })
    );
  };

  const handleUpdateItem = <K extends keyof BillItem>(
    id: string,
    field: K,
    value: BillItem[K]
  ) => {
    setBillItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setBillItems((prev) => prev.filter((item) => item.id !== id));
  };

  const resetForm = () => {
    setBillItems([]);
    setSelectedPatient(null);
    setPatientSearch("");
    setMedicineSearch("");
    setSelectedMedicine(null);
    setMedicineResults([]);
    setSelectedExpiry("");
    setSelectedBatchNumber("");
  };

  const buildPayload = () => ({
    patientId: selectedPatient?.id,
    patientName: selectedPatient?.name || "Guest Patient",
    grossPrice,
    totalDiscount,
    netPrice,
    paymentMethod,
    items: billItems.map((item) => ({
      medicineId: item.medicineId,
      name: item.name,
      type: item.type,
      quantity: item.quantity,
      price: item.price,
      discount: item.discount,
      expiryDate: item.expiryDate,
      batchNumber: item.batchNumber,
    })),
  });

  const handlePay = async () => {
    if (billItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const result = (await processPayment(buildPayload())) as ActionResult;
      if (result.success) {
        alert("Payment successful and bill recorded!");
        resetForm();
      } else {
        alert(result.error || "An error occurred while processing payment.");
      }
    } catch {
      alert("Network or server error while processing payment.");
    } finally {
      setIsSubmitting(false);
      setConfirmAction(null);
    }
  };

  const handleSaveDraft = async () => {
    if (billItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const result = (await saveDraftBill(buildPayload())) as ActionResult;
      if (result.success) {
        alert("Draft saved successfully!");
        resetForm();
      } else {
        alert(result.error || "An error occurred while saving draft.");
      }
    } catch {
      alert("Network or server error while saving draft.");
    } finally {
      setIsSubmitting(false);
      setConfirmAction(null);
    }
  };

  const handleConfirmAction = () => {
    if (confirmAction === "pay") handlePay();
    else if (confirmAction === "draft") handleSaveDraft();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Billing</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN */}
        <div className="space-y-6 lg:col-span-4">
          {/* Patient Search Card */}
          <div className="relative rounded-2xl border-2 border-gray-800 bg-white p-5 shadow-sm">
            <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-gray-700">
              Search Patient
            </label>
            <input
              type="text"
              placeholder="Type patient name or phone..."
              value={patientSearch}
              onChange={(e) => {
                setPatientSearch(e.target.value);
                if (selectedPatient) setSelectedPatient(null);
              }}
              className="w-full rounded-xl border-2 border-gray-800 p-2.5 font-medium focus:outline-none"
            />

            {patientResults.length > 0 && !selectedPatient && (
              <div className="absolute left-0 right-0 z-20 mx-5 mt-1 divide-y-2 divide-gray-200 overflow-hidden rounded-xl border-2 border-gray-800 bg-white shadow-lg">
                {patientResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPatient(p)}
                    className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-100"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        PTID: {p.id.slice(0, 8)} | {p.phoneNumber}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gray-400">Select</span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4">
              <span className="text-xs font-bold uppercase text-gray-500">Selected Patient</span>
              {selectedPatient ? (
                <div className="mt-1 flex items-center justify-between rounded-xl border-2 border-gray-800 bg-gray-50 p-3 text-sm font-semibold">
                  <div>
                    <p className="font-bold text-gray-900">{selectedPatient.name}</p>
                    <p className="text-xs text-gray-500">
                      PTID: {selectedPatient.id.slice(0, 8)} | Phone: {selectedPatient.phoneNumber}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setPatientSearch("");
                    }}
                    className="rounded-lg border border-gray-800 bg-white px-2 py-1 text-xs font-bold hover:bg-gray-100"
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-sm font-medium text-gray-400">
                  {isSearchingPatients ? "Searching patients..." : "No patient selected."}
                </p>
              )}
            </div>
          </div>

          {/* Medicine Search Card */}
          <div className="relative rounded-2xl border-2 border-gray-800 bg-white p-5 shadow-sm">
            <label className="mb-2 block text-sm font-bold uppercase tracking-wide text-gray-700">
              Search Medicine
            </label>
            <input
              type="text"
              placeholder="Type medicine name..."
              value={medicineSearch}
              onChange={(e) => setMedicineSearch(e.target.value)}
              className="w-full rounded-xl border-2 border-gray-800 p-2.5 font-medium focus:outline-none"
            />

            {medicineResults.length > 0 && !selectedMedicine && (
              <div className="absolute left-0 right-0 z-20 mx-5 mt-1 divide-y-2 divide-gray-200 overflow-hidden rounded-xl border-2 border-gray-800 bg-white shadow-lg">
                {medicineResults.map((med) => (
                  <button
                    key={med.id}
                    type="button"
                    onClick={() => handleSelectMedicineResult(med)}
                    className="flex w-full items-center justify-between p-3 text-left hover:bg-gray-100"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{med.name}</p>
                      <p className="text-xs text-gray-500">{med.company} ({med.type})</p>
                    </div>
                    <span className="text-xs font-bold text-gray-800">
                      {formatCurrency(med.priceOfBox || 0, med.currencySymbol)}/Box
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4">
              <span className="text-xs font-bold uppercase text-gray-500">Selected Medicine</span>
              {selectedMedicine ? (
                <div className="mt-1 space-y-2">
                  <div className="flex items-center justify-between rounded-xl border-2 border-gray-800 bg-gray-50 p-3 text-sm font-semibold">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-gray-900">{selectedMedicine.name}</p>
                      <p className="text-xs text-gray-500">{selectedMedicine.company}</p>

                      {selectedMedicine.batches && selectedMedicine.batches.length > 0 ? (
                        <select
                          onChange={(e) => handleBatchChange(e.target.value)}
                          className="mt-2 w-full rounded-lg border border-gray-400 bg-white px-2 py-1 text-xs focus:outline-none"
                        >
                          {selectedMedicine.batches.map((b, idx) => (
                            <option key={b.batchNumber || idx} value={idx}>
                              Batch: {b.batchNumber} (Exp: {new Date(b.expiryDate).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Expiry date (optional)"
                          value={selectedExpiry}
                          onChange={(e) => setSelectedExpiry(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-gray-400 bg-white px-2 py-0.5 text-xs focus:outline-none"
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMedicine}
                      className="rounded-lg border-2 border-gray-800 bg-white px-3 py-1.5 text-xs font-bold uppercase transition hover:bg-gray-100"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm font-medium text-gray-400">
                  {isSearchingMedicines ? "Searching medicines..." : "Search for medicine to add."}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (BILL DETAILS) */}
        <div className="space-y-6 rounded-2xl border-2 border-gray-800 bg-white p-6 shadow-sm lg:col-span-8">
          <div className="rounded-xl border-2 border-gray-800 bg-gray-50 p-3">
            <span className="text-xs font-bold uppercase text-gray-500">Patient Name</span>
            <p className="text-lg font-bold text-gray-800">
              {selectedPatient ? selectedPatient.name : "Select a patient"}
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border-2 border-gray-800">
            <div className="grid grid-cols-12 border-b-2 border-gray-800 bg-gray-100 p-3 text-xs font-bold uppercase text-gray-700">
              <div className="col-span-3">Medicine Name</div>
              <div className="col-span-2 text-center">Unit Type</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-center">Price</div>
              <div className="col-span-1 text-center">Discount</div>
              <div className="col-span-2 text-right">Total Price</div>
            </div>

            <div className="divide-y-2 divide-gray-200">
              {billItems.length === 0 ? (
                <div className="p-6 text-center text-sm font-semibold text-gray-400">
                  No medicines added to bill yet.
                </div>
              ) : (
                billItems.map((item) => {
                  const itemTotal = Math.max(0, item.price * item.quantity - item.discount);
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 items-center p-3 text-sm font-semibold"
                    >
                      <div className="col-span-3 flex items-center justify-between pr-2 text-gray-800">
                        <div>
                          <span>{item.name}</span>
                          {item.expiryDate && (
                            <span className="block text-[10px] text-gray-500">
                              Exp: {new Date(item.expiryDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-xs font-bold text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="col-span-2 px-1">
                        <select
                          value={item.type}
                          onChange={(e) =>
                            handleUpdateItemType(item.id, e.target.value as UnitType)
                          }
                          className="w-full rounded-lg border-2 border-gray-800 bg-white p-1 text-center text-xs font-bold focus:outline-none"
                        >
                          <option value="BOX">BOX</option>
                          <option value="STRIP">STRIP</option>
                          <option value="TABLET">TABLET</option>
                        </select>
                      </div>

                      <div className="col-span-2 px-1">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "quantity",
                              Math.max(1, parseInt(e.target.value, 10) || 1)
                            )
                          }
                          className="w-full rounded-lg border-2 border-gray-800 p-1 text-center font-medium focus:outline-none"
                        />
                      </div>

                      <div className="col-span-2 px-1">
                        <input
                          type="number"
                          min="0"
                          value={item.price}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "price",
                              Math.max(0, parseFloat(e.target.value) || 0)
                            )
                          }
                          className="w-full rounded-lg border-2 border-gray-800 p-1 text-center font-medium focus:outline-none"
                        />
                      </div>

                      <div className="col-span-1 px-1">
                        <input
                          type="number"
                          min="0"
                          value={item.discount}
                          onChange={(e) =>
                            handleUpdateItem(
                              item.id,
                              "discount",
                              Math.max(0, parseFloat(e.target.value) || 0)
                            )
                          }
                          className="w-full rounded-lg border-2 border-gray-800 p-1 text-center font-medium focus:outline-none"
                        />
                      </div>

                      <div className="col-span-2 text-right font-bold text-gray-900">
                        {formatCurrency(itemTotal)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {(["cash", "upi", "card"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-xl border-2 border-gray-800 px-6 py-2 text-sm font-bold uppercase transition ${
                    paymentMethod === method
                      ? "bg-gray-800 text-white"
                      : "bg-white text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold uppercase text-gray-700">Total</span>
              <div className="rounded-xl border-2 border-gray-800 bg-gray-50 px-5 py-2 font-bold text-gray-900">
                {formatCurrency(netPrice)}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end justify-between gap-4 border-t-2 border-gray-200 pt-4 md:flex-row">
            <div className="grid w-full grid-cols-3 gap-3 md:w-auto">
              <div className="rounded-xl border-2 border-gray-800 bg-gray-50 p-3 text-center">
                <span className="block text-xs font-bold uppercase text-gray-500">Net Price</span>
                <span className="text-lg font-bold text-green-600">
                  {formatCurrency(netPrice)}
                </span>
              </div>

              <div className="rounded-xl border-2 border-gray-800 bg-gray-50 p-3 text-center">
                <span className="block text-xs font-bold uppercase text-gray-500">Gross Price</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(grossPrice)}
                </span>
              </div>

              <div className="rounded-xl border-2 border-gray-800 bg-gray-50 p-3 text-center">
                <span className="block text-xs font-bold uppercase text-gray-500">Discount</span>
                <span className="text-lg font-bold text-red-600">
                  -{formatCurrency(totalDiscount)}
                </span>
              </div>
            </div>

            <div className="flex w-full min-w-[140px] flex-col gap-2 md:w-auto">
              <button
                type="button"
                onClick={() => setConfirmAction("pay")}
                disabled={billItems.length === 0 || isSubmitting}
                className="w-full rounded-xl border-2 border-gray-800 bg-gray-800 py-2.5 font-bold uppercase text-white transition hover:bg-gray-900 disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Pay"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction("draft")}
                disabled={billItems.length === 0 || isSubmitting}
                className="w-full rounded-xl border-2 border-gray-800 bg-white py-2 font-bold uppercase text-gray-800 transition hover:bg-gray-100 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Draft"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM DUE NAVIGATION */}
      <div className="flex justify-end pt-4">
        <Link
          href="/billing/due"
          className="inline-block rounded-xl border-2 border-gray-800 bg-white px-10 py-2.5 text-center font-bold uppercase text-gray-800 shadow-sm transition hover:bg-gray-100"
        >
          Due
        </Link>
      </div>

      {/* CONFIRMATION MODAL */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border-2 border-gray-800 bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-bold uppercase tracking-wide text-gray-900">
              Confirm Action
            </h2>
            <p className="mt-2 text-sm font-medium text-gray-600">
              Are you sure you want to{" "}
              {confirmAction === "pay" ? "process payment for" : "save as draft for"}{" "}
              <span className="font-bold text-gray-800">
                {selectedPatient?.name || "Guest Patient"}
              </span>{" "}
              with net total of{" "}
              <span className="font-bold text-gray-900">{formatCurrency(netPrice)}</span>?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={isSubmitting}
                className="rounded-xl border-2 border-gray-800 bg-white px-5 py-2 font-bold uppercase text-gray-800 transition hover:bg-gray-100 disabled:opacity-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className="rounded-xl border-2 border-gray-800 bg-gray-800 px-6 py-2 font-bold uppercase text-white transition hover:bg-gray-900 disabled:opacity-50"
              >
                {isSubmitting ? "Processing..." : "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}