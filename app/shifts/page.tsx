"use client";

import { useState, useEffect, useMemo } from "react";
import { ShiftRecord, computeRoster, rosterToShifts, Client, Employee } from "@/lib/rosterEngine";

function formatShiftDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function ShiftsPage() {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [shifts, setShifts] = useState<ShiftRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const dateKey = selectedDate.toISOString().split("T")[0];
  const isToday = selectedDate.toDateString() === today.toDateString();

  const selectedDateLabel = useMemo(() => {
    if (isToday) return "Today";
    const dayOffset = Math.round(
      (selectedDate.getTime() - today.getTime()) / 86400000
    );
    if (dayOffset === -1) return "Yesterday";
    if (dayOffset === 1) return "Tomorrow";
    return formatShiftDate(selectedDate);
  }, [isToday, selectedDate, today]);

  const fetchShiftsForDate = async () => {
    setLoading(true);
    try {
      // 1. Fetch from persistent backend JSON storage (/api/shifts)
      const res = await fetch(`/api/shifts?date=${dateKey}`, { cache: "no-store" });
      if (res.ok) {
        const data: ShiftRecord[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setShifts(data);
          setLoading(false);
          return;
        }
      }

      // 2. Fallback: If no shifts recorded yet for this date, compute from clients and employees
      const [cRes, eRes] = await Promise.all([
        fetch("/api/clients", { cache: "no-store" }),
        fetch("/api/employees", { cache: "no-store" }),
      ]);
      const clients: Client[] = cRes.ok ? await cRes.json() : [];
      const employees: Employee[] = eRes.ok ? await eRes.json() : [];

      if (clients.length > 0 && employees.length > 0) {
        const { roster } = computeRoster(clients, employees);
        const generatedShifts = rosterToShifts(roster, dateKey);
        setShifts(generatedShifts);

        // Sync to backend JSON storage
        fetch("/api/shifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync_roster",
            date: dateKey,
            shifts: generatedShifts,
          }),
        }).catch(() => {});
      } else {
        setShifts([]);
      }
    } catch (error) {
      console.error("Failed to fetch shifts:", error);
      setShifts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftsForDate();

    const handleDataUpdate = () => {
      fetchShiftsForDate();
    };

    window.addEventListener("shift-data-updated", handleDataUpdate);
    window.addEventListener("roster-data-updated", handleDataUpdate);

    return () => {
      window.removeEventListener("shift-data-updated", handleDataUpdate);
      window.removeEventListener("roster-data-updated", handleDataUpdate);
    };
  }, [dateKey]);

  const handlePrevDay = () =>
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 1);
      return d;
    });

  const handleNextDay = () =>
    setSelectedDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 1);
      return d;
    });

  const handleToday = () => setSelectedDate(today);

  // Filtered shifts based on search query and status filter
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        s.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.employeeRole || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [shifts, searchQuery, statusFilter]);

  // Aggregate Metrics
  const totalHours = useMemo(() => {
    return shifts
      .reduce((sum, s) => sum + (s.durationHours || 0), 0)
      .toFixed(1);
  }, [shifts]);

  const uniqueStaffCount = useMemo(() => {
    const staff = new Set(
      shifts
        .filter((s) => s.employeeName && s.employeeName !== "Unassigned")
        .map((s) => s.employeeName)
    );
    return staff.size;
  }, [shifts]);

  const uniqueClientsCount = useMemo(() => {
    const clients = new Set(shifts.map((s) => s.clientName));
    return clients.size;
  }, [shifts]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 space-y-6 bg-slate-50 min-h-screen">
      {/* Header Banner */}
      <div className="bg-teal-700 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Care Shift Management & Live Roster Sync
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 mt-1">
            Persisted allocations from JSON backend storage, synced across Roster and Shift pages.
          </p>
        </div>

        {/* Day Navigation Controls */}
        <div className="flex items-center gap-2 bg-teal-800/80 p-1.5 rounded-xl border border-teal-600/60 shadow-inner">
          <button
            onClick={handlePrevDay}
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3 py-2 rounded-lg transition cursor-pointer shadow-xs"
          >
            ← Yesterday
          </button>
          <button
            onClick={handleToday}
            className={`font-bold text-xs px-3 py-2 rounded-lg border transition cursor-pointer ${
              isToday
                ? "bg-white text-teal-800 border-white shadow-sm"
                : "bg-teal-700 hover:bg-teal-600 text-white border-teal-600"
            }`}
          >
            Today
          </button>
          <button
            onClick={handleNextDay}
            className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3 py-2 rounded-lg transition cursor-pointer shadow-xs"
          >
            Tomorrow →
          </button>
        </div>
      </div>

      {/* Date Header & Quick Summary Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <span className="text-xs uppercase font-bold text-teal-700 block tracking-wider">
            Shift Schedule For
          </span>
          <h2 className="text-lg font-bold text-slate-800">
            {formatShiftDate(selectedDate)} ({selectedDateLabel})
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs font-semibold text-slate-700">
            Total Shifts: <strong className="text-teal-700">{shifts.length}</strong>
          </div>
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs font-semibold text-slate-700">
            Total Hours: <strong className="text-teal-700">{totalHours}h</strong>
          </div>
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs font-semibold text-slate-700">
            Active Staff: <strong className="text-teal-700">{uniqueStaffCount}</strong>
          </div>
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs font-semibold text-slate-700">
            Clients Served: <strong className="text-teal-700">{uniqueClientsCount}</strong>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-80">
          <input
            type="text"
            placeholder="Search carer, client, location, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-teal-600 outline-none bg-slate-50 text-slate-800"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-teal-600 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Main Shift List / Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-slate-200 text-slate-600 font-semibold text-xs">
          Loading persisted shifts for {selectedDateLabel}...
        </div>
      ) : filteredShifts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm text-xs font-medium">
          No shifts found matching the selected criteria for {formatShiftDate(selectedDate)}.
        </div>
      ) : (
        <>
          {/* MOBILE VIEW (< 768px): Card layout */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredShifts.map((shift, index) => (
              <div
                key={shift.id || index}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] text-teal-700 font-mono font-bold block">
                      {shift.id}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                      {shift.clientName}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <span>📍</span> {shift.location}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      shift.status === "Completed"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : shift.status === "In-Progress"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-teal-50 text-teal-700 border border-teal-200"
                    }`}
                  >
                    {shift.status}
                  </span>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-1 text-xs">
                  <div className="text-slate-500 text-[11px] font-semibold uppercase">
                    Assigned Carer
                  </div>
                  <div className="font-bold text-slate-800">
                    {shift.employeeName}
                  </div>
                  {shift.employeeRole && (
                    <div className="text-[11px] text-teal-700">
                      {shift.employeeRole}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                      Shift Timing
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {shift.startTime} - {shift.endTime}
                    </span>
                  </div>
                  <div className="text-right font-bold text-teal-700">
                    {shift.durationHours || 0}h
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP VIEW (>= 768px): Structured Table */}
          <div className="hidden md:block rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-teal-50/80 text-teal-900 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Assigned Carer</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Shift Timing</th>
                  <th className="p-3 text-center">Duration</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredShifts.map((shift, index) => (
                  <tr
                    key={shift.id || index}
                    className="hover:bg-teal-50/40 transition-colors"
                  >
                    <td className="p-3 text-center font-bold text-slate-400">
                      {index + 1}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      <div>{shift.employeeName}</div>
                      {shift.employeeRole && (
                        <span className="text-[11px] font-normal text-teal-700">
                          {shift.employeeRole}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      <div>{shift.clientName}</div>
                      {shift.careLevel && (
                        <span className="text-[10px] text-slate-500 font-normal">
                          {shift.careLevel}
                        </span>
                      )}
                    </td>
                    <td className="p-3">{shift.location || "Stockholm"}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {shift.startTime} - {shift.endTime}
                    </td>
                    <td className="p-3 text-center font-bold text-teal-700">
                      {shift.durationHours || 0}h
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          shift.status === "Completed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : shift.status === "In-Progress"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-teal-50 text-teal-700 border border-teal-200"
                        }`}
                      >
                        {shift.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}