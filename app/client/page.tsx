"use client";

import { useState, useEffect } from "react";

interface Client {
  id: string;
  name: string;
  careLevel: string;
  requiredHours: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [careLevel, setCareLevel] = useState("Standard Care");
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

    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        careLevel,
        requiredHours: Number(requiredHours),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setClients([...clients, data.client]);
      setName("");
      setCareLevel("Standard Care");
      setRequiredHours(10);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-stone-800">Add New Care Client</h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl border border-teal-100 shadow-sm space-y-4"
      >
        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
            Client Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lars Olsson"
            className="w-full p-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
            Care Need Level
          </label>
          <select
            value={careLevel}
            onChange={(e) => setCareLevel(e.target.value)}
            className="w-full p-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
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
            className="w-full p-2 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
        >
          Save to JSON
        </button>
      </form>

      <div className="bg-white p-6 rounded-xl border border-teal-100 shadow-sm">
        <h2 className="text-lg font-bold text-stone-800 mb-3">Saved Clients</h2>
        <ul className="divide-y divide-stone-100 text-sm">
          {clients.map((cli) => (
            <li key={cli.id} className="py-2 flex justify-between">
              <span className="font-medium text-stone-800">
                {cli.name} ({cli.careLevel})
              </span>
              <span className="text-stone-500">{cli.requiredHours} hrs/week</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}