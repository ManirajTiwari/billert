"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(email: string, data: any) {
  try {
    if (!email) {
      return { success: false, error: "User email is required" };
    }

    // Map exact keys passed from frontend payload
    const updateData: any = {
      name: data.name,
      pharmacyName: data.pharmacyName,
      phoneNumber: data.phoneNumber,
      secondaryPhone: data.secondaryPhone,
      address: data.address,
      currencyName: data.currencyName,
      currencySymbol: data.currencySymbol,
      subscriptionActive: data.subscriptionActive,
      logoUrl: data.logoUrl,
    };

    // Only hash and update password if provided
    if (data.password && data.password.trim() !== "" && data.password !== "••••••••") {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    // Save directly to the Prisma User model
    const updatedUser = await prisma.user.update({
      where: { email },
      data: updateData,
    });

    revalidatePath("/dashboard");
    return { success: true, data: updatedUser };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: "Failed to update profile in database" };
  }
}