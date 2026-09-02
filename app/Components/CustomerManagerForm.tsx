"use client";

import { useState, useEffect } from "react";

interface Customer {
  id: string;
  name: string;
  careLevel: string;
  location: string;
  requiredHours: number;
}

interface CustomerManagerFormProps {
  onSuccess?: () => void;
}

export default function CustomerManagerForm({ onSuccess }: CustomerManagerFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [careLevel, setCareLevel] = useState("Standard Care");
  const [location, setLocation] = useState("Stockholm");
  const [requiredHours, setRequiredHours] = useState(10);

  useEffect(() => {
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => setCustomers(data))
      .catch(() => setCustomers([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, careLevel, location, requiredHours }),
    });

    if (res.ok) {
      const data = await res.json();
      setCustomers([...customers, data.customer]);
      setName("");
      setCareLevel("Standard Care");
      setLocation("Stockholm");
      setRequiredHours(10);

      // Close modal on success
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="space-y-6 text-left">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <button
          type="submit"
          className="w-full bg-amber-400 hover:bg-amber-500 text-stone-900 font-bold py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
        >
          Save Client to JSON
        </button>
      </form>

      {/* Saved Clients List */}
      <div className="pt-4 border-t border-stone-200">
        <h4 className="text-xs font-bold text-stone-800 mb-2">
          Saved Clients ({customers.length})
        </h4>
        {customers.length === 0 ? (
          <p className="text-xs text-stone-400">No clients added yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100 text-xs max-h-40 overflow-y-auto pr-1">
            {customers.map((cli) => (
              <li key={cli.id} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-stone-800">{cli.name}</div>
                  <div className="text-[11px] text-stone-500">
                    {cli.careLevel} • <span className="text-teal-700 font-medium">{cli.location}</span>
                  </div>
                </div>
                <span className="bg-teal-50 text-teal-900 border border-teal-200/80 px-2 py-0.5 rounded text-[11px] font-bold">
                  {cli.requiredHours}h/wk
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}