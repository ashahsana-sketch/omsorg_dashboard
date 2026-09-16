import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "shifts.json");

function ensureFileExists() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf8");
  }
}

function readShifts(): any[] {
  ensureFileExists();
  try {
    const fileData = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileData || "[]");
  } catch (err) {
    console.error("Error reading shifts file:", err);
    return [];
  }
}

function writeShifts(shifts: any[]) {
  ensureFileExists();
  fs.writeFileSync(filePath, JSON.stringify(shifts, null, 2), "utf8");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const employeeId = searchParams.get("employeeId");
    const clientId = searchParams.get("clientId");

    let shifts = readShifts();

    if (date) {
      shifts = shifts.filter((s) => s.date === date);
    }
    if (employeeId) {
      shifts = shifts.filter((s) => s.employeeId === employeeId);
    }
    if (clientId) {
      shifts = shifts.filter((s) => s.clientId === clientId);
    }

    return NextResponse.json(shifts);
  } catch (error) {
    console.error("Failed to fetch shifts:", error);
    return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let allShifts = readShifts();

    // Support bulk roster sync for a given date
    if (body && body.action === "sync_roster" && body.date && Array.isArray(body.shifts)) {
      const targetDate = body.date;
      const newShiftsForDate = body.shifts;

      // Keep shifts for all OTHER dates, replace/sync the target date
      const otherDateShifts = allShifts.filter((s) => s.date !== targetDate);
      allShifts = [...otherDateShifts, ...newShiftsForDate];

      writeShifts(allShifts);

      revalidatePath("/shifts");
      revalidatePath("/shift");
      revalidatePath("/");

      return NextResponse.json({
        success: true,
        message: `Synced ${newShiftsForDate.length} shifts for date ${targetDate}`,
        count: newShiftsForDate.length,
      });
    }

    // Support single shift creation
    const newShift = {
      id: body.id || "shift_" + Date.now(),
      ...body,
      status: body.status || "Scheduled",
    };

    allShifts.push(newShift);
    writeShifts(allShifts);

    revalidatePath("/shifts");
    revalidatePath("/shift");
    revalidatePath("/");

    return NextResponse.json({ success: true, shift: newShift }, { status: 201 });
  } catch (error) {
    console.error("Failed to save shift:", error);
    return NextResponse.json({ error: "Failed to save shift data" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const date = searchParams.get("date");

    if (!id && !date) {
      return NextResponse.json({ error: "Shift ID or date parameter required" }, { status: 400 });
    }

    let shifts = readShifts();

    if (id) {
      shifts = shifts.filter((s) => s.id !== id);
    } else if (date) {
      shifts = shifts.filter((s) => s.date !== date);
    }

    writeShifts(shifts);

    revalidatePath("/shifts");
    revalidatePath("/shift");
    revalidatePath("/");

    return NextResponse.json({ success: true, message: "Shift(s) deleted successfully" });
  } catch (error) {
    console.error("Failed to delete shift:", error);
    return NextResponse.json({ error: "Failed to delete shift" }, { status: 500 });
  }
}