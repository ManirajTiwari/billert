"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface TransactionItem {
  id: string | number;
  name: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  unitType?: string;
  price: number;
  discount?: number;
}

export interface Transaction {
  id: string;
  patientName: string;
  ptid: string;
  paidAmount: number;
  payerType: "UPI" | "Cash" | "Card";
  date: string;
  items?: TransactionItem[]; // Added line items array
}

export interface FetchAccountFilters {
  fromDate?: string;
  toDate?: string;
  userId?: string;
  showCancelled?: boolean;
}

export interface UserProfileData {
  id?: string;
  email?: string;
  name?: string;
  pharmacyName?: string;
  phoneNumber?: string;
  secondaryPhone?: string;
  address?: string;
  currencyName?: string;
  currencySymbol?: string;
  logoUrl?: string;
  subscriptionActive?: boolean;
}

/**
 * Type helper for Bill query result including patient and items relations
 */
type BillWithDetails = Prisma.BillGetPayload<{
  include: {
    patient: {
      select: {
        ptid: true;
      };
    };
    items: true; // Adjust this to `billItems: true` if named differently in your schema.prisma
  };
}>;

export async function getUserProfileData(userId?: string): Promise<UserProfileData | null> {
  try {
    const user = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findFirst();

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      pharmacyName: user.pharmacyName ?? undefined,
      phoneNumber: user.phoneNumber ?? undefined,
      secondaryPhone: user.secondaryPhone ?? undefined,
      address: user.address ?? undefined,
      currencyName: user.currencyName ?? "US Dollar",
      currencySymbol: user.currencySymbol ?? "$",
      logoUrl: user.logoUrl ?? undefined,
      subscriptionActive: user.subscriptionActive,
    };
  } catch (error) {
    console.error("Error fetching user profile data:", error);
    return null;
  }
}

export async function getAccountTransactions(
  filters: FetchAccountFilters = {}
): Promise<Transaction[]> {
  const { fromDate, toDate, showCancelled = false } = filters;

  try {
    const whereCondition: Prisma.BillWhereInput = showCancelled
      ? {
          OR: [
            { isCancelled: true },
            {
              paymentMethod: {
                startsWith: "CANCELLED",
              },
            },
          ],
        }
      : {
          isCancelled: false,
          NOT: {
            paymentMethod: {
              startsWith: "CANCELLED",
            },
          },
        };

    if (fromDate || toDate) {
      whereCondition.createdAt = {};

      if (fromDate) {
        const startDate = new Date(fromDate);
        startDate.setHours(0, 0, 0, 0);
        whereCondition.createdAt.gte = startDate;
      }

      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        whereCondition.createdAt.lte = endDate;
      }
    }

    const bills = (await prisma.bill.findMany({
      where: whereCondition,
      include: {
        patient: {
          select: {
            ptid: true,
          },
        },
        items: true, // Fetch line items from DB
      },
      orderBy: {
        createdAt: "desc",
      },
    })) as BillWithDetails[];

    const normalizePayerType = (method?: string | null): "UPI" | "Cash" | "Card" => {
      if (!method) return "Cash";
      const lower = method.toLowerCase().trim();
      if (lower.includes("upi")) return "UPI";
      if (lower.includes("card")) return "Card";
      return "Cash";
    };

    return bills.map((bill) => {
      const rawPtid = bill.patient?.ptid || bill.patientId || bill.id;
      const formattedPtid =
        rawPtid.length > 12 ? `PT-${rawPtid.slice(-6).toUpperCase()}` : rawPtid;

      return {
        id: bill.id,
        patientName: bill.patientName || "Walk-in Patient",
        ptid: formattedPtid,
        paidAmount: bill.netPrice ?? 0,
        payerType: normalizePayerType(bill.paymentMethod),
        date: new Date(bill.createdAt).toISOString().split("T")[0],
        items: bill.items?.map((item: any) => ({
          id: item.id,
          name: item.name || item.medicineName || item.particular || "Medicine",
          batchNumber: item.batchNumber || "-",
          expiryDate: item.expiryDate
            ? new Date(item.expiryDate).toISOString().split("T")[0]
            : "-",
          quantity: item.quantity ?? item.unit ?? 1,
          unitType: item.unitType || "",
          price: item.price ?? item.rate ?? 0,
          discount: item.discount ?? 0,
        })),
      };
    });
  } catch (error) {
    console.error("Error fetching account transactions:", error);
    return [];
  }
}