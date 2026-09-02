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
    const { name, role, maxHours, location } = await request.json();

    const fileData = fs.readFileSync(filePath, "utf8");
    const employees = JSON.parse(fileData || "[]");

    const newEmployee = {
      id: Date.now().toString(),
      name,
      role,
      maxHours,
      location: location || "Stockholm", // Default location fallback
    };

    employees.push(newEmployee);
    fs.writeFileSync(filePath, JSON.stringify(employees, null, 2), "utf8");

    return NextResponse.json({ message: "Employee saved!", employee: newEmployee }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to write data" }, { status: 500 });
  }
}