import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <h1 className="text-xl font-semibold tracking-wide">
          RailReserve
        </h1>
        <Link
          href="/dashboard"
          className="px-4 py-2 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition"
        >
          Go to Dashboard
        </Link>
      </nav>

      <section className="flex flex-col items-center justify-center text-center px-6 py-24">
        <h2 className="text-5xl font-bold mb-6 leading-tight">
          Smart Railway Reservation System
        </h2>
        <p className="text-gray-400 max-w-2xl mb-8">
          Book tickets seamlessly, check train availability, and manage your
          journeys with ease. Built for speed, reliability, and simplicity.
        </p>

        <Link
          href="/dashboard"
          className="px-6 py-3 rounded-2xl bg-green-500 text-white text-lg font-medium hover:bg-green-600 transition"
        >
          Get Started
        </Link>
      </section>

      <section className="px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <h3 className="text-xl font-semibold mb-2">Fast Booking</h3>
          <p className="text-gray-400">
            Reserve tickets instantly with a smooth and intuitive interface.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <h3 className="text-xl font-semibold mb-2">Live Availability</h3>
          <p className="text-gray-400">
            Check seat availability and train schedules in real-time.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <h3 className="text-xl font-semibold mb-2">Easy Management</h3>
          <p className="text-gray-400">
            View bookings, cancel tickets, and manage journeys effortlessly.
          </p>
        </div>
      </section>

      <footer className="text-center py-6 border-t border-gray-800 text-gray-500">
        © {new Date().getFullYear()} RailReserve. All rights reserved.
      </footer>
    </main>
  );
}
