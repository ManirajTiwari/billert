"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { getPatients, createPatient } from "./action";

interface Patient {
  id: string;
  ptid?: string | null;
  name: string;
  age: number;
  gender: string;
  phoneNumber: string;
  createdAt?: Date | string;
}

export default function PatientPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    phoneNumber: "",
  });

  const loadPatients = async () => {
    setLoading(true);
    const result = await getPatients();
    if (result.success && result.data) {
      setPatients(result.data as Patient[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = patients.filter((patient) => {
    const q = searchQuery.toLowerCase();
    return (
      patient.name.toLowerCase().includes(q) ||
      patient.phoneNumber.includes(q) ||
      (patient.ptid && patient.ptid.toLowerCase().includes(q))
    );
  });

  const handleAddPatient = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phoneNumber.trim()) return;

    setSaving(true);
    setError(null);

    const result = await createPatient(formData);

    setSaving(false);

    if (result.success && result.data) {
      setPatients((prev) => [result.data as Patient, ...prev]);
      setFormData({ name: "", age: "", gender: "", phoneNumber: "" });
      setIsModalOpen(false);
    } else {
      setError(result.error || "Failed to save patient.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        Patient
      </h1>

      {/* Top Bar: Search and Add Patient Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, phone, or PTID (e.g. 01)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border-2 border-gray-800 bg-white p-3 font-medium text-gray-900 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsModalOpen(true);
          }}
          className="whitespace-nowrap rounded-2xl border-2 border-gray-800 bg-gray-800 px-6 py-3 font-bold text-white transition hover:bg-gray-900"
        >
          Add Patient
        </button>
      </div>

      {/* Patients List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border-2 border-gray-200 bg-white p-8 text-center text-sm font-semibold text-gray-400">
            Loading patients...
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-8 text-center text-sm font-semibold text-gray-400">
            {searchQuery
              ? "No patients matching your search."
              : "No patients added yet. Click 'Add Patient' to create one."}
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div
              key={patient.id}
              className="grid grid-cols-12 items-center rounded-2xl border-2 border-gray-800 bg-white p-4 font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50"
            >
              <div className="col-span-5 flex flex-col">
                <div className="flex items-center gap-2">
                  {patient.ptid && (
                    <span className="rounded-lg border border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
                      #{patient.ptid}
                    </span>
                  )}
                  <span className="text-base font-bold text-gray-900">
                    {patient.name}
                  </span>
                </div>
                {(patient.age || patient.gender) && (
                  <span className="text-xs font-normal text-gray-500">
                    {[patient.age ? `${patient.age} yrs` : null, patient.gender]
                      .filter(Boolean)
                      .join(" • ")}
                  </span>
                )}
              </div>

              <div className="col-span-5 text-sm text-gray-600">
                {patient.phoneNumber}
              </div>

              <div className="col-span-2 text-right">
                <Link
                  href={`/add-patient/about_patient?id=${patient.id}`}
                  className="inline-block rounded-xl border-2 border-gray-800 bg-white px-4 py-1.5 text-xs font-bold uppercase transition hover:bg-gray-100"
                >
                  Select
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Patient Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border-2 border-gray-800 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between border-b-2 border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-900">Add Patient</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleAddPatient} className="space-y-4">
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
                  className="w-full rounded-xl border-2 border-gray-800 p-2.5 font-medium focus:outline-none"
                />
              </div>

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
                  className="w-full rounded-xl border-2 border-gray-800 p-2.5 font-medium focus:outline-none"
                />
              </div>

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
                  className="w-full rounded-xl border-2 border-gray-800 p-2.5 font-medium focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border-2 border-gray-800 bg-white px-4 py-2 text-sm font-bold text-gray-800 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl border-2 border-gray-800 bg-gray-800 px-6 py-2 text-sm font-bold uppercase text-white transition hover:bg-gray-900 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}