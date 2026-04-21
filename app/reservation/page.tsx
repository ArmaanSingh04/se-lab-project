import { authOptions } from "@/auth";
import prisma from "@/db";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ReservationsList from "./reservations-list";
import Link from "next/link";

export default async function ReservationPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, price: true },
  });

  if (!user) {
    redirect("/login");
  }

  const reservations = await prisma.reservation.findMany({
    where: { userId: user.id },
    include: {
      train: {
        select: {
          train_name: true,
          source: true,
          destination: true,
          date: true,
          ticket_price: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl p-6">
      <div className="mb-4 rounded border p-3">
        <Link className="rounded border px-3 py-2 text-sm" href="/dashboard">
          Go to Dashboard
        </Link>
      </div>
      <h1 className="mb-2 text-2xl font-semibold">Manage Reservations</h1>
      {/* <p className="mb-6 text-sm text-zinc-600">Current balance: {user.price}</p> */}
      <ReservationsList
        initialMoney={user.price}
        reservations={reservations.map((reservation) => ({
          reservation_id: reservation.reservation_id,
          tickets: reservation.tickets,
          total_price: reservation.total_price,
          createdAt: reservation.createdAt,
          train: reservation.train,
        }))}
      />
    </div>
  );
}
