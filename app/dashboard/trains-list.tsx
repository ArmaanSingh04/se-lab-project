"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type Train = {
  train_id: number;
  train_name: string;
  source: string;
  destination: string;
  date: string;
  capacity: number;
  ticket_price: number;
  seatsLeft: number;
};

type DashboardTrainsProps = {
  trains: Train[];
  userMoney: number;
  isAdmin: boolean;
};

export default function DashboardTrains({ trains, userMoney, isAdmin }: DashboardTrainsProps) {
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);
  const [ticketCount, setTicketCount] = useState("1");
  const [message, setMessage] = useState("");
  const [reserving, setReserving] = useState(false);
  const [money, setMoney] = useState(userMoney);
  const [isMoneyModalOpen, setIsMoneyModalOpen] = useState(false);
  const [moneyInput, setMoneyInput] = useState("");
  const [addingMoney, setAddingMoney] = useState(false);

  const sortedTrains = useMemo(
    () => [...trains].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [trains]
  );

  const handleReserve = async () => {
    if (!selectedTrain) return;

    const quantity = Number(ticketCount);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setMessage("Please enter a valid number of tickets.");
      return;
    }

    if (quantity > selectedTrain.seatsLeft) {
      setMessage(`Only ${selectedTrain.seatsLeft} seat(s) are left.`);
      return;
    }

    let shouldRefresh = false;
    setReserving(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainId: selectedTrain.train_id,
          tickets: quantity,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
        remainingBalance?: number;
        seatsLeft?: number;
      };

      if (!response.ok) {
        const errorMessage = result.message || "Reservation failed.";
        setMessage(errorMessage);
        if (errorMessage.toLowerCase().includes("insufficient balance")) {
          window.alert(errorMessage);
        }
        return;
      }

      setMoney(typeof result.remainingBalance === "number" ? result.remainingBalance : money);
      setMessage(result.message || "Reservation successful.");
      setSelectedTrain(null);
      setTicketCount("1");
      shouldRefresh = true;
    } catch (reserveError) {
      setMessage(reserveError instanceof Error ? reserveError.message : "Reservation failed.");
    } finally {
      setReserving(false);
      if (shouldRefresh) {
        window.location.reload();
      }
    }
  };

  const handleAddMoney = async () => {
    const amount = Number(moneyInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage("Please enter a valid amount.");
      return;
    }

    setAddingMoney(true);
    try {
      const response = await fetch("/api/user/money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const result = (await response.json()) as { price?: number; message?: string };
      if (!response.ok || typeof result.price !== "number") {
        throw new Error(result.message || "Could not add money.");
      }

      setMoney(result.price);
      setMessage(`Money added successfully. Current balance: ${result.price}`);
      setMoneyInput("");
      setIsMoneyModalOpen(false);
    } catch (addError) {
      setMessage(addError instanceof Error ? addError.message : "Could not add money.");
    } finally {
      setAddingMoney(false);
    }
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded border p-3">
        <Link className="rounded border px-3 py-2 text-sm" href="/reservation">
          See Reservation
        </Link>
        {isAdmin ? (
          <Link className="rounded border px-3 py-2 text-sm" href="/admin/manage-trains">
            Manage Trains
          </Link>
        ) : null}
        <button
          type="button"
          className="rounded bg-black px-3 py-2 text-sm text-white"
          onClick={() => void signOut({ callbackUrl: "/login" })}
        >
          Logout
        </button>
      </div>

      <div className="mb-5 flex items-center justify-between rounded border p-4">
        <p className="font-medium">Your Money: {money}</p>
        <button
          type="button"
          className="rounded bg-black px-4 py-2 text-white"
          onClick={() => setIsMoneyModalOpen(true)}
        >
          Add Money
        </button>
      </div>

      {message ? (
        <p className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-green-700">
          {message}
        </p>
      ) : null}

      {sortedTrains.length === 0 ? (
        <p>No trains are available right now.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedTrains.map((train) => (
            <div key={train.train_id} className="rounded border p-4 shadow-sm">
              <h2 className="text-lg font-semibold">{train.train_name}</h2>
              <p className="mt-2 text-sm">
                <span className="font-medium">Route:</span> {train.source} to {train.destination}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-medium">Date:</span>{" "}
                {new Date(train.date).toLocaleString()}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-medium">Capacity:</span> {train.capacity}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-medium">Seats Left:</span> {train.seatsLeft}
              </p>
              <p className="mt-1 text-sm">
                <span className="font-medium">Ticket Price:</span> {train.ticket_price}
              </p>

              <button
                type="button"
                className="mt-4 rounded bg-black px-4 py-2 text-white"
                onClick={() => {
                  setSelectedTrain(train);
                  setTicketCount("1");
                }}
                disabled={train.seatsLeft <= 0}
              >
                {train.seatsLeft > 0 ? "Reserve" : "Sold Out"}
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedTrain ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded bg-white p-6 text-black">
            <h3 className="text-xl font-semibold">Reserve Tickets</h3>
            <p className="mt-2 text-sm text-zinc-700">{selectedTrain.train_name}</p>

            <label className="mt-4 block text-sm font-medium">How many tickets do you want?</label>
            <input
              className="mt-2 w-full rounded border p-2"
              type="number"
              min={1}
              max={selectedTrain.seatsLeft}
              value={ticketCount}
              onChange={(event) => setTicketCount(event.target.value)}
            />
            <p className="mt-2 text-sm text-zinc-600">
              Available seats: {selectedTrain.seatsLeft}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border px-4 py-2"
                onClick={() => setSelectedTrain(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reserving}
                className="rounded bg-black px-4 py-2 text-white"
                onClick={handleReserve}
              >
                {reserving ? "Reserving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isMoneyModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded bg-white p-6 text-black">
            <h3 className="text-xl font-semibold">Add Money</h3>
            <label className="mt-4 block text-sm font-medium">How much money do you want to add?</label>
            <input
              className="mt-2 w-full rounded border p-2"
              type="number"
              min={1}
              step="0.01"
              value={moneyInput}
              onChange={(event) => setMoneyInput(event.target.value)}
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border px-4 py-2"
                onClick={() => {
                  setIsMoneyModalOpen(false);
                  setMoneyInput("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={addingMoney}
                className="rounded bg-black px-4 py-2 text-white disabled:opacity-70"
                onClick={handleAddMoney}
              >
                {addingMoney ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
