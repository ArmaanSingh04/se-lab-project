import Link from "next/link";
import { redirect } from "next/navigation";

export default function Home() {

  const redi = () => {
    redirect("/login")
  }
  return (
    <div>{redi()}</div>
    // <div className="flex min-h-screen items-center justify-center p-6">
    //   <main className="flex w-full max-w-md flex-col gap-4 rounded border p-6">
    //     <h1 className="text-2xl font-semibold">Auth Demo</h1>
    //     <p className="text-sm text-zinc-600">
    //       Register a user, then login and view your dashboard.
    //     </p>

    //     <div className="flex gap-3">
    //       <Link
    //         href="/register"
    //         className="rounded bg-black px-4 py-2 text-white"
    //       >
    //         Register
    //       </Link>
    //       <Link href="/login" className="rounded border px-4 py-2">
    //         Login
    //       </Link>
    //     </div>
    //   </main>
    // </div>
  );
}
