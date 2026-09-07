import { NextResponse } from "next/server";
import { Shift } from "@/app/types/shift";

// Mock Data
let shifts: Shift[] = [
  {
    id: "s1",
    employeeId: "e1",
    employeeName: "Anna Lindqvist",
    clientId: "c1",
    clientName: "Lars Olsson",
    date: "2026-09-07",
    startTime: "08:00",
    endTime: "14:00",
    location: "Stockholm",
    status: "In-Progress",
  },
  {
    id: "s2",
    employeeId: "e2",
    employeeName: "Erik Johansson",
    clientId: "c2",
    clientName: "Astrid Lindgren",
    date: "2026-09-07",
    startTime: "09:00",
    endTime: "15:00",
    location: "Solna",
    status: "Scheduled",
  },
];

export async function GET() {
  return NextResponse.json(shifts);
}

export async function POST(req: Request) {
  const newShift: Shift = await req.json();
  newShift.id = "s_" + Date.now();
  shifts.push(newShift);
  return NextResponse.json(newShift, { status: 201 });
}