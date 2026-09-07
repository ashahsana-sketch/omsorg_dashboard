"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ClientManagerForm() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [careLevel, setCareLevel] = useState("Standard Care");
  const [location, setLocation] = useState("Stockholm");
  const [requiredHours, setRequiredHours] = useState(10);
  const [preferredTime, setPreferredTime] = useState("09:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveClientData = async (e: React.MouseEvent, shouldRedirect: boolean) => {
    e.preventDefault(); // Stop page reload

    if (!name.trim()) {
      alert("Please enter a Client Name first!");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          careLevel,
          requiredHours: Number(requiredHours),
          location,
          preferredTime,
        }),
      });

      if (res.ok) {
        setName("");
        setCareLevel("Standard Care");
        setLocation("Stockholm");
        setRequiredHours(3);
        setPreferredTime("09:00");

        if (shouldRedirect) {
          // Guaranteed hard navigation
          window.location.assign("/clients");
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
        Add New Care Client
      </h3>

      <div className="text-left space-y-2">
        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
          Client Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Lars Olsson"
          className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          required
        />
      </div>

      <div className="text-left space-y-2">
        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
          Care Need Level
        </label>
        <select
          value={careLevel}
          onChange={(e) => setCareLevel(e.target.value)}
          className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
        >
          <option value="Basic Assistance">Basic Assistance</option>
          <option value="Standard Care">Standard Care</option>
          <option value="High Dependency">High Dependency</option>
        </select>
      </div>

      <div className="text-left space-y-2">
        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
          Preferred Visit Time
        </label>
        <input
          type="time"
          value={preferredTime}
          onChange={(e) => setPreferredTime(e.target.value)}
          className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div className="text-left space-y-2">
        <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
          Required Hours / Week
        </label>
        <input
          type="number"
          value={requiredHours}
          onChange={(e) => setRequiredHours(Number(e.target.value))}
          className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

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

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <button
          type="button"
          onClick={(e) => saveClientData(e, false)}
          disabled={isSubmitting}
          className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-2 rounded-lg text-xs transition-colors border border-stone-300 cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Client Detail"}
        </button>

      
        <button
    type="button"
    onClick={() => router.push("/clients")}
    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer disabled:opacity-50"
  >
    Cancel / Go to Clients
  </button>
      </div>
    </form>
  );
}