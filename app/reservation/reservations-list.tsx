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
        <p className="mb-4 rounded border border-zinc-300 bg-zinc-50 p-3 text-sm">{message}</p>
      ) : null}

      {reservations.length === 0 ? (
        <p>No reservations found.</p>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div key={reservation.reservation_id} className="rounded border p-4">
              <h2 className="text-lg font-semibold">{reservation.train.train_name}</h2>
              <p className="mt-1 text-sm">
                Route: {reservation.train.source} to {reservation.train.destination}
              </p>
              <p className="mt-1 text-sm">
                Train Date: {new Date(reservation.train.date).toLocaleString()}
              </p>
              <p className="mt-1 text-sm">Tickets: {reservation.tickets}</p>
              <p className="mt-1 text-sm">Price per Ticket: {reservation.train.ticket_price}</p>
              <p className="mt-1 text-sm">Total Paid: {reservation.total_price}</p>
              <p className="mt-1 text-xs text-zinc-600">
                Reserved on: {new Date(reservation.createdAt).toLocaleString()}
              </p>

              <button
                type="button"
                className="mt-4 rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60"
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
