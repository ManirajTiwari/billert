"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface PatientInvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

export interface PatientInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  items: PatientInvoiceItem[];
  totalPrice: number;
  billedAmount: number;
  discountAmount: number;
  paidAmount: number;
  paymentMethod?: string;
  isCancelled: boolean;
  cancelRemark?: string;
}

export interface DetailedPatient {
  id: string;
  ptid: string;
  name: string;
  age: number;
  gender: string;
  phoneNumber: string;
  invoices: PatientInvoice[];
}

export interface ActionResponse<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Fetch patient details along with all associated bills/invoices.
 */
export async function getPatientDetails(
  patientId: string
): Promise<ActionResponse<DetailedPatient>> {
  try {
    if (!patientId || typeof patientId !== "string") {
      return { success: false, error: "A valid Patient ID is required." };
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        bills: {
          include: {
            items: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!patient) {
      return { success: false, error: "Patient record not found." };
    }

    const formattedInvoices: PatientInvoice[] = (patient.bills || []).map((bill) => {
      const formattedDate = bill.createdAt
        ? new Date(bill.createdAt)
            .toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
            .toUpperCase()
        : "N/A";

      const isCancelled = bill.paymentMethod?.startsWith("CANCELLED") ?? false;
      let cancelRemark = "";
      if (isCancelled && bill.paymentMethod) {
        cancelRemark = bill.paymentMethod.replace(/^CANCELLED:\s*/, "");
      }

      const gross = Number(bill.grossPrice ?? 0);
      const net = Number(bill.netPrice ?? 0);
      
      // Derive discount from gross and net, or fall back to any custom discount property
      const discount = Number(
        (bill as any).discount ?? (gross > net ? gross - net : 0)
      );

      const billedAmount = gross > 0 ? gross : net + discount;
      const paidAmount = net;

      return {
        id: bill.id,
        invoiceNumber: `INV-${bill.id.slice(-6).toUpperCase()}`,
        date: formattedDate,
        totalPrice: paidAmount,
        billedAmount,
        discountAmount: discount,
        paidAmount,
        paymentMethod: bill.paymentMethod,
        isCancelled,
        cancelRemark,
        items: (bill.items || []).map((item) => ({
          name: item.name,
          quantity: Number(item.quantity ?? 0),
          price: Number(item.price ?? 0),
        })),
      };
    });

    const detailedPatient: DetailedPatient = {
      id: patient.id,
      ptid: patient.ptid || `PT-${patient.id.slice(-4).toUpperCase()}`,
      name: patient.name,
      age: patient.age,
      gender: patient.gender,
      phoneNumber: patient.phoneNumber || "",
      invoices: formattedInvoices,
    };

    return { success: true, data: detailedPatient };
  } catch (error: any) {
    console.error("Error fetching patient details:", error);
    return {
      success: false,
      error: error.message || "Failed to load patient record.",
    };
  }
}

/**
 * Cancel an invoice by saving the cancellation status and remark on the record.
 */
export async function cancelInvoice(
  invoiceId: string,
  patientId: string,
  remark: string
): Promise<ActionResponse> {
  try {
    if (!invoiceId) {
      return { success: false, error: "Invoice ID is required." };
    }

    if (!remark || !remark.trim()) {
      return { success: false, error: "Cancellation remark is required." };
    }

    await prisma.bill.update({
      where: { id: invoiceId },
      data: {
        paymentMethod: `CANCELLED: ${remark.trim()}`,
      },
    });

    if (patientId) {
      revalidatePath(`/add-patient/about_patient`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error cancelling invoice:", error);
    return {
      success: false,
      error: error.message || "Failed to cancel invoice.",
    };
  }
}

/**
 * Delete a specific bill / invoice by ID inside an atomic transaction.
 */
export async function deleteInvoice(
  invoiceId: string,
  patientId: string
): Promise<ActionResponse> {
  try {
    if (!invoiceId) {
      return { success: false, error: "Invoice ID is required." };
    }

    await prisma.$transaction([
      prisma.billItem.deleteMany({
        where: { billId: invoiceId },
      }),
      prisma.bill.delete({
        where: { id: invoiceId },
      }),
    ]);

    if (patientId) {
      revalidatePath(`/add-patient/about_patient`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting invoice:", error);
    return {
      success: false,
      error: error.message || "Failed to delete invoice.",
    };
  }
}