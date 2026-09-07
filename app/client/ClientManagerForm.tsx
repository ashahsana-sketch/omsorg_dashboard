"use client";

import { useState, useEffect } from "react";

interface Client {
  id: string;
  name: string;
  careLevel: string;
  location: string;
  requiredHours: number;
}

export default function ClientManagerForm() {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [careLevel, setCareLevel] = useState("Standard Care");
  const [location, setLocation] = useState("Stockholm");
  const [requiredHours, setRequiredHours] = useState(10);

  useEffect(() => {
    fetch("/api/clients")
      .then((res) => res.json())
      .then((data) => setClients(data))
      .catch(() => setClients([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          careLevel,
          requiredHours: Number(requiredHours),
          location,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setClients([...clients, data.client]);
        setName("");
        setCareLevel("Standard Care");
        setLocation("Stockholm");
        setRequiredHours(10);
      } else {
        console.error("Failed to save:", data);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl border border-teal-100 shadow-sm space-y-4 h-fit"
      >
        <h3 className="text-base font-bold text-stone-800 border-b border-teal-100 pb-2">
          Add New Care Client
        </h3>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
            Client Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lars Olsson"
            className="w-full p-2 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
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

        <div>
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

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
            Location / Service Area
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
            <option value="Södertälje">Södertälje</option>
            <option value="Haninge">Haninge</option>
            <option value="Nacka">Nacka</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
        >
          Save to JSON
        </button>
      </form>

      {/* Saved Clients List */}
      <div className="bg-white p-6 rounded-xl border border-teal-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-stone-800 border-b border-teal-100 pb-2">
          Saved Clients ({clients.length})
        </h3>

        {clients.length === 0 ? (
          <p className="text-xs text-stone-400 py-4 text-center">
            No clients saved yet. Add your first client using the form.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 text-xs space-y-2 max-h-100 overflow-y-auto pr-1">
            {clients.map((cli) => (
              <li key={cli.id} className="pt-2 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-800">{cli.name}</div>
                  <div className="text-[11px] text-stone-500">
                    {cli.careLevel} • <span className="text-teal-700 font-medium">{cli.location}</span>
                  </div>
                </div>
                <span className="bg-teal-50 text-teal-900 border border-teal-200/80 px-2 py-1 rounded text-[11px] font-bold">
                  {cli.requiredHours}h / wk
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}