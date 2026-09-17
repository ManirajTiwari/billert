"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";

export interface PatientInput {
  name: string;
  age: string | number;
  gender: string;
  phoneNumber: string;
}

/**
 * 1. Fetch all patients from database ordered by newest first.
 */
export async function getPatients() {
  try {
    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: patients };
  } catch (error: any) {
    console.error("Error fetching patients:", error);
    return { success: false, error: "Failed to fetch patients", data: [] };
  }
}

/**
 * 2. Save patient record with auto-incrementing padded PTID (01, 02, etc.)
 */
export async function createPatient(data: PatientInput) {
  try {
    const { name, age, gender, phoneNumber } = data;

    if (!name || !phoneNumber || !age || !gender) {
      return { success: false, error: "All fields are required." };
    }

    const parsedAge = parseInt(String(age), 10);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
      return { success: false, error: "Please enter a valid age." };
    }

    // Determine sequence number for formatted PTID
    const count = await prisma.patient.count();
    const nextNumber = count + 1;
    const formattedPtid = String(nextNumber).padStart(2, "0");

    let userId: string | undefined = undefined;
    try {
      const user = await getCurrentUser();
      if (user?.id) userId = user.id;
    } catch {
      // Proceed unlinked if auth check fails
    }

    const newPatient = await prisma.patient.create({
      data: {
        ptid: formattedPtid,
        name: name.trim(),
        age: parsedAge,
        gender,
        phoneNumber: phoneNumber.trim(),
        ...(userId ? { userId } : {}),
      },
    });

    revalidatePath("/add-patient");
    return { success: true, data: newPatient };
  } catch (err: any) {
    console.error("Prisma Database Error:", err);
    return {
      success: false,
      error: err?.message || "Failed to save to database.",
    };
  }
}