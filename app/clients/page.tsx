"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  careLevel: string;
  location?: string;
  shiftStart?: string;
  shiftEnd?: string;
  requiredHours?: number;
}

// Automatically calculate shift hours (e.g. 09:00 to 15:00 = 6 Hours)
function calculateHours(startTime: string = "09:00", endTime: string = "15:00"): number {
  const [startH] = startTime.split(":").map(Number);
  const [endH] = endTime.split(":").map(Number);

  if (endH >= startH) {
    return endH - startH;
  } else {
    return 24 - startH + endH;
  }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [careLevel, setCareLevel] = useState("Standard Care");
  const [location, setLocation] = useState("Stockholm");
  const [shiftStart, setShiftStart] = useState("09:00");
  const [shiftEnd, setShiftEnd] = useState("15:00");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Clients API
  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients");
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Save Client
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSaving(true);

    try {
      const computedHours = calculateHours(shiftStart, shiftEnd);

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          careLevel,
          location,
          shiftStart,
          shiftEnd,
          requiredHours: computedHours,
        }),
      });

      if (res.ok) {
        setName("");
        setCareLevel("Standard Care");
        setLocation("Stockholm");
        setShiftStart("09:00");
        setShiftEnd("15:00");
        await fetchClients(); // Auto refresh list
      }
    } catch (error) {
      console.error("Error saving client:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // SABSE LATEST CLIENT PEHLE DIKHAYEGA
  const latestClientsFirst = [...clients].reverse();

  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-800">
              Clients Management
            </h1>
            <p className="text-xs text-stone-500">
              Add new client details & view registered client directory
            </p>
          </div>

          <span className="bg-teal-50 text-teal-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-teal-200/60">
            Total Clients: {clients.length}
          </span>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h4 className="text-sm font-bold text-stone-800 border-b border-stone-100 pb-2">
            Add New Client
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Client Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lars Olsson"
                className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Care Need Level
              </label>
              <select
                value={careLevel}
                onChange={(e) => setCareLevel(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Basic Assistance">Basic Assistance</option>
                <option value="Standard Care">Standard Care</option>
                <option value="High Dependency">High Dependency</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Location
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Stockholm">Stockholm</option>
                <option value="Solna">Solna</option>
                <option value="Kista">Kista</option>
                <option value="Täby">Täby</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={shiftStart}
                  onChange={(e) => setShiftStart(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(e.target.value)}
                  className="w-full p-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Saving Client..." : "💾 Save Client Details"}
          </button>
        </form>

        {/* Render Clients List */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
          <h4 className="text-sm font-bold text-stone-800 border-b border-stone-100 pb-2">
            Clients List ({clients.length})
          </h4>

          {isLoading ? (
            <p className="text-xs text-stone-400 text-center py-6">Loading clients...</p>
          ) : latestClientsFirst.length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-6">No clients added yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-100px overflow-y-auto pr-1">
              {latestClientsFirst.map((cli) => {
                const start = cli.shiftStart || "09:00";
                const end = cli.shiftEnd || "15:00";
                const shiftHours = calculateHours(start, end);

                return (
                  <div
                    key={cli.id}
                    className="bg-stone-50/60 p-3.5 rounded-xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-teal-200 transition-colors"
                  >
                    {/* Left Column */}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-800 text-sm">{cli.name}</span>
                        <span className="bg-white text-stone-600 text-[10px] font-semibold px-2 py-0.5 rounded border border-stone-200">
                          {cli.careLevel}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        📍 Location: <span className="font-medium text-stone-700">{cli.location || "Stockholm"}</span>
                      </p>
                    </div>

                    {/* Right Column (Time & Calculated Hours) */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-stone-200/60 pt-2 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="text-stone-400 block text-[9px] uppercase font-bold">
                          Preferred Time
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/50">
                          ⏰ {start} – {end}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-stone-400 block text-[9px] uppercase font-bold">
                          Required Hours
                        </span>
                        <span className="font-extrabold text-teal-700 text-xs block">
                          {shiftHours} Hours / Day
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}