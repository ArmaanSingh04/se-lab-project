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

  const [filterSource, setFilterSource] = useState("");
  const [filterDestination, setFilterDestination] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const minDateStr = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().split("T")[0];
  }, []);

  const sortedTrains = useMemo(
    () => {
      const now = new Date();
      let filtered = trains.filter((t) => new Date(t.date) >= now);
      if (filterSource) {
        filtered = filtered.filter((t) =>
          t.source.toLowerCase().includes(filterSource.toLowerCase())
        );
      }
      if (filterDestination) {
        filtered = filtered.filter((t) =>
          t.destination.toLowerCase().includes(filterDestination.toLowerCase())
        );
      }
      if (filterDate) {
        filtered = filtered.filter((t) => {
          if (t.date.startsWith(filterDate)) return true;
          const tDate = new Date(t.date);
          if (isNaN(tDate.getTime())) return false;
          const year = tDate.getFullYear();
          const month = String(tDate.getMonth() + 1).padStart(2, "0");
          const day = String(tDate.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}` === filterDate;
        });
      }
      return [...filtered].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    },
    [trains, filterSource, filterDestination, filterDate]
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
      <div className="mb-4 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Link className="cursor-pointer rounded-lg bg-[#055ffe] px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-[#044fd1] hover:shadow-lg" href="/reservation">
            See Reservation
          </Link>
          {isAdmin ? (
            <Link className="cursor-pointer rounded-lg bg-[#055ffe] px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-[#044fd1] hover:shadow-lg" href="/admin/manage-trains">
              Manage Trains
            </Link>
          ) : null}
        </div>
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
          onClick={() => void signOut({ callbackUrl: "/login" })}
        >
          Logout
        </button>
      </div>

      <div className="mb-5 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-zinc-900">
        <p className="font-medium">Your Money: {money}</p>
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-[#055ffe] px-4 py-2 font-medium text-white shadow-md transition-all hover:bg-[#044fd1] hover:shadow-lg"
          onClick={() => setIsMoneyModalOpen(true)}
        >
          Add Money
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-zinc-900">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Source</label>
          <input
            type="text"
            placeholder="Filter by source..."
            className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-[#055ffe] focus:outline-none focus:ring-1 focus:ring-[#055ffe] dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Destination</label>
          <input
            type="text"
            placeholder="Filter by destination..."
            className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-[#055ffe] focus:outline-none focus:ring-1 focus:ring-[#055ffe] dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
            value={filterDestination}
            onChange={(e) => setFilterDestination(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
          <input
            type="date"
            min={minDateStr}
            className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-gray-900 focus:border-[#055ffe] focus:outline-none focus:ring-1 focus:ring-[#055ffe] dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
        </div>
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
            <div key={train.train_id} className="group rounded-xl border border-gray-200 bg-white p-5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-zinc-900">
              <h2 className="text-lg font-semibold">{train.train_name}</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-gray-100">Route:</span> {train.source} to {train.destination}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-gray-100">Date:</span>{" "}
                {new Date(train.date).toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-gray-100">Capacity:</span> {train.capacity}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-gray-100">Seats Left:</span> {train.seatsLeft}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-gray-100">Ticket Price:</span> {train.ticket_price}
              </p>

              <button
                type="button"
                className="mt-4 cursor-pointer rounded-lg bg-[#055ffe] px-4 py-2 font-medium text-white shadow-md transition-all hover:bg-[#044fd1] hover:shadow-lg disabled:cursor-not-allowed disabled:bg-gray-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-700 bg-zinc-900 p-6 text-white shadow-2xl">
            <h3 className="text-xl font-semibold">Reserve Tickets</h3>
            <p className="mt-2 text-sm text-gray-400">{selectedTrain.train_name}</p>

            <label className="mt-4 block text-sm font-medium text-gray-300">How many tickets do you want?</label>
            <input
              className="mt-2 w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-[#055ffe] focus:outline-none focus:ring-1 focus:ring-[#055ffe]"
              type="number"
              min={1}
              max={selectedTrain.seatsLeft}
              value={ticketCount}
              onChange={(event) => setTicketCount(event.target.value)}
            />
            <p className="mt-2 text-sm text-gray-400">
              Available seats: {selectedTrain.seatsLeft}
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                onClick={() => setSelectedTrain(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reserving}
                className="cursor-pointer rounded-lg bg-[#055ffe] px-4 py-2 font-medium text-white shadow-md transition-all hover:bg-[#044fd1] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                onClick={handleReserve}
              >
                {reserving ? "Reserving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isMoneyModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-700 bg-zinc-900 p-6 text-white shadow-2xl">
            <h3 className="text-xl font-semibold">Add Money</h3>
            <label className="mt-4 block text-sm font-medium text-gray-300">How much money do you want to add?</label>
            <input
              className="mt-2 w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-[#055ffe] focus:outline-none focus:ring-1 focus:ring-[#055ffe]"
              type="number"
              min={1}
              step="0.01"
              value={moneyInput}
              onChange={(event) => setMoneyInput(event.target.value)}
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="cursor-pointer rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
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
                className="cursor-pointer rounded-lg bg-[#055ffe] px-4 py-2 font-medium text-white shadow-md transition-all hover:bg-[#044fd1] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
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
