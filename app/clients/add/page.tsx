"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddClientPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [careLevel, setCareLevel] = useState("Standard Care");
  const [location, setLocation] = useState("Stockholm");
  const [requiredHours, setRequiredHours] = useState(5);
  const [scheduleType, setScheduleType] = useState<"fixed" | "flexible">("fixed");
  const [preferredStart, setPreferredStart] = useState("09:00");
  const [preferredEnd, setPreferredEnd] = useState("12:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveClientData = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter a Client Name first!");
      return;
    }

    const isFixed = scheduleType === "fixed";
    const payload = {
      name,
      careLevel,
      requiredHours: Number(requiredHours),
      location,
      isFixedTime: isFixed,
      preferredStart: isFixed ? preferredStart : null,
      preferredEnd: isFixed ? preferredEnd : null,
    };

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Data save hone ke baad seedha clients directory par redirect ho jaye ga
        router.push("/clients");
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
            onClick={() => router.push("/clients")}
            className="bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 p-3 rounded-2xl h-8 flex items-center justify-center transition-colors cursor-pointer shadow-sm border border-slate-200 text-sm font-bold"
            title="Close"
          >
           Close  ✕
          </button>
        </div>
      <form
        onSubmit={saveClientData}
        className="bg-teal-50/60 p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-2xl mx-auto"
      >
        <h3 className="text-base font-bold text-teal-700 border-b border-slate-200 rounded-2xl bg-teal-50/60 p-2.5 text-center">
          Add New Care Client
        </h3>

        {/* Client Name */}
        <div className="text-left space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
            Client Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lars Olsson"
            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white text-stone-900"
            required
          />
        </div>

        {/* Care Level */}
        <div className="text-left space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
            Care Need Level
          </label>
          <select
            value={careLevel}
            onChange={(e) => setCareLevel(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white text-stone-900"
          >
            <option value="Basic care">Basic care</option>
            <option value="Standard Care">Standard Care</option>
            <option value="High Care">High Care</option>
          </select>
        </div>

        {/* Location */}
        <div className="text-left space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
            Location
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white text-stone-900"
          >
            <option value="Stockholm">Stockholm</option>
            <option value="Solna">Solna</option>
            <option value="Kista">Kista</option>
            <option value="Täby">Täby</option>
          </select>
        </div>

        {/* Schedule Type Selection */}
        <div className="text-left space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
            Visit Schedule Type
          </label>
          <select
            value={scheduleType}
            onChange={(e) => setScheduleType(e.target.value as "fixed" | "flexible")}
            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white text-stone-900"
          >
            <option value="fixed">Fixed Time Window (Specific Start & End Time)</option>
            <option value="flexible">Flexible Visit Time</option>
          </select>
        </div>

        {/* Preferred Time Window */}
        {scheduleType === "fixed" ? (
          <div className="grid grid-cols-2 gap-2 text-left bg-stone-50 p-3 rounded-lg border border-stone-200">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                Preferred Start
              </label>
              <input
                type="time"
                value={preferredStart}
                onChange={(e) => setPreferredStart(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                Preferred End
              </label>
              <input
                type="time"
                value={preferredEnd}
                onChange={(e) => setPreferredEnd(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white text-stone-900"
              />
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic text-left pl-1">
            * Client visit timing is flexible.
          </p>
        )}

        {/* Required Hours */}
        <div className="text-left space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
            Required Hours / day
          </label>
          <input
            type="number"
            value={requiredHours}
            onChange={(e) => setRequiredHours(Number(e.target.value))}
            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white text-stone-900"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2 rounded-lg text-xs transition-colors border border-stone-300 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Client Detail"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/clients")}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
          >
            Go to Clients List
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}