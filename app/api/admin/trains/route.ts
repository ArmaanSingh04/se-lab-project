import { authOptions } from "@/auth";
import prisma from "@/db";
import { getServerSession, Session } from "next-auth";
import { NextResponse } from "next/server";

function ensureAdmin(session: Session | null) {
  return session?.user?.email && session.user.role === "ADMIN";
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!ensureAdmin(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const trains = await prisma.train.findMany({
    orderBy: { date: "asc" },
  });

  return NextResponse.json(trains);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!ensureAdmin(session)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const body = (await request.json()) as {
    train_name?: string;
    source?: string;
    destination?: string;
    date?: string;
    capacity?: number;
    ticket_price?: number;
  };

  const train_name = body.train_name?.trim();
  const source = body.source?.trim();
  const destination = body.destination?.trim();
  const date = body.date ? new Date(body.date) : null;
  const capacity =
    typeof body.capacity === "number" ? body.capacity : Number(body.capacity);
  const ticketPrice =
    typeof body.ticket_price === "number"
      ? body.ticket_price
      : Number(body.ticket_price);

  if (!train_name || !source || !destination || !date || Number.isNaN(date.getTime())) {
    return NextResponse.json({ message: "Invalid train details." }, { status: 400 });
  }

  if (!Number.isFinite(capacity) || capacity <= 0) {
    return NextResponse.json({ message: "Capacity must be greater than 0." }, { status: 400 });
  }

  if (!Number.isFinite(ticketPrice) || ticketPrice <= 0) {
    return NextResponse.json(
      { message: "Ticket price must be greater than 0." },
      { status: 400 }
    );
  }

  const train = await prisma.train.create({
    data: {
      train_name,
      source,
      destination,
      date,
      capacity,
      ticket_price: ticketPrice,
    },
  });

  return NextResponse.json(train, { status: 201 });
}
