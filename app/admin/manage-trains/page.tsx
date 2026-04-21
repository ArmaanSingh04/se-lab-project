"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

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

  const handleCreateTrain = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/admin/trains", {
        method: "POST",
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
        throw new Error("message" in result && result.message ? result.message : "Create failed.");
      }

      setTrains((prev) => [...prev, result as Train]);
      setForm(initialForm);
      setIsModalOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create train.");
    } finally {
      setSubmitting(false);
    }
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
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Trains</h1>
        <button
          className="rounded bg-black px-4 py-2 text-white"
          onClick={() => setIsModalOpen(true)}
          type="button"
        >
          Create New Train
        </button>
      </div>

      {error ? <p className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">{error}</p> : null}

      {loading ? (
        <p>Loading trains...</p>
      ) : sortedTrains.length === 0 ? (
        <p>No trains found.</p>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full divide-y">
            <thead className="bg-zinc-100">
              <tr>
                <th className="px-3 py-2 text-left text-sm font-medium">Name</th>
                <th className="px-3 py-2 text-left text-sm font-medium">Source</th>
                <th className="px-3 py-2 text-left text-sm font-medium">Destination</th>
                <th className="px-3 py-2 text-left text-sm font-medium">Date</th>
                <th className="px-3 py-2 text-left text-sm font-medium">Capacity</th>
                <th className="px-3 py-2 text-left text-sm font-medium">Ticket Price</th>
                <th className="px-3 py-2 text-left text-sm font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrains.map((train) => (
                <tr key={train.train_id} className="border-t">
                  <td className="px-3 py-2">{train.train_name}</td>
                  <td className="px-3 py-2">{train.source}</td>
                  <td className="px-3 py-2">{train.destination}</td>
                  <td className="px-3 py-2">{new Date(train.date).toLocaleString()}</td>
                  <td className="px-3 py-2">{train.capacity}</td>
                  <td className="px-3 py-2">{train.ticket_price}</td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteTrain(train.train_id)}
                      className="rounded bg-red-600 px-3 py-1 text-sm text-white"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded bg-white p-6 text-black">
            <h2 className="mb-4 text-xl font-semibold">Create New Train</h2>

            <form className="space-y-3" onSubmit={handleCreateTrain}>
              <input
                required
                type="text"
                value={form.train_name}
                onChange={(event) => setForm((prev) => ({ ...prev, train_name: event.target.value }))}
                placeholder="Train name"
                className="w-full rounded border p-2"
              />
              <input
                required
                type="text"
                value={form.source}
                onChange={(event) => setForm((prev) => ({ ...prev, source: event.target.value }))}
                placeholder="Source"
                className="w-full rounded border p-2"
              />
              <input
                required
                type="text"
                value={form.destination}
                onChange={(event) => setForm((prev) => ({ ...prev, destination: event.target.value }))}
                placeholder="Destination"
                className="w-full rounded border p-2"
              />
              <input
                required
                type="datetime-local"
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                className="w-full rounded border p-2"
              />
              <input
                required
                min={1}
                type="number"
                value={form.capacity}
                onChange={(event) => setForm((prev) => ({ ...prev, capacity: event.target.value }))}
                placeholder="Capacity"
                className="w-full rounded border p-2"
              />
              <input
                required
                min={1}
                step="0.01"
                type="number"
                value={form.ticket_price}
                onChange={(event) => setForm((prev) => ({ ...prev, ticket_price: event.target.value }))}
                placeholder="Ticket price"
                className="w-full rounded border p-2"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded border px-4 py-2"
                  onClick={() => {
                    setIsModalOpen(false);
                    setForm(initialForm);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-black px-4 py-2 text-white disabled:opacity-70"
                >
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}