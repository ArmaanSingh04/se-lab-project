import { authOptions } from "@/auth";
import prisma from "@/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { amount?: number };
  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { message: "Amount must be greater than 0." },
      { status: 400 }
    );
  }

  const updatedUser = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      price: {
        increment: amount,
      },
    },
    select: {
      price: true,
    },
  });

  return NextResponse.json({ price: updatedUser.price });
}
