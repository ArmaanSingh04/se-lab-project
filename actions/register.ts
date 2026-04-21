// app/register/actions.ts
"use server";

import prisma from "@/db";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    // check existing user
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        throw new Error("User already exists");
    }

    await prisma.user.create({
        data: {
            email,
            password: password,
            role: "PASSENGER", // force role
        },
    });

    // redirect after success
    redirect("/login");
}