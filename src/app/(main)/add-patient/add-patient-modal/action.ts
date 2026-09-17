"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/app/actions/auth";
import { revalidatePath } from "next/cache";

export interface PatientData {
  name: string;
  age: string | number;
  gender: string;
  phoneNumber: string;
}

// 1. Fetch all patients from SQLite database
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

// 2. Create Patient Record in SQLite with auto-generated PTID ("01", "02"...)
export async function createPatient(data: PatientData) {
  try {
    const { name, age, gender, phoneNumber } = data;

    // 1. Validation
    if (!name || !phoneNumber || !age || !gender) {
      return { success: false, error: "All fields are required." };
    }

    const parsedAge = parseInt(String(age), 10);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 150) {
      return { success: false, error: "Please enter a valid age." };
    }

    // 2. Generate sequential 2-digit PTID (01, 02, 03...)
    const count = await prisma.patient.count();
    const nextNumber = count + 1;
    const formattedPtid = String(nextNumber).padStart(2, "0");

    // 3. Safely check for logged-in user
    let userId: string | undefined = undefined;
    try {
      const user = await getCurrentUser();
      if (user?.id) {
        userId = user.id;
      }
    } catch {
      console.log("No auth session found; creating unlinked patient.");
    }

    // 4. Create Patient Record in SQLite
    const newPatient = await prisma.patient.create({
      data: {
        ptid: formattedPtid, // 👈 Saves "01", "02", "03"...
        name: name.trim(),
        age: parsedAge,
        gender,
        phoneNumber: phoneNumber.trim(),
        ...(userId ? { userId } : {}),
      },
    });

    console.log("Patient created successfully:", newPatient);

    // 5. Force cache clear across the layout
    revalidatePath("/", "layout");

    return { success: true, data: newPatient };
  } catch (err: any) {
    console.error("Prisma Database Error:", err);
    return {
      success: false,
      error: err?.message || "Failed to insert into database.",
    };
  }
}