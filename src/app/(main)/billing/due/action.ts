"use server";

import prisma from "@/lib/prisma";

export interface DueRecord {
  id: string;
  ptid: string;
  name: string;
  phone: string;
  dueAmount: number;
  dueDate: string;
}

export interface FetchDraftsFilter {
  fromDate?: string;
  toDate?: string;
  searchQuery?: string;
}

/**
 * Fetch draft bills filtered by date range and search query
 */
export async function getDraftBills(filters: FetchDraftsFilter = {}): Promise<DueRecord[]> {
  const { fromDate, toDate, searchQuery } = filters;

  try {
    const whereCondition: any = {};

    if (fromDate || toDate) {
      whereCondition.createdAt = {};
      if (fromDate) whereCondition.createdAt.gte = new Date(fromDate);
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        whereCondition.createdAt.lte = endDate;
      }
    }

    if (searchQuery && searchQuery.trim().length > 0) {
      const query = searchQuery.trim();
      whereCondition.OR = [
        { patientName: { contains: query } },
        { patientId: { contains: query } },
      ];
    }

    const draftBills = await prisma.draftBill.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
    });

    const patientIds = draftBills
      .map((d) => d.patientId)
      .filter((id): id is string => Boolean(id));

    const patientsMap = new Map<string, string>();
    if (patientIds.length > 0) {
      const patients = await prisma.patient.findMany({
        where: { id: { in: patientIds } },
        select: { id: true, phoneNumber: true },
      });
      patients.forEach((p) => patientsMap.set(p.id, p.phoneNumber));
    }

    return draftBills.map((draft) => ({
      id: draft.id,
      ptid: draft.patientId || "N/A",
      name: draft.patientName || "Walk-in Patient",
      phone: draft.patientId ? patientsMap.get(draft.patientId) || "N/A" : "N/A",
      dueAmount: draft.netPrice,
      dueDate: new Date(draft.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    }));
  } catch (error) {
    console.error("Error fetching draft bills:", error);
    return [];
  }
}

/**
 * Convert a DraftBill into a Paid Bill and remove the draft
 */
export async function payDraftBill(draftId: string) {
  try {
    const draft = await prisma.draftBill.findUnique({
      where: { id: draftId },
      include: { items: true },
    });

    if (!draft) {
      return { success: false, error: "Draft bill not found." };
    }

    const newBill = await prisma.$transaction(async (tx) => {
      // 1. Create paid Bill entry
      const bill = await tx.bill.create({
        data: {
          patientId: draft.patientId,
          patientName: draft.patientName,
          grossPrice: draft.grossPrice,
          totalDiscount: draft.totalDiscount,
          netPrice: draft.netPrice,
          paymentMethod: draft.paymentMethod || "cash",
          items: {
            create: draft.items.map((item) => ({
              medicineId: item.medicineId,
              name: item.name,
              unitType: item.unitType,
              quantity: item.quantity,
              price: item.price,
              discount: item.discount,
              expiryDate: item.expiryDate,
            })),
          },
        },
      });

      // 2. Delete converted draft bill
      await tx.draftBill.delete({
        where: { id: draftId },
      });

      return bill;
    });

    return { success: true, billId: newBill.id };
  } catch (error) {
    console.error("Error processing draft payment:", error);
    return { success: false, error: "Failed to process payment." };
  }
}