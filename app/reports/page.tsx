"use client";

import { useState, useEffect } from "react";

interface ClientBilling {
  id: string;
  name: string;
  location: string;
  careLevel: string;
  contractHours: number;
  deliveredHours: number;
  hourlyRate: number;
}

interface StaffPayroll {
  id: string;
  name: string;
  role: string;
  hourlyPay: number;
  assignedHours: number;
  overtimeHours: number;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"clients" | "staff">("clients");
  const [clients, setClients] = useState<ClientBilling[]>([]);
  const [staff, setStaff] = useState<StaffPayroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await fetch("/api/reports");
        if (res.ok) {
          const data = await res.json();
          setClients(data.clientBilling);
          setStaff(data.staffPayroll);
        }
      } catch (err) {
        console.error("Failed to load reports data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReports();
  }, []);

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
      csvContent += "Client ID,Name,Location,Care Level,Contract Hours,Delivered Hours,Hourly Rate (SEK),Total Billable (SEK)\n";
      clients.forEach((c) => {
        const row = [
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
      csvContent += "Employee ID,Name,Role,Hourly Pay (SEK),Regular Hours,Overtime Hours,Total Payable (SEK)\n";
      staff.forEach((s) => {
        const totalPay =
          s.assignedHours * s.hourlyPay +
          s.overtimeHours * (s.hourlyPay * 1.5);
        const row = [
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

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center text-stone-600">
        Loading Billing & Hours Summary...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header & Export Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-teal-100 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-stone-800">
            Billing & Hours Summary
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Manage Client Invoicing and Staff Payroll metrics in one place.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export {activeTab === "clients" ? "Client" : "Staff"} CSV
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase">
            Est. Client Billing
          </span>
          <p className="text-xl font-bold text-teal-700 mt-1">
            {totalClientBillable.toLocaleString()} SEK
          </p>
          <span className="text-[10px] text-stone-400">
            Total for {totalDeliveredHours} delivered hours
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase">
            Est. Staff Payroll
          </span>
          <p className="text-xl font-bold text-stone-800 mt-1">
            {totalPayrollCost.toLocaleString()} SEK
          </p>
          <span className="text-[10px] text-stone-400">
            Total for {totalStaffHours} worked hours
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase">
            Active Care Clients
          </span>
          <p className="text-xl font-bold text-stone-800 mt-1">
            {clients.length}
          </p>
          <span className="text-[10px] text-stone-400">
            Invoicing active this cycle
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-teal-100 shadow-sm">
          <span className="text-xs font-bold text-stone-500 uppercase">
            Active Caregivers
          </span>
          <p className="text-xl font-bold text-stone-800 mt-1">
            {staff.length}
          </p>
          <span className="text-[10px] text-stone-400">
            Payroll active this cycle
          </span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex space-x-2 border-b border-stone-200">
        <button
          onClick={() => setActiveTab("clients")}
          className={`pb-2 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
            activeTab === "clients"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          Client Invoicing Data
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`pb-2 px-4 text-xs font-bold transition-colors cursor-pointer border-b-2 ${
            activeTab === "staff"
              ? "border-teal-600 text-teal-700"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          Payroll & Staff Hours
        </button>
      </div>

      {/* Client Invoicing Table */}
      {activeTab === "clients" && (
        <div className="bg-white rounded-xl border border-teal-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-teal-50 border-b border-teal-100 text-stone-700 uppercase font-bold">
              <tr>
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
              {clients.map((c) => {
                const total = c.deliveredHours * c.hourlyRate;
                const isOver = c.deliveredHours > c.contractHours;
                return (
                  <tr key={c.id} className="hover:bg-stone-50">
                    <td className="p-3 font-bold">{c.name}</td>
                    <td className="p-3">{c.location}</td>
                    <td className="p-3">
                      <span className="bg-teal-100 text-teal-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {c.careLevel}
                      </span>
                    </td>
                    <td className="p-3 text-center">{c.contractHours} hrs</td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-bold ${
                          isOver ? "text-amber-600" : "text-stone-800"
                        }`}
                      >
                        {c.deliveredHours} hrs
                      </span>
                    </td>
                    <td className="p-3 text-right">{c.hourlyRate} SEK</td>
                    <td className="p-3 text-right font-bold text-teal-700">
                      {total.toLocaleString()} SEK
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff Payroll Table */}
      {activeTab === "staff" && (
        <div className="bg-white rounded-xl border border-teal-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-teal-50 border-b border-teal-100 text-stone-700 uppercase font-bold">
              <tr>
                <th className="p-3">Employee</th>
                <th className="p-3">Role</th>
                <th className="p-3 text-center">Regular Hrs</th>
                <th className="p-3 text-center">Overtime Hrs</th>
                <th className="p-3 text-right">Base Rate</th>
                <th className="p-3 text-right">Total Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {staff.map((s) => {
                const totalPay =
                  s.assignedHours * s.hourlyPay +
                  s.overtimeHours * (s.hourlyPay * 1.5);
                return (
                  <tr key={s.id} className="hover:bg-stone-50">
                    <td className="p-3 font-bold">{s.name}</td>
                    <td className="p-3">{s.role}</td>
                    <td className="p-3 text-center">{s.assignedHours} hrs</td>
                    <td className="p-3 text-center">
                      {s.overtimeHours > 0 ? (
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          +{s.overtimeHours} hrs OT
                        </span>
                      ) : (
                        "0 hrs"
                      )}
                    </td>
                    <td className="p-3 text-right">{s.hourlyPay} SEK</td>
                    <td className="p-3 text-right font-bold text-stone-800">
                      {totalPay.toLocaleString()} SEK
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}