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
      {/* Navbar */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold">Manage Reservations</h1>
        <Link
          href="/dashboard"
          className="cursor-pointer rounded-lg bg-[#055ffe] px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-[#044fd1] hover:shadow-lg"
        >
          Go to Dashboard
        </Link>
      </div>
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


export const revalidate = 0;