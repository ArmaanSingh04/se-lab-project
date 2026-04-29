"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Train = {
  train_id: number;
  train_name: string;
  source: string;
  destination: string;
  date: string;
  capacity: number;
  ticket_price: number;
};

const initialForm = {
  train_name: "",
  source: "",
  destination: "",
  date: "",
  capacity: "",
  ticket_price: "",
};

export default function ManageTrains() {
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editTrainId, setEditTrainId] = useState<number | null>(null);

  const minDateTime = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  }, []);

  const sortedTrains = useMemo(
    () => [...trains].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [trains]
  );

  useEffect(() => {
    const loadTrains = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/admin/trains", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load trains.");
        }

        const data = (await response.json()) as Train[];
        setTrains(data);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Could not fetch trains.");
      } finally {
        setLoading(false);
      }
    };

    void loadTrains();
  }, []);

  const handleSubmitTrain = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const url = editTrainId ? `/api/admin/trains/${editTrainId}` : "/api/admin/trains";
      const method = editTrainId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          capacity: Number(form.capacity),
          ticket_price: Number(form.ticket_price),
          date: new Date(form.date).toISOString(),
        }),
      });

      const result = (await response.json()) as Train | { message?: string };

      if (!response.ok) {
        throw new Error("message" in result && result.message ? result.message : "Operation failed.");
      }

      if (editTrainId) {
        setTrains((prev) => prev.map((t) => (t.train_id === editTrainId ? (result as Train) : t)));
      } else {
        setTrains((prev) => [...prev, result as Train]);
      }
      
      setForm(initialForm);
      setEditTrainId(null);
      setIsModalOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not save train.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (train: Train) => {
    const tDate = new Date(train.date);
    const tzOffset = tDate.getTimezoneOffset() * 60000;
    const localISOTime = new Date(tDate.getTime() - tzOffset).toISOString().slice(0, 16);

    setForm({
      train_name: train.train_name,
      source: train.source,
      destination: train.destination,
      date: localISOTime,
      capacity: train.capacity.toString(),
      ticket_price: train.ticket_price.toString(),
    });
    setEditTrainId(train.train_id);
    setIsModalOpen(true);
  };

  const handleDeleteTrain = async (trainId: number) => {
    const confirmed = window.confirm("Delete this train?");
    if (!confirmed) return;

    setError("");
    try {
      const response = await fetch(`/api/admin/trains/${trainId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const result = (await response.json()) as { message?: string };
        throw new Error(result.message || "Delete failed.");
      }

      setTrains((prev) => prev.filter((train) => train.train_id !== trainId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete train.");
    }
  };

  return (
    <div className="mx-auto min-h-screen max-w-6xl p-6">
      {/* Navbar */}
      <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold">Manage Trains</h1>
        <Link
          href="/dashboard"
          className="cursor-pointer rounded-lg bg-[#055ffe] px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-[#044fd1] hover:shadow-lg"
        >
          Go to Dashboard
        </Link>
      </div>

      {/* Create Train Button */}
      <div className="mb-6 flex justify-end">
        <button
          className="cursor-pointer rounded-lg bg-green-600 px-4 py-2 font-medium text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg"
          onClick={() => setIsModalOpen(true)}
          type="button"
        >
          Create New Train
        </button>
      </div>

      {error ? <p className="mb-4 rounded-lg border border-red-500/30 bg-red-900/20 p-3 text-red-400">{error}</p> : null}

      {loading ? (
        <p className="text-gray-400">Loading trains...</p>
      ) : sortedTrains.length === 0 ? (
        <p className="text-gray-400">No trains found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700 shadow-lg">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Source</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Destination</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Capacity</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Ticket Price</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700 bg-zinc-900/50">
              {sortedTrains.map((train) => (
                <tr key={train.train_id} className="transition-colors hover:bg-zinc-800/50">
                  <td className="px-4 py-3 text-sm text-gray-300">{train.train_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{train.source}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{train.destination}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{new Date(train.date).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{train.capacity}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{train.ticket_price}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditClick(train)}
                        className="cursor-pointer rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTrain(train.train_id)}
                        className="cursor-pointer rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-zinc-900 p-6 text-white shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold">{editTrainId ? "Edit Train" : "Create New Train"}</h2>

            <form className="space-y-4" onSubmit={handleSubmitTrain}>
              <input
                required
                type="text"
                value={form.train_name}
                onChange={(event) => setForm((prev) => ({ ...prev, train_name: event.target.value }))}
                placeholder="Train name"
                className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-[#055ffe] focus:outline-none focus:ring-1 focus:ring-[#055ffe]"
              />
              <input
                required
                type="text"
                value={form.source}
                onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
                placeholder="Source"
                className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-[#055ffe] focus:outline-none focus:ring-1 focus:ring-[#055ffe]"
              />
              <input
                required
                type="text"
                value={form.destination}
                onChange={(event) => setForm((prev) => ({ ...prev, destination: event.target.value }))}
                placeholder="Destination"
                className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-[#055ffe] focus:outline-none focus:ring-1 focus:ring-[#055ffe]"
              />
              <input
                required
                type="datetime-local"
                value={form.date}
                min={minDateTime}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-[#055ffe] focus:outline-none focus:ring-1 focus:ring-[#055ffe]"
              />
              <input
                required
                min={1}
                type="number"
                value={form.capacity}
                onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
                placeholder="Capacity"
                className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-[#055ffe] focus:outline-none focus:ring-1 focus:ring-[#055ffe]"
              />
              <input
                required
                min={1}
                step="0.01"
                type="number"
                value={form.ticket_price}
                onChange={(event) => setForm((prev) => ({ ...prev, ticket_price: event.target.value }))}
                placeholder="Ticket price"
                className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-[#055ffe] focus:outline-none focus:ring-1 focus:ring-[#055ffe]"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="cursor-pointer rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
                  onClick={() => {
                    setIsModalOpen(false);
                    setForm(initialForm);
                    setEditTrainId(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer rounded-lg bg-[#055ffe] px-4 py-2 font-medium text-white shadow-md transition-all hover:bg-[#044fd1] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Saving..." : (editTrainId ? "Update" : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export const dynamic = "force-dynamic";