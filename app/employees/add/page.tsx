"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddEmployeePage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [role, setRole] = useState("Care Assistant");
  const [location, setLocation] = useState("Stockholm");
  const [scheduleType, setScheduleType] = useState<"fixed" | "flexible">("fixed");
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("15:00");
  const [maxHours, setMaxHours] = useState(40);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter Employee Name first!");
      return;
    }

    const isFixed = scheduleType === "fixed";
    const payload = {
      name,
      role,
      location,
      isFixedTime: isFixed,
      shiftStart: isFixed ? shiftStart : null,
      shiftEnd: isFixed ? shiftEnd : null,
      maxHours: Number(maxHours),
    };

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Save hone ke baad seedha employees directory par redirect ho jaye ga
        router.push("/employees");
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
    <div className="max-w-4xl mx-auto p-4 space-y-6 bg-stone-50 min-h-screen">
      <div className="max-w-xl mx-auto space-y-4">
      <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/employees")}
            className="bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 p-3 rounded-2xl h-8 flex items-center justify-center transition-colors cursor-pointer shadow-sm border border-slate-200 text-sm font-bold"
            title="Close"
          >
           Close  ✕
          </button>
        </div>

        <form
          onSubmit={handleSaveEmployee}
          className="bg-teal-50 p-6 rounded-xl border border-slate-200 shadow-sm space-y-4"
        >
          <h3 className="text-base font-bold bg-teal-50 text-teal-700 border-b border-slate-200 rounded-2xl p-2.5 text-center">
            Add New Employee
          </h3>

          {/* Employee Name */}
          <div className="text-left  space-y-2">
            <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
              Employee Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Anna Lindqvist"
              className="w-full p-2 border border-emerald-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-stone-900"
              required
            />
          </div>

          {/* Role */}
          <div className="text-left space-y-2">
            <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border border-emerald-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-stone-900"
            >
              <option value="Care Assistant">Care Assistant</option>
              <option value="Senior Care Worker">Senior Care Worker</option>
              <option value="Registered Nurse (RN)">Registered Nurse (RN)</option>
              <option value="Support Worker">Support Worker</option>
            </select>
          </div>

          {/* Location */}
          <div className="text-left space-y-2">
            <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
              Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full p-2 border border-emerald-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-stone-900"
            >
              <option value="Stockholm">Stockholm</option>
              <option value="Solna">Solna</option>
              <option value="Kista">Kista</option>
              <option value="Täby">Täby</option>
            </select>
          </div>

          {/* Schedule Type Selection */}
          <div className="text-left space-y-2">
            <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
              Schedule Type
            </label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as "fixed" | "flexible")}
              className="w-full p-2 border border-emerald-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-stone-900"
            >
              <option value="fixed">Fixed Shift (Specific Start & End Time)</option>
              <option value="flexible">Flexible Hours</option>
            </select>
          </div>

          {/* Shift Time Fields */}
          {scheduleType === "fixed" ? (
            <div className="grid grid-cols-2 gap-2 text-left bg-stone-50 p-3 rounded-lg border border-stone-200">
              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
                  Shift Start
                </label>
                <input
                  type="time"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                  className="w-full p-2 border border-emerald-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
                  Shift End
                </label>
                <input
                  type="time"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                  className="w-full p-2 border border-emerald-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-stone-900"
                />
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-emerald-700 italic text-left pl-1">
              * Employee is set to Flexible Schedule without fixed timing constraint.
            </p>
          )}

          {/* Max Weekly Hours */}
          <div className="text-left space-y-2">
            <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
              Max Hours / Week
            </label>
            <input
              type="number"
              value={maxHours}
              onChange={(e) => setMaxHours(Number(e.target.value))}
              className="w-full p-2 border border-emerald-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 bg-white text-stone-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-white hover:bg-slate-50 text-slate-800 font-bold py-2 rounded-lg text-xs transition-colors border border-slate-200 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Employee Detail"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/employees")}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
            >
              Go to Employees
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}