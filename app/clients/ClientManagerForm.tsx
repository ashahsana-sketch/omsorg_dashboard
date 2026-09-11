"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
  careLevel: string;
  requiredHours: number;
  location: string;
  isFixedTime: boolean;
  preferredStart?: string;
  preferredEnd?: string;
}

export default function ClientManagerForm() {
  const router = useRouter();

  // Client Form State
  const [name, setName] = useState("");
  const [careLevel, setCareLevel] = useState("Standard Care");
  const [location, setLocation] = useState("Stockholm");
  const [requiredHours, setRequiredHours] = useState(10);
  const [scheduleType, setScheduleType] = useState<"fixed" | "flexible">("fixed");
  const [preferredStart, setPreferredStart] = useState("09:00");
  const [preferredEnd, setPreferredEnd] = useState("12:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Directory State
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial clients list
  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Save Client Function (POST)
  const saveClientData = async (e: React.FormEvent, shouldRedirect: boolean = false) => {
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
        const data = await res.json();
        
        const newClient: Client = data.client || {
          id: data.id || String(Date.now()),
          ...payload,
        };

        setClients((prev) => [...prev, newClient]);

        // Reset Form Fields
        setName("");
        setCareLevel("Standard Care");
        setLocation("Stockholm");
        setRequiredHours(5);
        setScheduleType("fixed");
        setPreferredStart("09:00");
        setPreferredEnd("12:00");

        if (shouldRedirect) {
          router.push("/clients");
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

  // Delete Client Function (DELETE)
  const handleDelete = async (id: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete ${clientName}?`)) return;

    try {
      const res = await fetch(`/api/clients?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setClients((prev) => prev.filter((client) => client.id !== id));
      } else {
        alert("Failed to delete client.");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Network Error: Could not delete client.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* 1. Add Client Form */}
      <form
        onSubmit={(e) => saveClientData(e, false)}
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 max-w-2xl mx-auto"
      >
        <h3 className="text-base font-bold text-teal-700 border-b border-slate-200 rounded-2xl bg-slate-50 p-2.5 text-center">
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
            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
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
            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
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
            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
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
            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
          >
            <option value="fixed">Fixed Time Window (Specific Start & End Time)</option>
            <option value="flexible">Flexible Visit Time</option>
          </select>
        </div>

        {/* Preferred Time Window (Fixed Only) */}
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
                className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
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
                className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
              />
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 italic text-left pl-1">
            * Client visit timing is flexible.
          </p>
        )}

        {/* Required Hours / Week */}
        <div className="text-left space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
            Required Hours / Week
          </label>
          <input
            type="number"
            value={requiredHours}
            onChange={(e) => setRequiredHours(Number(e.target.value))}
            className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 bg-white"
          />
        </div>

        {/* Action Buttons */}
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
            Cancel/Go to Clients Page
          </button>
        </div>
      </form>

         </div>
  );
}