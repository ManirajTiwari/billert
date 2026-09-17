"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface BatchInput {
  batchNumber: string;
  batchUnitType?: string;
  batchQuantity?: number;
  expiryDate?: string;
}

export interface ExcelMedicineRow {
  name: string;
  company: string;
  type: string;
  noOfBoxes?: number;
  stripsPerBox?: number;
  tabletsPerBox?: number;
  priceOfBox?: number;
  priceOfStrip?: number;
  priceOfTablet?: number;
  lowStockThreshold?: number;
  lowStockUnit?: string;
  batches?: BatchInput[];
  // Legacy single-batch fields retained for backward compatibility
  batchNumber?: string;
  batchUnitType?: string;
  batchQuantity?: number;
  expiryDate?: string;
}

export async function bulkUploadMedicinesAction(
  rows: ExcelMedicineRow[],
  userId?: string
) {
  try {
    let createdCount = 0;

    for (const row of rows) {
      if (!row.name || !row.company) continue;

      // Determine batches from dynamic array or single fallback fields
      let batchesToCreate: BatchInput[] = row.batches || [];

      if (batchesToCreate.length === 0 && row.batchNumber && row.expiryDate) {
        batchesToCreate = [
          {
            batchNumber: row.batchNumber,
            batchUnitType: row.batchUnitType,
            batchQuantity: row.batchQuantity,
            expiryDate: row.expiryDate,
          },
        ];
      }

      // Filter out incomplete batches (must have batchNumber & expiryDate)
      const validBatches = batchesToCreate.filter(
        (b) => b.batchNumber && b.expiryDate
      );

      await prisma.medicine.create({
        data: {
          name: String(row.name),
          company: String(row.company),
          type: String(row.type || "Tablet"),
          noOfBoxes: Number(row.noOfBoxes) || 0,
          stripsPerBox: Number(row.stripsPerBox) || 0,
          tabletsPerBox: Number(row.tabletsPerBox) || 0,
          priceOfBox: Number(row.priceOfBox) || 0,
          priceOfStrip: Number(row.priceOfStrip) || 0,
          priceOfTablet: Number(row.priceOfTablet) || 0,
          lowStockThreshold: Number(row.lowStockThreshold) || 0,
          lowStockUnit: String(row.lowStockUnit || "Box"),
          userId: userId || null,
          ...(validBatches.length > 0 && {
            batches: {
              create: validBatches.map((b) => ({
                batchNumber: String(b.batchNumber),
                unitType: String(b.batchUnitType || "Box"),
                quantity: Number(b.batchQuantity) || 0,
                expiryDate: new Date(b.expiryDate!),
              })),
            },
          }),
        },
      });

      createdCount++;
    }

    revalidatePath("/add-medicine");
    return { success: true, count: createdCount };
  } catch (error: any) {
    console.error("Error bulk uploading medicines:", error);
    return {
      success: false,
      error: error.message || "Failed to import medicine data from Excel file.",
    };
  }
}