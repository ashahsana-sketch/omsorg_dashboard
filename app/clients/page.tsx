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

export default function ClientsDirectoryPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-teal-600 text-white p-5 rounded-xl shadow-md gap-4">
        <div>
          <h2 className="text-lg font-bold">Clients Directory</h2>
          <p className="text-xs text-slate-50 mt-0.5">Manage registered care clients</p>
        </div>
        
        <div className="flex items-center gap-2">
          

          {/* Yeh button user ko form page par le jaye ga */}
          <button
            onClick={() => router.push("/clients/add")}
            className="bg-white text-teal-700 font-bold text-xs px-4 py-2 rounded-lg hover:bg-slate-50 transition cursor-pointer shadow-sm"
          >
            + Add New Client
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs px-3 py-2 rounded-lg transition cursor-pointer border border-emerald-600 shadow-sm"
          >
            ← Main Page
          </button>
        </div>
      </div>

      {/* Directory Table */}
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
                    <tr key={client.id} className="hover:bg-emerald-50 transition-colors">
                      <td className="p-2 font-mono text-teal-700 font-bold text-center">
                        {client.id}
                      </td>
                      <td className="p-2 font-semibold text-stone-900">{client.name}</td>
                      <td className="p-2">
  <span
    className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
      client.careLevel === "High Care"
        ? "bg-red-50 text-red-700 border-red-200"
        : client.careLevel === "Standard Care"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-emerald-50 text-emerald-700 border-emerald-100"
    }`}
  >
    {client.careLevel}
  </span>
</td>
                      <td className="p-2">
                        {isFixed && client.preferredStart && client.preferredEnd ? (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-900 border border-blue-100 px-2 py-0.5 rounded-md font-mono text-[11px]">
                            <span className="font-sans font-bold text-[10px] uppercase">Fixed:</span>
                            {client.preferredStart} - {client.preferredEnd} ({client.requiredHours}h/wk)
                          </span>
                        ) : (
                          <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md font-mono text-[11px]">
                            Flexible ({client.requiredHours}h/wk)
                          </span>
                        )}
                      </td>
                      <td className="p-2">{client.location}</td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(client.id, client.name)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-500 px-2 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer"
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
  );
}