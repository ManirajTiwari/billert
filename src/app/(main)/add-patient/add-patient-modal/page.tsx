"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createPatient, PatientData } from "./action";

export default function AddPatientModalPage() {
  const router = useRouter();

  // Explicitly type formData using PatientData from action.ts
  const [formData, setFormData] = useState<PatientData>({
    name: "",
    age: "",
    gender: "",
    phoneNumber: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phoneNumber.trim()) return;

    setLoading(true);
    setError(null);

    // Pass validated/formatted data to Server Action
    const result = await createPatient({
      ...formData,
      age: formData.age ? Number(formData.age) : "", // Parse age to number if needed by schema
    });

    setLoading(false);

    if (result.success) {
      router.back();
    } else {
      setError(result.error || "Something went wrong.");
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-gray-800 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b-2 border-gray-100 pb-3">
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Add Patient
          </h1>
          <button
            type="button"
            onClick={() => router.back()}
            className="font-bold text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
              Name
            </label>
            <input
              type="text"
              required
              placeholder="Enter patient name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full rounded-xl border-2 border-gray-800 p-2.5 font-medium text-gray-900 focus:outline-none"
            />
          </div>

          {/* Age Field */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
              Age
            </label>
            <input
              type="number"
              min="0"
              max="150"
              required
              placeholder="Enter age"
              value={formData.age}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
              className="w-full rounded-xl border-2 border-gray-800 p-2.5 font-medium text-gray-900 focus:outline-none"
            />
          </div>

          {/* Gender Field */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
              Gender
            </label>
            <select
              required
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
              className="w-full rounded-xl border-2 border-gray-800 bg-white p-2.5 font-medium text-gray-900 focus:outline-none"
            >
              <option value="" disabled>
                Select gender
              </option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Phone Number Field */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              required
              placeholder="Enter phone number"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              className="w-full rounded-xl border-2 border-gray-800 p-2.5 font-medium text-gray-900 focus:outline-none"
            />
          </div>

          {/* Save & Cancel Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-xl border-2 border-gray-800 bg-white px-4 py-2.5 text-sm font-bold text-gray-800 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl border-2 border-gray-800 bg-gray-800 px-6 py-2.5 text-sm font-bold uppercase text-white transition hover:bg-gray-900 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}