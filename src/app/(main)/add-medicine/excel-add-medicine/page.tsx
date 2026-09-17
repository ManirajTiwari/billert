"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { bulkUploadMedicinesAction, ExcelMedicineRow, BatchInput } from "./action";

// Helper function to extract batch index from column header names
function getBatchIndex(key: string): string {
  // Remove format hints like "(YYYY-MM-DD)"
  const cleaned = key.replace(/\(.*?\)/g, "").trim();

  // Handle auto-suffixed duplicate column headers from XLSX library (e.g., "Batch Number_1")
  const duplicateMatch = cleaned.match(/_(\d+)$/);
  if (duplicateMatch) {
    return String(Number(duplicateMatch[1]) + 1);
  }

  // Handle explicitly numbered columns (e.g., "Batch Number 2", "Expiry Date 2")
  const numberMatch = cleaned.match(/\d+/);
  if (numberMatch) {
    return numberMatch[0];
  }

  return "1"; // Default to batch 1
}

// Dynamic parser function to extract multiple batches per row
function extractBatchesFromRow(row: Record<string, any>): BatchInput[] {
  const batchesMap: { [index: string]: Partial<BatchInput> } = {};

  Object.keys(row).forEach((key) => {
    const val = row[key];
    if (val === undefined || val === null || String(val).trim() === "") return;

    const cleanedKey = key.replace(/\(.*?\)/g, "").toLowerCase().trim();

    const isBatchNumber =
      cleanedKey.includes("batch") &&
      (cleanedKey.includes("number") ||
        cleanedKey.includes("no") ||
        cleanedKey.includes("num"));
    const isBatchUnit =
      cleanedKey.includes("batch") && cleanedKey.includes("unit");
    const isBatchQty =
      cleanedKey.includes("batch") &&
      (cleanedKey.includes("quantity") || cleanedKey.includes("qty"));
    const isExpiry =
      cleanedKey.includes("expiry") || cleanedKey.includes("exp");

    if (isBatchNumber || isBatchUnit || isBatchQty || isExpiry) {
      const index = getBatchIndex(key);

      if (!batchesMap[index]) {
        batchesMap[index] = {
          batchNumber: "",
          batchUnitType: "Box",
          batchQuantity: 0,
          expiryDate: "",
        };
      }

      if (isBatchNumber) batchesMap[index].batchNumber = String(val).trim();
      if (isBatchUnit) batchesMap[index].batchUnitType = String(val).trim();
      if (isBatchQty) batchesMap[index].batchQuantity = Number(val) || 0;
      if (isExpiry) batchesMap[index].expiryDate = String(val).trim();
    }
  });

  return Object.values(batchesMap).filter(
    (b): b is BatchInput => Boolean(b.batchNumber && b.expiryDate)
  );
}

export default function ExcelAddMedicinePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(
    null
  );

  // 1. Generate & Download Sample Template (Demonstrating multiple batch support)
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Medicine Name": "Paracetamol 500mg",
        Company: "Apex Pharma",
        Type: "Tablet",
        "No of Box": 10,
        "Strip in One Box": 10,
        "Tablet in One Box": 100,
        "Price of Box": 500,
        "Price of One Strip": 50,
        "Price of One Tablet": 5,
        "Low Stock Threshold": 2,
        "Low Stock Unit": "Box",
        "Batch Number 1": "B12345",
        "Batch Unit Type 1": "Box",
        "Batch Quantity 1": 5,
        "Expiry Date 1 (YYYY-MM-DD)": "2027-12-31",
        "Batch Number 2": "B12346",
        "Batch Unit Type 2": "Box",
        "Batch Quantity 2": 5,
        "Expiry Date 2 (YYYY-MM-DD)": "2028-06-30",
      },
      {
        "Medicine Name": "Amoxicillin 250mg",
        Company: "MedLife Care",
        Type: "Capsule",
        "No of Box": 5,
        "Strip in One Box": 5,
        "Tablet in One Box": 50,
        "Price of Box": 350,
        "Price of One Strip": 70,
        "Price of One Tablet": 7,
        "Low Stock Threshold": 1,
        "Low Stock Unit": "Box",
        "Batch Number 1": "B98765",
        "Batch Unit Type 1": "Box",
        "Batch Quantity 1": 5,
        "Expiry Date 1 (YYYY-MM-DD)": "2026-10-15",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Medicine Template");

    const maxCols = Object.keys(templateData[0]).map((key) => ({
      wch: Math.max(key.length + 3, 18),
    }));
    worksheet["!cols"] = maxCols;

    XLSX.writeFile(workbook, "Medicine_Import_Template.xlsx");
  };

  // 2. Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setMessage(null);
    }
  };

  // 3. Process Excel File & Submit
  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage({ text: "Please select an Excel file first.", isError: true });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

      if (rawJson.length === 0) {
        setMessage({
          text: "The selected Excel file contains no data.",
          isError: true,
        });
        setIsUploading(false);
        return;
      }

      // Map Excel column headers dynamically
      const formattedRows: ExcelMedicineRow[] = rawJson.map((row) => ({
        name: row["Medicine Name"] || row["name"] || row["Medicine"] || "",
        company: row["Company"] || row["company"] || "",
        type: row["Type"] || row["type"] || "Tablet",
        noOfBoxes: Number(row["No of Box"] || row["noOfBoxes"]) || 0,
        stripsPerBox: Number(row["Strip in One Box"] || row["stripsPerBox"]) || 0,
        tabletsPerBox:
          Number(row["Tablet in One Box"] || row["tabletsPerBox"]) || 0,
        priceOfBox: Number(row["Price of Box"] || row["priceOfBox"]) || 0,
        priceOfStrip:
          Number(row["Price of One Strip"] || row["priceOfStrip"]) || 0,
        priceOfTablet:
          Number(row["Price of One Tablet"] || row["priceOfTablet"]) || 0,
        lowStockThreshold:
          Number(row["Low Stock Threshold"] || row["lowStockThreshold"]) || 0,
        lowStockUnit: row["Low Stock Unit"] || row["lowStockUnit"] || "Box",
        // Dynamically extract all batches present in this row
        batches: extractBatchesFromRow(row),
      }));

      const response = await bulkUploadMedicinesAction(formattedRows);
      setIsUploading(false);

      if (response.success) {
        setMessage({
          text: `Successfully imported ${response.count} medicine(s)!`,
          isError: false,
        });
        setSelectedFile(null);
      } else {
        setMessage({
          text: response.error || "Failed to process the uploaded file.",
          isError: true,
        });
      }
    } catch (err: any) {
      console.error(err);
      setIsUploading(false);
      setMessage({
        text: "Invalid file format or error parsing Excel sheet.",
        isError: true,
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-2xl shadow-sm space-y-6">
      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
        Excel Add Medicine
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

      <div className="border border-zinc-300 dark:border-zinc-700 rounded-xl p-6 space-y-6 bg-zinc-50/50 dark:bg-zinc-800/30">
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 font-medium">
            Download the structured Excel template to fill in your medicine data:
          </p>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700 transition shadow-sm"
          >
            TEMPLATE DOWNLOAD
          </button>
        </div>

        <hr className="border-zinc-200 dark:border-zinc-800" />

        <div className="space-y-4">
          <p className="text-xs text-zinc-500 font-medium">
            Upload your filled `.xlsx` or `.xls` spreadsheet:
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <label className="cursor-pointer px-5 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-lg transition">
              Choose File
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            <span className="text-xs text-zinc-500 truncate max-w-xs">
              {selectedFile ? selectedFile.name : "No file chosen"}
            </span>
          </div>

          <div>
            <button
              type="button"
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition shadow-sm"
            >
              {isUploading ? "UPLOADING..." : "UPLOAD"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}