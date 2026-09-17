import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
        Welcome to Billert
      </h1>
      <p className="mt-3 text-lg text-gray-600">
        Pharmacy Billing & Patient Management System
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-xl border-2 border-gray-800 bg-white px-6 py-2.5 font-bold text-gray-800 transition hover:bg-gray-100"
        >
          LOGIN
        </Link>
        <Link
          href="/signup"
          className="rounded-xl border-2 border-gray-800 bg-gray-800 px-6 py-2.5 font-bold text-white transition hover:bg-gray-900"
        >
          GET STARTED
        </Link>
      </div>
    </div>
  );
}