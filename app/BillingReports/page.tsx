"use client";

import { useState, useMemo } from "react";
import rawEmployees from "@/data/employees.json";
import rawClients from "@/data/client.json";
import { computeRoster, Client, Employee } from "@/lib/rosterEngine";

interface StaffPayroll {
  id: string;
  name: string;
  role: string;
  hourlyPay: number;
  assignedHours: number;
  overtimeHours: number;
}

interface ClientBilling {
  id: string;
  name: string;
  location: string;
  careLevel: string;
  contractHours: number;
  deliveredHours: number;
  hourlyRate: number;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"clients" | "staff">("clients");

  // Employees aur Clients ko JSON se load karke Roster Engine run karna
  const employeesList = rawEmployees as unknown as Employee[];
  const clientsList = rawClients as unknown as Client[];

  // Roster engine se current allocation calculate karna
  const { roster, employeeWorkloads } = useMemo(() => {
    return computeRoster(clientsList, employeesList);
  }, [clientsList, employeesList]);

  // Dynamic Staff Payroll Mapping with updated role-based hourly pay
  const staff: StaffPayroll[] = useMemo(() => {
    return employeesList.map((emp) => {
      const assignedHours = employeeWorkloads[emp.name] || 0;
      const regularHours = Math.min(assignedHours, 8);
      const overtimeHours = Math.max(0, assignedHours - 8);

      // Role ke mutabiq hourly pay assign karna (spaces aur case-insensitive check)
      let payRate = 230; // Default Care Assistant rate
      const roleNormalized = emp.role ? emp.role.replace(/\s+/g, "").toLowerCase() : "";
      
      if (roleNormalized.includes("registerednurse") || roleNormalized.includes("rn")) {
        payRate = 225;
      } else if (roleNormalized.includes("seniorcareassistant")) {
        payRate = 210;
      } else if (roleNormalized.includes("juniorcareassistant") || roleNormalized.includes("jeniorcareassistant")) {
        payRate = 200;
      } else if (roleNormalized.includes("supportassistant")) {
        payRate = 180;
      }

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        hourlyPay: payRate,
        assignedHours: regularHours,
        overtimeHours: overtimeHours,
      };
    });
  }, [employeesList, employeeWorkloads]);

  // Dynamic Client Billing Mapping with updated care level rates
  const clients: ClientBilling[] = useMemo(() => {
    return clientsList.map((client) => {
      const rosterItem = roster.find((r) => r.client.id === client.id);
      const deliveredHours = rosterItem
        ? rosterItem.tasks.reduce((sum, t) => sum + t.durationMinutes / 60, 0)
        : 0;

      let rate = 250; // Default Standard Care
      const care = client.careLevel?.toLowerCase() || "";
      if (care.includes("high")) {
        rate = 270;
      } else if (care.includes("basic")) {
        rate = 240;
      }

      return {
        id: client.id,
        name: client.name,
        location: client.location || "Stockholm",
        careLevel: client.careLevel,
        contractHours: client.requiredHours,
        deliveredHours: Number(deliveredHours.toFixed(1)),
        hourlyRate: rate,
      };
    });
  }, [clientsList, roster]);

  // --- Calculations ---
  const totalClientBillable = clients.reduce(
    (acc, c) => acc + c.deliveredHours * c.hourlyRate,
    0
  );
  const totalDeliveredHours = clients.reduce(
    (acc, c) => acc + c.deliveredHours,
    0
  );

  const totalPayrollCost = staff.reduce(
    (acc, s) =>
      acc +
      s.assignedHours * s.hourlyPay +
      s.overtimeHours * (s.hourlyPay * 1.5),
    0
  );
  const totalStaffHours = staff.reduce(
    (acc, s) => acc + s.assignedHours + s.overtimeHours,
    0
  );

  // --- One-Click CSV Export Function ---
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeTab === "clients") {
      csvContent += "No,Client ID,Name,Location,Care Level,Contract Hours,Delivered Hours,Hourly Rate (SEK),Total Billable (SEK)\n";
      clients.forEach((c, index) => {
        const row = [
          index + 1,
          c.id,
          `"${c.name}"`,
          c.location,
          `"${c.careLevel}"`,
          c.contractHours,
          c.deliveredHours,
          c.hourlyRate,
          c.deliveredHours * c.hourlyRate,
        ].join(",");
        csvContent += row + "\n";
      });
    } else {
      csvContent += "No,Employee ID,Name,Role,Hourly Pay (SEK),Regular Hours,Overtime Hours,Total Payable (SEK)\n";
      staff.forEach((s, index) => {
        const totalPay =
          s.assignedHours * s.hourlyPay +
          s.overtimeHours * (s.hourlyPay * 1.5);
        const row = [
          index + 1,
          s.id,
          `"${s.name}"`,
          `"${s.role}"`,
          s.hourlyPay,
          s.assignedHours,
          s.overtimeHours,
          totalPay,
        ].join(",");
        csvContent += row + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${activeTab}_billing_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-6 space-y-6">
      {/* Header & Export Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-teal-50 p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-teal-700">
            Billing & Hours Summary For The Day
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage Client Invoicing and Staff Payroll metrics in one place.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
        >
          Export {activeTab === "clients" ? "Client" : "Staff"} CSV
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-teal-50 p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase">Est. Client Billing</span>
          <p className="text-xl font-bold text-teal-700 mt-1">{totalClientBillable.toLocaleString()} SEK</p>
          <span className="text-[10px] text-stone-400">Total for {totalDeliveredHours.toFixed(1)} Delivered hours</span>
        </div>

        <div className="bg-teal-50 p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase">Est. Staff Payroll</span>
          <p className="text-xl font-bold text-stone-800 mt-1">{totalPayrollCost.toLocaleString()} SEK</p>
          <span className="text-[10px] text-stone-400">Total for {totalStaffHours.toFixed(1)} worked hours</span>
        </div>

        <div className="bg-teal-50 p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase">Active Care Clients</span>
          <p className="text-xl font-bold text-stone-800 mt-1">{clients.length}</p>
          <span className="text-[10px] text-stone-400">Invoicing active this cycle</span>
        </div>

        <div className="bg-teal-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase">Active Caregivers</span>
          <p className="text-xl font-bold text-stone-800 mt-1">{staff.length}</p>
          <span className="text-[10px] text-stone-400">Payroll active this cycle</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex space-x-2 border-b border-stone-200">
        <button
          onClick={() => setActiveTab("clients")}
          className={`pb-2 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
            activeTab === "clients"
              ? "border-emerald-700 text-emerald-700"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          Client Invoicing Data
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`pb-2 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
            activeTab === "staff"
              ? "border-emerald-700 text-emerald-700"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          Payroll & Staff Hours
        </button>
      </div>

      {/* Client Invoicing View */}
      {activeTab === "clients" && (
        <>
          {/* MOBILE VIEW (< 768px): Responsive Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {clients.map((c, index) => {
              const total = c.deliveredHours * c.hourlyRate;
              return (
                <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-stone-400 font-mono">#{index + 1}</span>
                      <h3 className="font-bold text-stone-900 text-base">{c.name}</h3>
                      <p className="text-xs text-stone-500">{c.location}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-slate-100 text-stone-700 border border-slate-200 whitespace-nowrap">
                      {c.careLevel}
                    </span>
                  </div>

                  <hr className="border-stone-100" />

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block">Contract Hours</span>
                      <span className="font-mono font-medium">{c.contractHours}h</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block">Delivered Hours</span>
                      <span className="font-mono font-bold text-emerald-700">{c.deliveredHours}h</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block">Hourly Rate</span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border mt-0.5 whitespace-nowrap ${
                          c.hourlyRate === 270
                            ? "bg-red-50 text-red-700 border-red-200"
                            : c.hourlyRate === 250
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : c.hourlyRate === 240
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-stone-100 text-stone-700 border-stone-200"
                        }`}
                      >
                        {c.hourlyRate} SEK
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block">Total Billable</span>
                      <span className="font-mono font-bold text-stone-900">{total.toLocaleString()} SEK</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP & TABLET VIEW (>= 768px): Table Layout */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-teal-50 border-b border-slate-200 text-slate-800 uppercase font-bold">
                <tr>
                  <th className="p-3 w-16 text-center">No.</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Care Need</th>
                  <th className="p-3 text-center">Contract Hrs</th>
                  <th className="p-3 text-center">Delivered Hrs</th>
                  <th className="p-3 text-right">Rate / Hr</th>
                  <th className="p-3 text-right">Total Billable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {clients.map((c, index) => {
                  const total = c.deliveredHours * c.hourlyRate;
                  return (
                    <tr key={c.id} className="hover:bg-teal-50 transition-colors">
                      <td className="p-3 text-center font-mono text-stone-500">{index + 1}</td>
                      <td className="p-3 font-bold">{c.name}</td>
                      <td className="p-3">{c.location}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full font-bold whitespace-nowrap">
                          {c.careLevel}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono">{c.contractHours}h</td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-700">{c.deliveredHours}h</td>
                      <td className="p-3 text-right font-mono">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border whitespace-nowrap ${
                            c.hourlyRate === 270
                              ? "bg-red-50 text-red-700 border-red-200"
                              : c.hourlyRate === 260
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : c.hourlyRate === 250
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-stone-100 text-stone-700 border-stone-200"
                          }`}
                        >
                          {c.hourlyRate} SEK
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-stone-900">{total.toLocaleString()} SEK</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Staff Payroll View */}
      {activeTab === "staff" && (
        <>
          {/* MOBILE VIEW (< 768px): Responsive Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {staff.map((s, index) => {
              const totalPay = s.assignedHours * s.hourlyPay + s.overtimeHours * (s.hourlyPay * 1.5);
              return (
                <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-stone-400 font-mono">#{index + 1}</span>
                      <h3 className="font-bold text-stone-900 text-base">{s.name}</h3>
                      <p className="text-xs text-stone-500">{s.role}</p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold border whitespace-nowrap ${
                        s.hourlyPay === 225
                          ? "bg-blue-50 text-blue-700 border-blue-500"
                          : s.hourlyPay === 210
                          ? "bg-red-50 text-red-700 border-red-500"
                          : s.hourlyPay === 200
                          ? "bg-stone-50 text-stone-700 border-stone-400"
                          : s.hourlyPay === 180
                          ? "bg-teal-50 text-teal-700 border-teal-500"
                          : "bg-violet-100 text-violet-700 border-violet-200"
                      }`}
                    >
                      {s.hourlyPay} SEK/h
                    </span>
                  </div>

                  <hr className="border-stone-100" />

                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    <div className="bg-stone-50 p-2 rounded-lg">
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block">Regular</span>
                      <span className="font-mono font-medium">{s.assignedHours.toFixed(1)}h</span>
                    </div>
                    <div className="bg-stone-50 p-2 rounded-lg">
                      <span className="text-[10px] uppercase font-semibold text-stone-400 block">Overtime</span>
                      <span className="font-mono font-bold text-stone-700">{s.overtimeHours.toFixed(1)}h</span>
                    </div>
                    <div className="bg-teal-50 p-2 rounded-lg">
                      <span className="text-[10px] uppercase font-semibold text-teal-600 block">Total Pay</span>
                      <span className="font-mono font-bold text-teal-900">{totalPay.toLocaleString()} SEK</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP & TABLET VIEW (>= 768px): Table Layout */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 uppercase font-bold">
                <tr>
                  <th className="p-3 w-16 text-center">No.</th>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3 text-right">Hourly Rate</th>
                  <th className="p-3 text-center">Regular Hours</th>
                  <th className="p-3 text-center">Overtime Hours</th>
                  <th className="p-3 text-right">Total Payable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {staff.map((s, index) => {
                  const totalPay = s.assignedHours * s.hourlyPay + s.overtimeHours * (s.hourlyPay * 1.5);
                  return (
                    <tr key={s.id} className="hover:bg-teal-50 transition-colors">
                      <td className="p-3 text-center font-mono text-stone-500">{index + 1}</td>
                      <td className="p-3 font-bold">{s.name}</td>
                      <td className="p-3 text-stone-500">{s.role}</td>
                      <td className="p-3 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border whitespace-nowrap ${
                            s.hourlyPay === 225
                              ? "bg-blue-50 text-blue-700 border-blue-500"
                              : s.hourlyPay === 210
                              ? "bg-red-50 text-red-700 border-red-500"
                              : s.hourlyPay === 200
                              ? "bg-stone-50 text-stone-700 border-stone-400"
                              : s.hourlyPay === 180
                              ? "bg-teal-50 text-teal-700 border-teal-500"
                              :  "bg-violet-50 text-violet-700 border-violet-500"
                          }`}
                        >
                          {s.hourlyPay} SEK
                        </span>
                      </td>
                      <td className="p-3 text-center">{s.assignedHours.toFixed(1)}h</td>
                      <td className="p-3 text-center text-stone-700 font-bold">{s.overtimeHours.toFixed(1)}h</td>
                      <td className="p-3 text-right font-bold text-stone-900">{totalPay.toLocaleString()} SEK</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}