import { authOptions } from "@/auth";
import prisma from "@/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    trainId?: number;
    tickets?: number;
  };

  const trainId = typeof body.trainId === "number" ? body.trainId : Number(body.trainId);
  const tickets = typeof body.tickets === "number" ? body.tickets : Number(body.tickets);

  if (!Number.isInteger(trainId) || trainId <= 0) {
    return NextResponse.json({ message: "Invalid train id." }, { status: 400 });
  }

  if (!Number.isInteger(tickets) || tickets <= 0) {
    return NextResponse.json({ message: "Invalid ticket count." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const [user, train] = await Promise.all([
        tx.user.findUnique({
          where: { email: session.user.email! },
          select: { id: true, price: true },
        }),
        tx.train.findUnique({
          where: { train_id: trainId },
          select: { train_id: true, train_name: true, capacity: true, ticket_price: true },
        }),
      ]);

      if (!user) {
        throw new Error("User not found.");
      }

      if (!train) {
        throw new Error("Train not found.");
      }

      const reservationAggregate = await tx.reservation.aggregate({
        where: { train_id: trainId },
        _sum: { tickets: true },
      });

      const reservedSeats = reservationAggregate._sum.tickets ?? 0;
      const seatsLeft = train.capacity - reservedSeats;

      if (tickets > seatsLeft) {
        throw new Error(`Only ${seatsLeft} seat(s) are left.`);
      }

      const totalPrice = tickets * train.ticket_price;

      if (user.price < totalPrice) {
        throw new Error("Insufficient balance. Please add money first.");
      }

      await tx.reservation.create({
        data: {
          userId: user.id,
          train_id: train.train_id,
          tickets,
          total_price: totalPrice,
        },
      });

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          price: {
            decrement: totalPrice,
          },
        },
        select: { price: true },
      });

      return {
        message: `Reserved ${tickets} ticket(s) for ${train.train_name}.`,
        remainingBalance: updatedUser.price,
        seatsLeft: seatsLeft - tickets,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reservation failed.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
