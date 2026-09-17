"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ConfirmationBillItem {
  medicineId: string;
  name: string;
  type: string;
  quantity: number;
  price: number;
  discount: number;
  expiryDate?: string;
  batchNumber?: string;
}

export interface ConfirmationBillPayload {
  patientId?: string;
  patientName: string;
  grossPrice: number;
  totalDiscount: number;
  netPrice: number;
  paymentMethod: string;
  items: ConfirmationBillItem[];
}

/**
 * Server action triggered upon modal confirmation to process payment and update stock
 */
export async function confirmAndProcessPayment(
  payload: ConfirmationBillPayload
): Promise<ActionResponse<{ billId: string }>> {
  try {
    const bill = await prisma.$transaction(async (tx) => {
      // 1. Verify stock availability and update inventory
      for (const item of payload.items) {
        if (!item.medicineId) continue;

        const medicine = await tx.medicine.findUnique({
          where: { id: item.medicineId },
        });

        if (!medicine) {
          throw new Error(`Medicine "${item.name}" was not found.`);
        }

        if (medicine.noOfBoxes < item.quantity && item.type === "BOX") {
          throw new Error(`Insufficient box stock for "${item.name}".`);
        }

        if (item.type === "BOX") {
          await tx.medicine.update({
            where: { id: item.medicineId },
            data: {
              noOfBoxes: Math.max(0, medicine.noOfBoxes - item.quantity),
            },
          });
        }
      }

      // 2. Create the confirmed Bill entry
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

      return newBill;
    });

    revalidatePath("/billing");
    return { success: true, data: { billId: bill.id } };
  } catch (error: any) {
    console.error("Error in confirmAndProcessPayment:", error);
    return {
      success: false,
      error: error.message || "Failed to process payment confirmation.",
    };
  }
}

/**
 * Server action triggered upon modal confirmation to save a draft bill
 */
export async function confirmAndSaveDraft(
  payload: ConfirmationBillPayload
): Promise<ActionResponse<{ draftId: string }>> {
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

    revalidatePath("/billing");
    return { success: true, data: { draftId: draft.id } };
  } catch (error: any) {
    console.error("Error in confirmAndSaveDraft:", error);
    return {
      success: false,
      error: error.message || "Failed to save draft bill.",
    };
  }
}