"use client";

import React from "react";
import { UserProfileData } from "@/types/auth";

export interface InvoiceItem {
  id?: string | number;
  name?: string; // Medicine name
  particular?: string; // Fallback alias
  unitType?: string; // BOX, STRIP, TABLET
  quantity?: number; // Quantity sold
  unit?: number; // Fallback alias
  price?: number; // Price per item/unit
  rate?: number; // Fallback alias
  discount?: number; // Line item discount
  batchNumber?: string;
  expiryDate?: string;
}

export interface BillInvoiceProps {
  userProfile?: UserProfileData;
  pharmacyName?: string;
  phoneNumbers?: string;
  address?: string;
  logoUrl?: string;
  currencySymbol?: string;

  patientName?: string;
  ptid?: string;
  ageGender?: string;
  phoneNumber?: string;

  billNumber?: string;
  billDate?: string;

  items?: InvoiceItem[];

  billedAmount?: number;
  discountAmount?: number;
  paidAmount?: number;
  amountInWords?: string;
}

// Safe conversion helper for numbers
const safeNum = (val: unknown): number => {
  const parsed = Number(val);
  return Number.isNaN(parsed) ? 0 : parsed;
};

// Safe wrapper for currency formatting
const formatCurrency = (val: unknown, decimals: number = 2): string => {
  return safeNum(val).toFixed(decimals);
};

export default function BillInvoice({
  userProfile,
  pharmacyName = userProfile?.pharmacyName || "PHARMACY NAME",
  phoneNumbers = [userProfile?.phoneNumber, userProfile?.secondaryPhone].filter(Boolean).join(" | ") || "+91 9876543210",
  address = userProfile?.address || "123 HEALTHCARE AVENUE, MEDICAL DISTRICT",
  logoUrl = userProfile?.logoUrl,
  currencySymbol = userProfile?.currencySymbol || "₹",

  patientName = "JOHN DOE",
  ptid = "PT-839210",
  ageGender = "28 / M",
  phoneNumber = "",
  billNumber = "INV-2026-0089",
  billDate = new Date().toISOString().split("T")[0],
  items = [],
  billedAmount,
  discountAmount,
  paidAmount,
  amountInWords = "THREE HUNDRED ONLY",
}: BillInvoiceProps) {

  // Item extraction helper with legacy property fallbacks
  const getItemDetails = (item: InvoiceItem) => {
    const name = item?.name || item?.particular || "UNNAMED ITEM";
    const quantity = safeNum(item?.quantity ?? item?.unit ?? 0);
    const price = safeNum(item?.price ?? item?.rate ?? 0);
    const discount = safeNum(item?.discount);
    return { name, quantity, price, discount };
  };

  // Safe item-level calculations
  const calculatedBilledAmount = items.reduce(
    (acc, item) => {
      const { quantity, price } = getItemDetails(item);
      return acc + quantity * price;
    },
    0
  );
  
  const calculatedDiscountAmount = items.reduce(
    (acc, item) => acc + safeNum(item?.discount),
    0
  );

  const finalBilledAmount = billedAmount !== undefined ? safeNum(billedAmount) : calculatedBilledAmount;
  const finalDiscountAmount = discountAmount !== undefined ? safeNum(discountAmount) : calculatedDiscountAmount;
  const totalPayableAmount = finalBilledAmount - finalDiscountAmount;
  const finalPaidAmount = paidAmount !== undefined ? safeNum(paidAmount) : totalPayableAmount;
  const netPayableAmount = Math.max(0, totalPayableAmount - finalPaidAmount);

  return (
    <>
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
        }
      `}</style>

      <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-4 sm:p-6 print:min-h-0 print:h-auto print:bg-white print:p-8 print:m-0 print:block">
        <div className="w-full max-w-[800px] bg-white p-6 sm:p-8 font-sans text-gray-900 print:w-full print:p-0 print:m-0">
          
          {/* Header Section */}
          <div className="relative flex items-center justify-center pb-4 mb-2 print:pt-0 print:pb-3">
            <div className="absolute left-0 top-0 flex items-center justify-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-gray-900"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-gray-900 flex items-center justify-center bg-white">
                  <span className="text-[10px] font-bold text-gray-900 tracking-wider">LOGO</span>
                </div>
              )}
            </div>

            <div className="text-center space-y-0.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-wider uppercase text-gray-900">
                {pharmacyName}
              </h1>
              {phoneNumbers && (
                <p className="text-xs font-bold tracking-wide text-gray-800 uppercase">
                  {phoneNumbers}
                </p>
              )}
              {address && (
                <p className="text-xs font-bold tracking-wide text-gray-700 uppercase">
                  {address}
                </p>
              )}
            </div>
          </div>

          {/* Main Card Container */}
          <div className="border-2 border-gray-900 rounded-2xl overflow-hidden">
            <div className="border-b-2 border-gray-900 bg-white py-1.5 text-center font-black tracking-widest uppercase text-sm text-gray-900">
              FINAL BILL
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 border-b-2 border-gray-900 text-xs font-bold divide-y sm:divide-y-0 sm:divide-x-2 divide-gray-900">
              <div className="p-3 space-y-1.5">
                <div className="flex">
                  <span className="w-32 uppercase text-gray-900">NAME :</span>
                  <span>{patientName}</span>
                </div>
                <div className="flex">
                  <span className="w-32 uppercase text-gray-900">PTID :</span>
                  <span>{ptid}</span>
                </div>
                <div className="flex">
                  <span className="w-32 uppercase text-gray-900">AGE/GENDER :</span>
                  <span>{ageGender}</span>
                </div>
                {phoneNumber && (
                  <div className="flex">
                    <span className="w-32 uppercase text-gray-900">PHONE NUMBER :</span>
                    <span>{phoneNumber}</span>
                  </div>
                )}
              </div>

              <div className="p-3 space-y-1.5">
                <div className="flex">
                  <span className="w-32 uppercase text-gray-900">BILL NUMBER :</span>
                  <span>{billNumber}</span>
                </div>
                <div className="flex">
                  <span className="w-32 uppercase text-gray-900">BILL DATE :</span>
                  <span>{billDate}</span>
                </div>
              </div>
            </div>

            {/* Particulars Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-900 font-bold uppercase text-gray-900 text-center">
                    <th className="py-2 px-2 border-r-2 border-gray-900 w-10">NO.</th>
                    <th className="py-2 px-3 border-r-2 border-gray-900 text-left">MEDICINE NAME</th>
                    <th className="py-2 px-2 border-r-2 border-gray-900 w-20">BATCH</th>
                    <th className="py-2 px-2 border-r-2 border-gray-900 w-20">EXPIRY</th>
                    <th className="py-2 px-2 border-r-2 border-gray-900 w-20">QTY / TYPE</th>
                    <th className="py-2 px-2 border-r-2 border-gray-900 w-20 text-right">RATE</th>
                    <th className="py-2 px-2 border-r-2 border-gray-900 w-16 text-right">DISC.</th>
                    <th className="py-2 px-3 w-24 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-b-2 border-gray-900">
                  {items.map((item, idx) => {
                    const { name, quantity, price, discount } = getItemDetails(item);
                    const itemTotal = quantity * price - discount;

                    const formattedExpiry = item?.expiryDate 
                      ? String(item.expiryDate).split("T")[0] 
                      : "-";

                    return (
                      <tr
                        key={item?.id ?? idx}
                        className="font-bold uppercase text-center text-gray-900"
                      >
                        <td className="py-2 px-2 border-r-2 border-gray-900">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 border-r-2 border-gray-900 text-left">
                          {name}
                        </td>
                        <td className="py-2 px-2 border-r-2 border-gray-900 text-center">
                          {item?.batchNumber || "-"}
                        </td>
                        <td className="py-2 px-2 border-r-2 border-gray-900 text-center">
                          {formattedExpiry}
                        </td>
                        <td className="py-2 px-2 border-r-2 border-gray-900">
                          {quantity} {item?.unitType || ""}
                        </td>
                        <td className="py-2 px-2 border-r-2 border-gray-900 text-right">
                          {formatCurrency(price)}
                        </td>
                        <td className="py-2 px-2 border-r-2 border-gray-900 text-right">
                          {formatCurrency(discount)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {formatCurrency(itemTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-bold text-xs uppercase text-gray-900">
                    <td
                      colSpan={7}
                      className="py-2 px-4 text-left border-r-2 border-gray-900 font-bold"
                    >
                      TOTAL AMOUNT
                    </td>
                    <td className="py-2 px-3 text-right font-bold">
                      {formatCurrency(finalBilledAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer Section */}
          <div className="mt-12 sm:mt-16 flex items-end justify-between text-xs font-bold uppercase text-gray-900">
            <div className="max-w-[50%]">
              <p className="tracking-wide font-black">{amountInWords}</p>
            </div>

            <div className="text-center space-y-10">
              <p className="font-black">FOR, {pharmacyName}</p>
              <div className="border-t border-gray-900 pt-1 tracking-wider text-[11px] font-black">
                AUTHORIZED SIGNATORY
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}