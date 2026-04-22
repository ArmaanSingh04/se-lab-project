"use client";

import { useState } from "react";

type ReservationItem = {
  reservation_id: number;
  tickets: number;
  total_price: number;
  createdAt: Date;
  train: {
    train_name: string;
    source: string;
    destination: string;
    date: Date;
    ticket_price: number;
  };
};

type ReservationsListProps = {
  reservations: ReservationItem[];
  initialMoney: number;
};

export default function ReservationsList({
  reservations: initialReservations,
  initialMoney,
}: ReservationsListProps) {
  const [reservations, setReservations] = useState(initialReservations);
  const [money, setMoney] = useState(initialMoney);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (reservationId: number) => {
    const confirmed = window.confirm("Delete this reservation?");
    if (!confirmed) return;

    setDeletingId(reservationId);
    setMessage("");
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as {
        message?: string;
        refundedAmount?: number;
        remainingBalance?: number;
      };

      if (!response.ok) {
        throw new Error(result.message || "Could not delete reservation.");
      }

      setReservations((prev) =>
        prev.filter((reservation) => reservation.reservation_id !== reservationId)
      );

      if (typeof result.remainingBalance === "number") {
        setMoney(result.remainingBalance);
      }

      setMessage(
        `${result.message || "Reservation deleted."} Refunded: ${
          result.refundedAmount ?? 0
        }.`
      );
    } catch (deleteError) {
      setMessage(
        deleteError instanceof Error ? deleteError.message : "Could not delete reservation."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* <p className="mb-4 text-sm font-medium">Updated balance: {money}</p> */}
      {message ? (
        <p className="mb-4 rounded-lg border border-green-500/30 bg-green-900/20 p-3 text-sm text-green-400">{message}</p>
      ) : null}

      {reservations.length === 0 ? (
        <p className="text-gray-400">No reservations found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reservations.map((reservation) => (
            <div key={reservation.reservation_id} className="group rounded-xl border border-gray-700 bg-zinc-900 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <h2 className="text-lg font-semibold text-white">{reservation.train.train_name}</h2>
              <p className="mt-2 text-sm text-gray-400">
                <span className="font-medium text-gray-300">Route:</span> {reservation.train.source} to {reservation.train.destination}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                <span className="font-medium text-gray-300">Train Date:</span> {new Date(reservation.train.date).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                <span className="font-medium text-gray-300">Tickets:</span> {reservation.tickets}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                <span className="font-medium text-gray-300">Price per Ticket:</span> {reservation.train.ticket_price}
              </p>
              <p className="mt-1 text-sm text-gray-400">
                <span className="font-medium text-gray-300">Total Paid:</span> {reservation.total_price}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Reserved on: {new Date(reservation.createdAt).toLocaleString()}
              </p>

              <button
                type="button"
                className="mt-4 cursor-pointer rounded-lg bg-red-600 px-4 py-2 font-medium text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deletingId === reservation.reservation_id}
                onClick={() => handleDelete(reservation.reservation_id)}
              >
                {deletingId === reservation.reservation_id
                  ? "Deleting..."
                  : "Delete Reservation"}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
