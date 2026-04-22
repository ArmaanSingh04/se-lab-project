import { authOptions } from "@/auth";
import { registerUser } from "../../actions/register";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-zinc-900 p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">Create Account</h1>

        <form action={registerUser} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-[#055ffe] focus:outline-none focus:ring-1 focus:ring-[#055ffe]"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter your password"
              className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-[#055ffe] focus:outline-none focus:ring-1 focus:ring-[#055ffe]"
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 cursor-pointer rounded-lg bg-green-600 p-3 font-medium text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg"
          >
            Register
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#055ffe] transition-colors hover:text-[#044fd1] hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}