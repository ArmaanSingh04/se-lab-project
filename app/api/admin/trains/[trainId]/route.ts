import { authOptions } from "@/auth";
import prisma from "@/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function ensureAdmin(session: Awaited<ReturnType<typeof getServerSession>>) {
  return session?.user?.email && session.user.role === "ADMIN";
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ trainId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!ensureAdmin(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { trainId } = await params;
  const id = Number(trainId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ message: "Invalid train id." }, { status: 400 });
  }

  await prisma.train.delete({
    where: { train_id: id },
  });

  return NextResponse.json({ success: true });
}
