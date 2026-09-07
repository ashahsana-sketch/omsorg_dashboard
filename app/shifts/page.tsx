"use client";

import { useState, useEffect } from "react";
import { Shift } from "@/app/types/shift";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employeeName, setEmployeeName] = useState("");
  const [clientName, setClientName] = useState("");
  const [shiftDate, setShiftDate] = useState("2026-09-07");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("14:00");
  const [location, setLocation] = useState("Stockholm");

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    const res = await fetch("/api/shifts");
    if (res.ok) {
      const data = await res.json();
      setShifts(data);
    }
  };

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !clientName) return alert("Fill all fields");

    const newShift = {
      employeeName,
      clientName,
      date: shiftDate,
      startTime,
      endTime,
      location,
      status: "Scheduled",
    };

    const res = await fetch("/api/shifts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newShift),
    });

    if (res.ok) {
      fetchShifts();
      setEmployeeName("");
      setClientName("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Weekly Shift Rota</h1>
          <p className="text-xs text-stone-500">Assign and track carer shifts across client locations.</p>
        </div>
      </div>

      {/* Add Shift Form */}
      <form onSubmit={handleAddShift} className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
        <input
          type="text"
          placeholder="Employee Name"
          value={employeeName}
          onChange={(e) => setEmployeeName(e.target.value)}
          className="p-2 border border-stone-300 rounded-lg bg-white"
          required
        />
        <input
          type="text"
          placeholder="Client Name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="p-2 border border-stone-300 rounded-lg bg-white"
          required
        />
        <input
          type="date"
          value={shiftDate}
          onChange={(e) => setShiftDate(e.target.value)}
          className="p-2 border border-stone-300 rounded-lg bg-white"
        />
        <input
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="p-2 border border-stone-300 rounded-lg bg-white"
        />
        <input
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="p-2 border border-stone-300 rounded-lg bg-white"
        />
        <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 rounded-lg transition-colors">
          + Schedule Shift
        </button>
      </form>

      {/* Rota List Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-amber-50 text-stone-700 font-bold uppercase border-b border-amber-100">
            <tr>
              <th className="p-3">Carer</th>
              <th className="p-3">Client</th>
              <th className="p-3">Date</th>
              <th className="p-3">Time Slotted</th>
              <th className="p-3">Location</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-700">
            {shifts.map((s) => (
              <tr key={s.id} className="hover:bg-amber-50/20">
                <td className="p-3 font-bold text-stone-900">{s.employeeName}</td>
                <td className="p-3">{s.clientName}</td>
                <td className="p-3">{s.date}</td>
                <td className="p-3">{s.startTime} - {s.endTime}</td>
                <td className="p-3">{s.location}</td>
                <td className="p-3 text-right">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    s.status === "In-Progress" ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800"
                  }`}>
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}