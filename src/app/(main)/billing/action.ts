"use server";

import prisma from "@/lib/prisma";
import { calculateMedicineStock, UnitType } from "./calculation";

export interface FoundPatient {
  id: string;
  name: string;
  phoneNumber: string;
}

export interface FoundMedicine {
  id: string;
  name: string;
  company: string;
  type: string;
  noOfBoxes: number;
  stripsPerBox: number;
  tabletsPerBox: number;
  priceOfBox: number;
  priceOfStrip: number;
  priceOfTablet: number;
  batches: {
    batchNumber: string;
    expiryDate: Date | string;
  }[];
}

export interface BillItemPayload {
  medicineId: string;
  name: string;
  type: string;
  quantity: number;
  price: number;
  discount: number;
  expiryDate?: string;
  batchNumber?: string;
}

export interface SaveBillPayload {
  patientId?: string;
  patientName: string;
  grossPrice: number;
  totalDiscount: number;
  netPrice: number;
  paymentMethod: string;
  items: BillItemPayload[];
}

/**
 * Search patients by name or phone
 */
export async function searchPatients(query: string): Promise<FoundPatient[]> {
  if (!query || query.trim().length < 1) return [];
  try {
    return await prisma.patient.findMany({
      where: {
        OR: [
          { name: { contains: query.trim() } },
          { phoneNumber: { contains: query.trim() } },
        ],
      },
      take: 5,
      select: { id: true, name: true, phoneNumber: true },
    });
  } catch (error) {
    console.error("Error searching patients:", error);
    return [];
  }
}

/**
 * Search medicines by name or company (including stock attributes)
 */
export async function searchMedicines(query: string): Promise<FoundMedicine[]> {
  if (!query || query.trim().length < 1) return [];
  try {
    return await prisma.medicine.findMany({
      where: {
        OR: [
          { name: { contains: query.trim() } },
          { company: { contains: query.trim() } },
        ],
      },
      include: {
        batches: {
          select: { batchNumber: true, expiryDate: true },
        },
      },
      take: 5,
    });
  } catch (error) {
    console.error("Error searching medicines:", error);
    return [];
  }
}

/**
 * Save paid bill into the Bill table and update Medicine inventory
 */
export async function processPayment(payload: SaveBillPayload) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Validate and deduct stock for each medicine in the bill
      for (const item of payload.items) {
        if (!item.medicineId) continue;

        const medicine = await tx.medicine.findUnique({
          where: { id: item.medicineId },
        });

        if (!medicine) {
          throw new Error(`Medicine "${item.name}" not found.`);
        }

        // Calculate new stock level using calculation module
        const stockCalculation = calculateMedicineStock(
          {
            noOfBoxes: medicine.noOfBoxes,
            stripsPerBox: medicine.stripsPerBox,
            tabletsPerBox: medicine.tabletsPerBox,
          },
          item.quantity,
          item.type as UnitType
        );

        if (!stockCalculation.hasEnoughStock) {
          throw new Error(
            `Insufficient stock for "${item.name}". Requested: ${stockCalculation.requestedInTablets} tablets, Available: ${stockCalculation.totalStockInTablets} tablets.`
          );
        }

        // Update medicine stock in database
        await tx.medicine.update({
          where: { id: item.medicineId },
          data: {
            noOfBoxes: stockCalculation.remainingBreakdown.boxes,
          },
        });
      }

      // 2. Create the Bill record
      const newBill = await tx.bill.create({
        data: {
          patientId: payload.patientId || undefined,
          patientName: payload.patientName,
          grossPrice: payload.grossPrice,
          totalDiscount: payload.totalDiscount,
          netPrice: payload.netPrice,
          paymentMethod: payload.paymentMethod,
          items: {
            create: payload.items.map((item) => ({
              medicineId: item.medicineId,
              name: item.name,
              unitType: item.type,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount,
              batchNumber: item.batchNumber || undefined,
              expiryDate: item.expiryDate || undefined,
            })),
          },
        },
      });

      return { success: true, billId: newBill.id };
    });
  } catch (error: any) {
    console.error("Error saving paid bill:", error);
    return {
      success: false,
      error: error.message || "Failed to process payment.",
    };
  }
}

/**
 * Save draft bill into the DraftBill table (Without deducting stock)
 */
export async function saveDraftBill(payload: SaveBillPayload) {
  try {
    const draft = await prisma.draftBill.create({
      data: {
        patientId: payload.patientId || undefined,
        patientName: payload.patientName,
        grossPrice: payload.grossPrice,
        totalDiscount: payload.totalDiscount,
        netPrice: payload.netPrice,
        paymentMethod: payload.paymentMethod,
        items: {
          create: payload.items.map((item) => ({
            medicineId: item.medicineId,
            name: item.name,
            unitType: item.type,
            quantity: item.quantity,
            price: item.price,
            discount: item.discount,
            batchNumber: item.batchNumber || undefined,
            expiryDate: item.expiryDate || undefined,
          })),
        },
      },
    });

    return { success: true, draftId: draft.id };
  } catch (error: any) {
    console.error("Error saving draft bill:", error);
    return { success: false, error: error.message || "Failed to save draft." };
  }
}