"use client";

import { useState, useEffect, useCallback } from "react";
import { getAccountTransactions, getUserProfileData, Transaction, UserProfileData } from "./action";
import BillInvoice from "../bill_invoice/page";

export default function AccountPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "UPI" | "Cash" | "Card">("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);

  const [selectedTxForPrint, setSelectedTxForPrint] = useState<Transaction | null>(null);

  // Fetch User Profile & Account Transactions based on showCancelled state
  const fetchData = useCallback(async () => {
    setLoading(true);
    const [txData, profileData] = await Promise.all([
      getAccountTransactions({ fromDate, toDate, showCancelled }),
      getUserProfileData(),
    ]);
    setTransactions(txData);
    if (profileData) setUserProfile(profileData);
    setLoading(false);
  }, [fromDate, toDate, showCancelled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchData]);

  const currencySymbol = userProfile?.currencySymbol || "₹";

  const totalUpi = transactions
    .filter((t) => t.payerType === "UPI")
    .reduce((sum, t) => sum + t.paidAmount, 0);

  const totalCash = transactions
    .filter((t) => t.payerType === "Cash")
    .reduce((sum, t) => sum + t.paidAmount, 0);

  const totalCard = transactions
    .filter((t) => t.payerType === "Card")
    .reduce((sum, t) => sum + t.paidAmount, 0);

  const grandTotal = transactions.reduce((sum, t) => sum + t.paidAmount, 0);

  const filteredTransactions = transactions.filter((t) => {
    return activeFilter === "ALL" || t.payerType.toLowerCase() === activeFilter.toLowerCase();
  });

  const handlePrintBill = (transaction: Transaction) => {
    setSelectedTxForPrint(transaction);
  };

  // CSV Download Handler
  const handleDownloadCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ["Patient Name", "PTID", `Paid Amount (${currencySymbol})`, "Payer Type", "Date"];
    const rows = filteredTransactions.map((tx) => [
      `"${tx.patientName.replace(/"/g, '""')}"`,
      `"${tx.ptid}"`,
      tx.paidAmount.toFixed(2),
      `"${tx.payerType}"`,
      `"${tx.date}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${showCancelled ? "cancelled" : "account"}_report_${fromDate || "all"}_to_${toDate || "present"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (selectedTxForPrint) {
      const timer = setTimeout(() => {
        window.print();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [selectedTxForPrint]);

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8 font-sans print:hidden">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 px-1">
              Account {showCancelled && <span className="text-red-600 text-xl font-semibold">(Cancelled Bills)</span>}
            </h1>

            {/* Toggle Cancelled Bills Button */}
            <button
              onClick={() => {
                setShowCancelled(!showCancelled);
                setActiveFilter("ALL");
              }}
              className={`rounded-2xl border-2 px-5 py-2 text-sm font-bold transition ${
                showCancelled
                  ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                  : "border-red-600 text-red-600 bg-white hover:bg-red-50"
              }`}
            >
              {showCancelled ? "Show Active Bills" : "Cancelled Bills"}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveFilter(activeFilter === "UPI" ? "ALL" : "UPI")}
                className={`rounded-2xl border-2 border-gray-900 px-5 py-2 text-sm font-bold transition ${
                  activeFilter === "UPI" ? "bg-gray-900 text-white" : "bg-white text-gray-900 hover:bg-gray-100"
                }`}
              >
                upi <span className="ml-1 text-xs font-normal">({currencySymbol}{totalUpi.toFixed(2)})</span>
              </button>

              <button
                onClick={() => setActiveFilter(activeFilter === "Cash" ? "ALL" : "Cash")}
                className={`rounded-2xl border-2 border-gray-900 px-5 py-2 text-sm font-bold transition ${
                  activeFilter === "Cash" ? "bg-gray-900 text-white" : "bg-white text-gray-900 hover:bg-gray-100"
                }`}
              >
                cash <span className="ml-1 text-xs font-normal">({currencySymbol}{totalCash.toFixed(2)})</span>
              </button>

              <button
                onClick={() => setActiveFilter(activeFilter === "Card" ? "ALL" : "Card")}
                className={`rounded-2xl border-2 border-gray-900 px-5 py-2 text-sm font-bold transition ${
                  activeFilter === "Card" ? "bg-gray-900 text-white" : "bg-white text-gray-900 hover:bg-gray-100"
                }`}
              >
                card <span className="ml-1 text-xs font-normal">({currencySymbol}{totalCard.toFixed(2)})</span>
              </button>

              <button
                onClick={() => setActiveFilter("ALL")}
                className={`rounded-2xl border-2 border-gray-900 px-7 py-2 text-sm font-bold transition ${
                  activeFilter === "ALL" ? "bg-gray-900 text-white" : "bg-white text-gray-900 hover:bg-gray-100"
                }`}
              >
                Total <span className="ml-1 text-xs font-normal">({currencySymbol}{grandTotal.toFixed(2)})</span>
              </button>
            </div>

            {/* Date Pickers & Download Button */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                aria-label="From date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-2xl border-2 border-gray-900 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none cursor-pointer"
              />
              <input
                type="date"
                aria-label="To date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-2xl border-2 border-gray-900 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none cursor-pointer"
              />
              <button
                onClick={handleDownloadCSV}
                disabled={filteredTransactions.length === 0}
                className="rounded-2xl border-2 border-gray-900 bg-white px-5 py-2 text-sm font-bold text-gray-900 hover:bg-gray-100 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                download
              </button>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-gray-900 bg-white p-4 md:p-6 shadow-xs">
            <div className="space-y-3">
              {loading ? (
                <div className="py-12 text-center text-sm font-semibold text-gray-500">
                  Loading transactions...
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="py-12 text-center text-sm font-semibold text-gray-500">
                  {showCancelled ? "No cancelled bills found." : "No matching transactions found."}
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`grid grid-cols-1 gap-2 rounded-2xl border-2 border-gray-900 p-3.5 sm:grid-cols-5 sm:items-center sm:gap-4 sm:px-6 ${
                      showCancelled ? "bg-red-50/50" : "bg-white"
                    }`}
                  >
                    <div className="font-semibold text-gray-900 truncate">
                      {tx.patientName}
                    </div>
                    <div className="font-semibold text-gray-700 sm:text-center truncate px-1" title={tx.ptid}>
                      {tx.ptid}
                    </div>
                    <div className="font-semibold text-gray-900 sm:text-center whitespace-nowrap">
                      {currencySymbol}{tx.paidAmount.toFixed(2)}
                    </div>
                    <div className="font-semibold text-gray-700 sm:text-center">
                      {tx.payerType}
                    </div>
                    <div className="sm:text-right">
                      <button
                        onClick={() => handlePrintBill(tx)}
                        className="w-full sm:w-auto rounded-full border-2 border-gray-900 bg-white px-4 py-1 text-xs font-bold uppercase text-gray-900 hover:bg-gray-100 transition active:scale-95"
                      >
                        print bill
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PRINT INVOICE MODAL / OVERLAY */}
      {selectedTxForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:static print:inset-auto print:block print:w-full print:p-0 print:m-0 print:bg-white print:z-auto">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-2 sm:p-4 print:max-h-none print:overflow-visible print:p-0 print:m-0 print:w-full print:border-none print:shadow-none print:block">
            
            {/* Modal Controls (Hidden in Print) */}
            <div className="flex items-center justify-between pb-3 px-4 border-b border-gray-200 print:hidden">
              <h3 className="text-lg font-bold text-gray-900">Invoice Preview</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-xl border-2 border-gray-900 bg-gray-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-gray-800 transition"
                >
                  Print
                </button>
                <button
                  onClick={() => setSelectedTxForPrint(null)}
                  className="rounded-xl border-2 border-gray-900 bg-white px-4 py-1.5 text-xs font-bold text-gray-900 hover:bg-gray-100 transition"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Bill Invoice Component */}
            <BillInvoice
              userProfile={userProfile || undefined}
              patientName={selectedTxForPrint.patientName}
              ptid={selectedTxForPrint.ptid}
              billNumber={`INV-${selectedTxForPrint.id.slice(-6).toUpperCase()}`}
              billDate={selectedTxForPrint.date}
              billedAmount={selectedTxForPrint.paidAmount}
              paidAmount={selectedTxForPrint.paidAmount}
              items={
                // If tx has item details, map them; otherwise use fallback item object
                (selectedTxForPrint as any).items?.length
                  ? (selectedTxForPrint as any).items.map((item: any) => ({
                      id: item.id,
                      name: item.name || item.medicineName || item.particular,
                      batchNumber: item.batchNumber,
                      expiryDate: item.expiryDate,
                      quantity: item.quantity ?? item.unit ?? 1,
                      unitType: item.unitType || "",
                      price: item.price ?? item.rate ?? 0,
                      discount: item.discount ?? 0,
                    }))
                  : [
                      {
                        id: 1,
                        name: "Consultation / Medical Service",
                        quantity: 1,
                        price: selectedTxForPrint.paidAmount,
                        discount: 0,
                      },
                    ]
              }
            />
          </div>
        </div>
      )}
    </>
  );
}