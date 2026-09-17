"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function cancelInvoice(invoiceId: string, remark: string) {
  try {
    if (!invoiceId) {
      return { success: false, error: "Invoice ID is required." };
    }

    if (!remark || !remark.trim()) {
      return {
        success: false,
        error: "Please enter a reason/remark for cancellation.",
      };
    }

    // Preserve record in DB and save cancellation status with reason
    const updatedBill = await prisma.bill.update({
      where: { id: invoiceId },
      data: {
        paymentMethod: `CANCELLED: ${remark.trim()}`,
      },
    });

    revalidatePath("/add-patient/about_patient");

    return { success: true, data: updatedBill };
  } catch (error: any) {
    console.error("Error cancelling invoice:", error);
    return {
      success: false,
      error: error?.message || "Failed to cancel invoice.",
    };
  }
}