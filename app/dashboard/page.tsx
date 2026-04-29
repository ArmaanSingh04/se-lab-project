import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import prisma from "@/db";
import DashboardTrains from "./trains-list";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  const trains = await prisma.train.findMany({
    orderBy: { date: "asc" },
    include: {
      reservations: {
        select: { tickets: true },
      },
    },
  });
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { price: true },
  });

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Passenger Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">You are logged in as {session.user.email}</p>
      </div>
      <DashboardTrains
        trains={trains.map((train) => {
          const reservedSeats = train.reservations.reduce(
            (total, reservation) => total + reservation.tickets,
            0
          );

          return {
            train_id: train.train_id,
            train_name: train.train_name,
            source: train.source,
            destination: train.destination,
            date: train.date.toISOString(),
            capacity: train.capacity,
            ticket_price: train.ticket_price,
            seatsLeft: train.capacity - reservedSeats,
          };
        })}
        userMoney={user?.price ?? 0}
      isAdmin={session.user.role === "ADMIN"}
      />
    </div>
  );
}


export const revalidate = 0;