"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getMedicines(
  query?: string,
  filter?: "ALL" | "LOW_STOCK" | "EXPIRED"
) {
  try {
    const today = new Date();

    const whereClause: any = {};

    // Search filter (SQLite contains search)
    if (query && query.trim() !== "") {
      const searchTerm = query.trim();
      whereClause.OR = [
        { name: { contains: searchTerm } },
        { company: { contains: searchTerm } },
      ];
    }

    // Category / Status Filter for EXPIRED at database level
    if (filter === "EXPIRED") {
      whereClause.batches = {
        some: {
          expiryDate: { lte: today },
        },
      };
    }

    let medicines = await prisma.medicine.findMany({
      where: whereClause,
      include: {
        batches: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // In-memory filter for LOW_STOCK (Prisma where doesn't support direct column-to-column comparison)
    if (filter === "LOW_STOCK") {
      medicines = medicines.filter(
        (med) => med.noOfBoxes <= med.lowStockThreshold
      );
    }

    return { success: true, data: medicines };
  } catch (error: any) {
    console.error("Error fetching medicines:", error);
    return { success: false, error: "Failed to fetch medicines." };
  }
}

export async function deleteMedicine(id: string) {
  try {
    await prisma.medicine.delete({
      where: { id },
    });

    revalidatePath("/add-medicine");
    revalidatePath("/medicine-store");

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting medicine:", error);
    return { success: false, error: "Failed to delete medicine." };
  }
}