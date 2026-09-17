"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { SignUpFormData, LoginFormData } from "@/types/auth";

export async function signUpUser(formData: SignUpFormData) {
  try {
    if (formData.password !== formData.confirmPassword) {
      return { success: false, error: "Passwords do not match" };
    }

    // Email ya Name me se koi bhi pehle se exist kare toh block karega
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: formData.email }, { name: formData.name }],
      },
    });

    if (existingUser) {
      if (existingUser.email === formData.email) {
        return { success: false, error: "Email is already registered" };
      }
      return { success: false, error: "Name/Username is already taken" };
    }

    const hashedPassword = await bcrypt.hash(formData.password, 10);

    const user = await prisma.user.create({
      data: {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        password: hashedPassword,
      },
    });

    // Save user session in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("user_email", user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return { success: true, user: { email: user.email, name: user.name } };
  } catch (error) {
    return { success: false, error: "Failed to register user" };
  }
}

export async function loginUser(formData: LoginFormData) {
  try {
    // Name se user search kar rahe hain
    const user = await prisma.user.findFirst({
      where: { name: formData.name },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const isPasswordValid = await bcrypt.compare(
      formData.password,
      user.password
    );

    if (!isPasswordValid) {
      return { success: false, error: "Invalid credentials" };
    }

    // Save user session in HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("user_email", user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return { success: true, user: { email: user.email, name: user.name } };
  } catch (error) {
    return { success: false, error: "Login failed" };
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get("user_email")?.value;
    if (!email) return null;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        pharmacyName: true,
        phoneNumber: true,
        secondaryPhone: true,
        address: true,
        currencyName: true,
        currencySymbol: true,
        subscriptionActive: true,
        logoUrl: true,
      },
    });
    return user;
  } catch (error) {
    return null;
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("user_email");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Logout failed" };
  }
}