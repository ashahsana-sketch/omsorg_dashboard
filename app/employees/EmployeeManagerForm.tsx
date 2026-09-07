"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EmployeeManagerForm() {
  const router = useRouter();

  // Employee State
  const [name, setName] = useState("");
  const [role, setRole] = useState("Care Assistant");
  const [location, setLocation] = useState("Stockholm");
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("15:00");
  const [maxHours, setMaxHours] = useState(40);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Save Employee Function
  const saveEmployeeData = async (e: React.MouseEvent, shouldRedirect: boolean) => {
    e.preventDefault(); // Form reload roknay ke liye

    if (!name.trim()) {
      alert("Please enter Employee Name first!");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          role,
          location,
          shiftStart,
          shiftEnd,
          maxHours: Number(maxHours),
        }),
      });

      if (res.ok) {
        // Reset Form Fields
        setName("");
        setRole("Care Assistant");
        setLocation("Stockholm");
        setShiftStart("09:00");
        setShiftEnd("15:00");
        setMaxHours(40);

        if (shouldRedirect) {
          window.location.assign("/employees");
        }
      } else {
        alert("API Error: Data save nahi ho saka.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Network Error: API connect nahi ho saki.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="bg-gray-100 p-6 rounded-xl border border-teal-100 shadow-sm space-y-4 max-w-md mx-auto">
      <h3 className="text-base font-bold text-stone-800 border-b border-teal-800 rounded-2xl bg-teal-400 p-2.5">
        Add New Employee
      </h3>

      {/* Employee Name */}
      <div className="text-left space-y-2">
        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
          Employee Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Anna Lindqvist"
          className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          required
        />
      </div>

      {/* Role */}
      <div className="text-left space-y-2">
        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="Care Assistant">Care Assistant</option>
          <option value="Senior Carer">Senior Carer</option>
          <option value="Nurse">Nurse</option>
        </select>
      </div>

      {/* Location */}
      <div className="text-left space-y-2">
        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
          Location
        </label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="Stockholm">Stockholm</option>
          <option value="Solna">Solna</option>
          <option value="Kista">Kista</option>
          <option value="Täby">Täby</option>
        </select>
      </div>

      {/* Shift Time */}
      <div className="grid grid-cols-2 gap-2 text-left">
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
            Shift Start
          </label>
          <input
            type="time"
            value={shiftStart}
            onChange={(e) => setShiftStart(e.target.value)}
            className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
            Shift End
          </label>
          <input
            type="time"
            value={shiftEnd}
            onChange={(e) => setShiftEnd(e.target.value)}
            className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>
      </div>

      {/* Max Weekly Hours */}
      <div className="text-left space-y-2">
        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
          Max Hours / Week
        </label>
        <input
          type="number"
          value={maxHours}
          onChange={(e) => setMaxHours(Number(e.target.value))}
          className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        {/* Button 1: Save Only */}
        <button
          type="button"
          onClick={(e) => saveEmployeeData(e, false)}
          disabled={isSubmitting}
          className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2 rounded-lg text-xs transition-colors border border-stone-300 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Employee Detail"}
        </button>

        {/* Button 2: Save and Navigate */}
        <button
          
        type="button"
          onClick={() => router.push("/employees")}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
          
          Cancel / Go to Employees
        </button>
      </div>
    </form>
  );
}