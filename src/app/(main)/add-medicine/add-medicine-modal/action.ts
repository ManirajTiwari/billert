"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface BatchItem {
  batchNumber: string;
  unitType: string;
  quantity: number;
  expiryDate: string;
}

// 1. Fetch single medicine by ID for editing
export async function getMedicineById(id: string) {
  try {
    const medicine = await prisma.medicine.findUnique({
      where: { id },
      include: { batches: true },
    });

    if (!medicine) {
      return { success: false, error: "Medicine not found." };
    }

    return { success: true, data: medicine };
  } catch (error: any) {
    console.error("Error fetching medicine by ID:", error);
    return { success: false, error: "Failed to fetch medicine details." };
  }
}

// 2. Create new medicine
export async function addMedicineAction(data: any) {
  try {
    // Safely extract properties (supports both flat and nested payload structures)
    const name = data.medicineInfo?.name ?? data.name;
    const company = data.medicineInfo?.company ?? data.company;
    const type = data.medicineInfo?.type ?? data.type;

    const noOfBoxes = Number(data.counts?.noOfBoxes ?? data.noOfBoxes ?? data.noOfBox ?? 0);
    const stripsPerBox = Number(data.counts?.stripsPerBox ?? data.stripsPerBox ?? data.stripInOneBox ?? 0);
    const tabletsPerBox = Number(data.counts?.tabletsPerBox ?? data.tabletsPerBox ?? data.tabletInOneBox ?? 0);

    const priceOfBox = Number(data.counts?.priceOfBox ?? data.priceOfBox ?? 0);
    const priceOfStrip = Number(data.counts?.priceOfStrip ?? data.priceOfStrip ?? data.priceOfOneStrip ?? 0);
    const priceOfTablet = Number(data.counts?.priceOfTablet ?? data.priceOfTablet ?? data.priceOfOneTablet ?? 0);

    const lowStockThreshold = Number(
      data.lowStock?.threshold ?? data.lowStockNumber ?? data.lowStockThreshold ?? 0
    );
    const lowStockUnit = data.lowStock?.unit ?? data.lowStockType ?? data.lowStockUnit ?? "Box";

    const rawBatches = Array.isArray(data.batches) ? data.batches : [];

    const medicine = await prisma.medicine.create({
      data: {
        name,
        company,
        type,
        noOfBoxes,
        stripsPerBox,
        tabletsPerBox,
        priceOfBox,
        priceOfStrip,
        priceOfTablet,
        lowStockThreshold,
        lowStockUnit,
        batches: {
          create: rawBatches.map((batch: any) => ({
            batchNumber: batch.batchNumber,
            unitType: batch.unitType ?? batch.type ?? "Box",
            quantity: Number(batch.quantity ?? batch.count ?? 0),
            expiryDate: new Date(batch.expiryDate),
          })),
        },
      },
    });

    revalidatePath("/add-medicine");
    revalidatePath("/medicine-store");

    return { success: true, data: medicine };
  } catch (error: any) {
    console.error("Error creating medicine record:", error);
    return { success: false, error: "Failed to create medicine record." };
  }
}

// 3. Update existing medicine
export async function updateMedicineAction(id: string, data: any) {
  try {
    const name = data.medicineInfo?.name ?? data.name;
    const company = data.medicineInfo?.company ?? data.company;
    const type = data.medicineInfo?.type ?? data.type;

    const noOfBoxes = Number(data.counts?.noOfBoxes ?? data.noOfBoxes ?? data.noOfBox ?? 0);
    const stripsPerBox = Number(data.counts?.stripsPerBox ?? data.stripsPerBox ?? data.stripInOneBox ?? 0);
    const tabletsPerBox = Number(data.counts?.tabletsPerBox ?? data.tabletsPerBox ?? data.tabletInOneBox ?? 0);

    const priceOfBox = Number(data.counts?.priceOfBox ?? data.priceOfBox ?? 0);
    const priceOfStrip = Number(data.counts?.priceOfStrip ?? data.priceOfStrip ?? data.priceOfOneStrip ?? 0);
    const priceOfTablet = Number(data.counts?.priceOfTablet ?? data.priceOfTablet ?? data.priceOfOneTablet ?? 0);

    const lowStockThreshold = Number(
      data.lowStock?.threshold ?? data.lowStockNumber ?? data.lowStockThreshold ?? 0
    );
    const lowStockUnit = data.lowStock?.unit ?? data.lowStockType ?? data.lowStockUnit ?? "Box";

    const rawBatches = Array.isArray(data.batches) ? data.batches : [];

    const medicine = await prisma.medicine.update({
      where: { id },
      data: {
        name,
        company,
        type,
        noOfBoxes,
        stripsPerBox,
        tabletsPerBox,
        priceOfBox,
        priceOfStrip,
        priceOfTablet,
        lowStockThreshold,
        lowStockUnit,
        batches: {
          deleteMany: {}, // Replaces existing batch entries with updated list
          create: rawBatches.map((batch: any) => ({
            batchNumber: batch.batchNumber,
            unitType: batch.unitType ?? batch.type ?? "Box",
            quantity: Number(batch.quantity ?? batch.count ?? 0),
            expiryDate: new Date(batch.expiryDate),
          })),
        },
      },
    });

    revalidatePath("/add-medicine");
    revalidatePath("/medicine-store");

    return { success: true, data: medicine };
  } catch (error: any) {
    console.error("Error updating medicine record:", error);
    return { success: false, error: "Failed to update medicine record." };
  }
}