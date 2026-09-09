"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
  careLevel: string;
  location: string;
  isFixedTime: boolean;
  preferredStart?: string;
  preferredEnd?: string;
  requiredHours: number;
}

export default function ClientsPage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<"directory" | "add">("directory");

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [careLevel, setCareLevel] = useState("Standard Care");
  const [location, setLocation] = useState("Stockholm");
  const [scheduleType, setScheduleType] = useState<"fixed" | "flexible">("fixed");
  const [preferredStart, setPreferredStart] = useState("09:00");
  const [preferredEnd, setPreferredEnd] = useState("12:00");
  const [requiredHours, setRequiredHours] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (currentView === "directory") {
      fetchClients();
    }
  }, [currentView]);

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

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter Client Name first!");
      return;
    }

    const isFixed = scheduleType === "fixed";
    const payload = {
      name,
      careLevel,
      location,
      isFixedTime: isFixed,
      preferredStart: isFixed ? preferredStart : null,
      preferredEnd: isFixed ? preferredEnd : null,
      requiredHours: Number(requiredHours),
    };

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setName("");
        setCareLevel("Standard Care");
        setLocation("Stockholm");
        setScheduleType("fixed");
        setCurrentView("directory");
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
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* ADD CLIENT VIEW */}
      {currentView === "add" ? (
        <div className="max-w-xl mx-auto space-y-4">
          {/* Main Page Button */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            ← Go to Main Page
          </button>

          <form
            onSubmit={handleSaveClient}
            className="bg-gray-100 p-6 rounded-xl border border-teal-100 shadow-sm space-y-4"
          >
            <h3 className="text-base font-bold text-stone-800 border-b border-teal-800 rounded-2xl bg-teal-400 p-2.5 text-center">
              Add New Care Client
            </h3>

            {/* Client Name */}
            <div className="text-left space-y-2">
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Client Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lars Olsson"
                className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                required
              />
            </div>

            {/* Care Level */}
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

            {/* Schedule Type Selection */}
            <div className="text-left space-y-2">
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Schedule Type
              </label>
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as "fixed" | "flexible")}
                className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="fixed">Fixed Time Window (Specific Start & End Time)</option>
                <option value="flexible">Flexible Visit Hours</option>
              </select>
            </div>

            {/* Time Window Fields */}
            {scheduleType === "fixed" ? (
              <div className="grid grid-cols-2 gap-2 text-left bg-stone-50 p-3 rounded-lg border border-stone-200">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Preferred Start
                  </label>
                  <input
                    type="time"
                    value={preferredStart}
                    onChange={(e) => setPreferredStart(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                    Preferred End
                  </label>
                  <input
                    type="time"
                    value={preferredEnd}
                    onChange={(e) => setPreferredEnd(e.target.value)}
                    className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-stone-500 italic text-left pl-1">
                * Client is set to Flexible Schedule without fixed time window constraint.
              </p>
            )}

            {/* Required Hours / Week */}
            <div className="text-left space-y-2">
              <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                Required Hours / Week
              </label>
              <input
                type="number"
                value={requiredHours}
                onChange={(e) => setRequiredHours(Number(e.target.value))}
                className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
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
                onClick={() => setCurrentView("directory")}
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
              >
                Go to Clients
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* DIRECTORY VIEW */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-teal-600 text-white p-5 rounded-xl shadow-md gap-4">
            <div>
              <h2 className="text-lg font-bold">Clients Directory</h2>
              <p className="text-xs text-teal-100 mt-0.5">Manage registered care clients</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-3 py-2 rounded-lg transition cursor-pointer border border-teal-500 shadow-sm"
              >
                ← Go to Main Page
              </button>

              <button
                onClick={() => setCurrentView("add")}
                className="bg-white text-teal-900 font-bold text-xs px-4 py-2 rounded-lg hover:bg-teal-50 transition cursor-pointer shadow-sm"
              >
                + Add New Client
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider border-b pb-2">
              Current Clients Directory ({clients.length})
            </h4>

            {loading ? (
              <p className="text-xs text-stone-500 text-center py-6">Loading clients...</p>
            ) : clients.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-6">No clients found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-600 font-bold uppercase border-b border-stone-200">
                    <tr>
                      <th className="p-2 w-16 text-center">ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">Care Level</th>
                      <th className="p-2">Schedule / Hours</th>
                      <th className="p-2">Location</th>
                      <th className="p-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {clients.map((client) => {
                      const isFixed = client.isFixedTime ?? Boolean(client.preferredStart && client.preferredEnd);

                      return (
                        <tr key={client.id} className="hover:bg-teal-50/40 transition-colors">
                          <td className="p-2 font-mono text-teal-700 font-bold text-center">
                            {client.id}
                          </td>
                          <td className="p-2 font-semibold text-stone-900">{client.name}</td>
                          <td className="p-2">{client.careLevel}</td>
                          <td className="p-2">
                            {isFixed && client.preferredStart && client.preferredEnd ? (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-mono text-[11px]">
                                <span className="font-sans font-bold text-[10px] uppercase">Fixed:</span>
                                {client.preferredStart} - {client.preferredEnd} ({client.requiredHours}h/wk)
                              </span>
                            ) : (
                              <span className="inline-block bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-md font-mono text-[11px]">
                                Flexible ({client.requiredHours}h/wk)
                              </span>
                            )}
                          </td>
                          <td className="p-2">{client.location}</td>
                          <td className="p-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleDelete(client.id, client.name)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}