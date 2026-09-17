"use client";

import { useState, FormEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { LoginFormData } from "@/types/auth";
import { loginUser } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    name: "",
    password: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await loginUser(formData);

      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Invalid details");
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-xl border border-gray-300 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-bold tracking-wide text-gray-800">
          LOGIN
        </h1>

        {error && (
          <p className="mb-4 text-center text-sm font-semibold text-red-500">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            name="name"
            placeholder="NAME"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-400 p-2.5 text-sm focus:border-black focus:outline-none"
          />

          <input
            type="password"
            name="password"
            placeholder="PASSWORD"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-gray-400 p-2.5 text-sm focus:border-black focus:outline-none"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 rounded-lg border border-gray-800 py-2.5 text-sm font-semibold tracking-wider text-gray-800 transition hover:bg-gray-100 disabled:opacity-50"
          >
            {isLoading ? "LOGGING IN..." : "SUBMIT"}
          </button>
        </form>
      </div>
    </main>
  );
}