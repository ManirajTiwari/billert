"use client";

import { useState, useEffect, ChangeEvent } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";
import { updateUserProfile } from "@/app/actions/user";

export default function DashboardPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubscriptionActive, setIsSubscriptionActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    pharmacyName: "",
    phoneNumber: "",
    secondaryPhone: "",
    address: "",
    currencyName: "",
    currencySymbol: "",
    password: "",
    logoUrl: "",
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchUser() {
      const user = await getCurrentUser();
      if (isMounted) {
        if (user) {
          setFormData({
            email: user.email || "",
            name: user.name || "",
            pharmacyName: user.pharmacyName || "",
            phoneNumber: user.phoneNumber || "",
            secondaryPhone: user.secondaryPhone || "",
            address: user.address || "",
            currencyName: user.currencyName || "US Dollar",
            currencySymbol: user.currencySymbol || "$",
            password: "",
            logoUrl: user.logoUrl || "",
          });
          setIsSubscriptionActive(user.subscriptionActive || false);
        } else {
          setMessage("No active session found. Please log in first!");
        }
        setLoading(false);
      }
    }

    fetchUser();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleEdit = async () => {
    if (isEditing) {
      if (!formData.email) {
        setMessage("Cannot save: No user email associated with this session.");
        return;
      }

      setSaving(true);
      setMessage(null);

      const payload: Record<string, any> = {
        name: formData.name,
        pharmacyName: formData.pharmacyName,
        phoneNumber: formData.phoneNumber,
        secondaryPhone: formData.secondaryPhone,
        address: formData.address,
        currencyName: formData.currencyName,
        currencySymbol: formData.currencySymbol,
        logoUrl: formData.logoUrl,
        subscriptionActive: isSubscriptionActive,
      };

      if (formData.password.trim() !== "") {
        payload.password = formData.password;
      }

      const res = await updateUserProfile(formData.email, payload);
      setSaving(false);

      if (res.success) {
        setMessage("Profile updated successfully!");
        setIsEditing(false);
        setFormData((prev) => ({ ...prev, password: "" }));
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage(res.error || "Failed to save changes.");
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleCancelSubscription = async () => {
    if (!formData.email) return;
    setSaving(true);
    const res = await updateUserProfile(formData.email, {
      subscriptionActive: false,
    });
    setSaving(false);
    if (res.success) {
      setIsSubscriptionActive(false);
      setMessage("Subscription canceled successfully.");
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-medium text-gray-600">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl border-2 border-gray-800 bg-white p-8 shadow-sm">
      {message && (
        <div className="mb-4 rounded-xl border border-gray-800 bg-gray-100 p-3 text-center text-sm font-semibold text-gray-800">
          {message}
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <button
          type="button"
          onClick={handleToggleEdit}
          disabled={saving}
          className="rounded-xl border-2 border-gray-800 px-6 py-2 text-lg font-bold tracking-wide transition hover:bg-gray-100 disabled:opacity-50"
        >
          {saving ? "SAVING..." : isEditing ? "SAVE" : "EDIT"}
        </button>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-12">
        {/* Logo / Image Picker */}
        <div className="flex items-center justify-center py-6 md:col-span-4">
          <label
            className={`flex h-44 w-44 flex-col items-center justify-center overflow-hidden rounded-full border-2 border-gray-800 bg-gray-50 ${
              isEditing ? "cursor-pointer hover:bg-gray-100" : "cursor-not-allowed"
            }`}
          >
            {formData.logoUrl ? (
              <img
                src={formData.logoUrl}
                alt="Pharmacy Logo"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-center font-medium text-gray-600">
                upload
                <br />
                icon
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={!isEditing}
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Profile Inputs */}
        <div className="space-y-4 md:col-span-8">
          <div>
            <input
              type="text"
              name="name"
              placeholder="NAME"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full max-w-xs rounded-xl border-2 border-gray-800 p-2.5 font-medium disabled:bg-gray-50 focus:outline-none"
            />
          </div>

          <div>
            <input
              type="text"
              name="pharmacyName"
              placeholder="PHARMACY NAME"
              value={formData.pharmacyName}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full max-w-md rounded-xl border-2 border-gray-800 p-2.5 font-medium disabled:bg-gray-50 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <input
              type="tel"
              name="phoneNumber"
              placeholder="PHONE NUMBER 1"
              value={formData.phoneNumber}
              onChange={handleChange}
              disabled={!isEditing}
              className="min-w-[200px] flex-1 rounded-xl border-2 border-gray-800 p-2.5 font-medium disabled:bg-gray-50 focus:outline-none"
            />
            <input
              type="tel"
              name="secondaryPhone"
              placeholder="PHONE NUMBER 2"
              value={formData.secondaryPhone}
              onChange={handleChange}
              disabled={!isEditing}
              className="min-w-[200px] flex-1 rounded-xl border-2 border-gray-800 p-2.5 font-medium disabled:bg-gray-50 focus:outline-none"
            />
          </div>

          <div>
            <input
              type="text"
              name="address"
              placeholder="ADDRESS"
              value={formData.address}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full rounded-xl border-2 border-gray-800 p-2.5 font-medium disabled:bg-gray-50 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              name="currencyName"
              placeholder="CURRENCY NAME"
              value={formData.currencyName}
              onChange={handleChange}
              disabled={!isEditing}
              className="min-w-[180px] flex-1 rounded-xl border-2 border-gray-800 p-2.5 font-medium disabled:bg-gray-50 focus:outline-none"
            />
            <input
              type="text"
              name="currencySymbol"
              placeholder="SYMBOL"
              value={formData.currencySymbol}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-32 rounded-xl border-2 border-gray-800 p-2.5 font-medium disabled:bg-gray-50 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <input
              type="password"
              name="password"
              placeholder={isEditing ? "NEW PASSWORD (OPTIONAL)" : "••••••••"}
              value={formData.password}
              onChange={handleChange}
              disabled={!isEditing}
              className="w-full max-w-xs rounded-xl border-2 border-gray-800 p-2.5 font-medium disabled:bg-gray-50 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      <div className="mt-10 flex items-center justify-between rounded-xl border-2 border-gray-800 p-4">
        <div className="text-lg font-bold uppercase tracking-wide">
          SUBSCRIPTION:{" "}
          <span className={isSubscriptionActive ? "text-green-600" : "text-red-600"}>
            {isSubscriptionActive ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>

        {isSubscriptionActive ? (
          <button
            type="button"
            onClick={handleCancelSubscription}
            disabled={saving}
            className="rounded-xl border-2 border-gray-800 px-8 py-2 text-lg font-bold uppercase transition hover:bg-gray-100 disabled:opacity-50"
          >
            CANCEL
          </button>
        ) : (
          <Link
            href="/dashboard/payment"
            className="rounded-xl border-2 border-gray-800 px-8 py-2 text-lg font-bold uppercase transition hover:bg-gray-100"
          >
            BUY
          </Link>
        )}
      </div>
    </div>
  );
}
