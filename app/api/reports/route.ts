import { NextResponse } from "next/server";

export async function GET() {
  // Mock Data (Real app me aap yahan DB queries run karenge)
  const clientBilling = [
    {
      id: "C-101",
      name: "Lars Olsson",
      location: "Stockholm",
      careLevel: "Standard Care",
      contractHours: 10,
      deliveredHours: 10,
      hourlyRate: 350, // SEK / hour
    },
    {
      id: "C-102",
      name: "Astrid Lindgren",
      location: "Solna",
      careLevel: "High Dependency",
      contractHours: 20,
      deliveredHours: 22,
      hourlyRate: 450,
    },
    {
      id: "C-103",
      name: "Sven Svensson",
      location: "Kista",
      careLevel: "Basic Assistance",
      contractHours: 5,
      deliveredHours: 4,
      hourlyRate: 300,
    },
  ];

  const staffPayroll = [
    {
      id: "E-201",
      name: "Anna Lindqvist",
      role: "Care Assistant",
      hourlyPay: 180, // SEK / hour
      assignedHours: 35,
      overtimeHours: 2,
    },
    {
      id: "E-202",
      name: "Erik Johansson",
      role: "Senior Carer",
      hourlyPay: 220,
      assignedHours: 40,
      overtimeHours: 5,
    },
    {
      id: "E-203",
      name: "Elin Berg",
      role: "Nurse",
      hourlyPay: 280,
      assignedHours: 25,
      overtimeHours: 0,
    },
  ];

  return NextResponse.json({
    clientBilling,
    staffPayroll,
  });
}