import { authOptions } from "@/auth";
import prisma from "@/db";
import { getServerSession, Session } from "next-auth";
import { NextResponse } from "next/server";

function ensureAdmin(session: Session | null) {
  return (session?.user?.email && session.user.role === "ADMIN");
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

export async function PUT(
  request: Request,
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

  const data = await request.json();
  const { train_name, source, destination, date, capacity, ticket_price } = data;

  try {
    const updatedTrain = await prisma.train.update({
      where: { train_id: id },
      data: {
        train_name,
        source,
        destination,
        date: new Date(date),
        capacity: Number(capacity),
        ticket_price: Number(ticket_price),
      },
    });

    return NextResponse.json(updatedTrain);
  } catch (error) {
    return NextResponse.json({ message: "Failed to update train." }, { status: 500 });
  }
}
