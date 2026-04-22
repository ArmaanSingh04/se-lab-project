"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    if (result?.url) {
      window.location.href = result.url;
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-gray-700 bg-zinc-900 p-8 shadow-2xl">
      <h1 className="mb-6 text-center text-2xl font-bold text-white">Welcome Back</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">Email</label>
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-lg border border-gray-600 bg-gray-800 p-3 text-white placeholder-gray-500 focus:border-[#055ffe] focus:outline-none focus:ring-1 focus:ring-[#055ffe]"
            required
          />
        </div>

        {error ? <p className="rounded-lg border border-red-500/30 bg-red-900/20 p-2 text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          className="mt-2 cursor-pointer rounded-lg bg-[#055ffe] p-3 font-medium text-white shadow-md transition-all hover:bg-[#044fd1] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-400">
        Don't have an account?{" "}
        <Link href="/register" className="font-medium text-[#055ffe] transition-colors hover:text-[#044fd1] hover:underline">
          Register here
        </Link>
      </p>
    </div>
  );
}
