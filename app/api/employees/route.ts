import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "employees.json");

function ensureFileExists() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), "utf8");
  }
}

export async function GET() {
  try {
    ensureFileExists();
    const fileData = fs.readFileSync(filePath, "utf8");
    const employees = JSON.parse(fileData || "[]");
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    ensureFileExists();
    
    const { name, role, maxHours, location, isFixedTime, shiftStart, shiftEnd } = await request.json();

    const fileData = fs.readFileSync(filePath, "utf8");
    const employees = JSON.parse(fileData || "[]");

    // Generate sequential EMP- ID (e.g., EMP-1001, EMP-1002)
    let nextId = "EMP-1001";
    if (employees.length > 0) {
      const numbers = employees.map((emp: any) => {
        const match = emp.id?.match(/\d+/);
        return match ? parseInt(match[0], 10) : 1000;
      });
      const maxId = Math.max(...numbers, 1000);
      nextId = `EMP-${maxId + 1}`;
    }

    const newEmployee = {
      id: nextId,
      name,
      role,
      maxHours,
      location: location || "Stockholm",
      isFixedTime: Boolean(isFixedTime),
      shiftStart: isFixedTime ? shiftStart : null,
      shiftEnd: isFixedTime ? shiftEnd : null,
    };

    employees.push(newEmployee);
    fs.writeFileSync(filePath, JSON.stringify(employees, null, 2), "utf8");

    return NextResponse.json({ message: "Employee saved!", employee: newEmployee }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to write data" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    ensureFileExists();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Employee ID is required" }, { status: 400 });
    }

    const fileData = fs.readFileSync(filePath, "utf8");
    let employees = JSON.parse(fileData || "[]");

    const employeeExists = employees.some((emp: any) => emp.id === id);
    if (!employeeExists) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    employees = employees.filter((emp: any) => emp.id !== id);

    fs.writeFileSync(filePath, JSON.stringify(employees, null, 2), "utf8");

    return NextResponse.json({ message: "Employee deleted successfully!" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete data" }, { status: 500 });
  }
}