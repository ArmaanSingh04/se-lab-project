import { authOptions } from "@/auth";
import { registerUser } from "../../actions/register";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session?.user?.email) {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <form
        action={registerUser}
        className="flex flex-col gap-4 p-6 border rounded w-80"
      >
        <h1 className="text-xl font-semibold">Register</h1>

        <input
          name="email"
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          className="border p-2 rounded"
        />

        <button
          type="submit"
          className="bg-black text-white p-2 rounded"
        >
          Register
        </button>
      </form>
    </div>
  );
}