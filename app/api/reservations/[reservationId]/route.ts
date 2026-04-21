import { authOptions } from "@/auth";
import prisma from "@/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ reservationId: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { reservationId } = await params;
  const id = Number(reservationId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ message: "Invalid reservation id." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true },
      });

      if (!user) {
        throw new Error("User not found.");
      }

      const reservation = await tx.reservation.findUnique({
        where: { reservation_id: id },
        select: {
          reservation_id: true,
          userId: true,
          total_price: true,
        },
      });

      if (!reservation) {
        throw new Error("Reservation not found.");
      }

      if (reservation.userId !== user.id) {
        throw new Error("You can only delete your own reservation.");
      }

      await tx.reservation.delete({
        where: { reservation_id: id },
      });

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          price: {
            increment: reservation.total_price,
          },
        },
        select: { price: true },
      });

      return {
        message: "Reservation deleted and money refunded.",
        refundedAmount: reservation.total_price,
        remainingBalance: updatedUser.price,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete reservation.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
