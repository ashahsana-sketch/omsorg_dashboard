import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "customers.json");

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
    const customers = JSON.parse(fileData || "[]");
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    ensureFileExists();
    const { name, careLevel, location, requiredHours } = await request.json();

    const fileData = fs.readFileSync(filePath, "utf8");
    const customers = JSON.parse(fileData || "[]");

    const newCustomer = {
      id: Date.now().toString(),
      name,
      careLevel: careLevel || "Standard Care",
      location: location || "Stockholm",
      requiredHours: Number(requiredHours) || 10,
    };

    customers.push(newCustomer);
    fs.writeFileSync(filePath, JSON.stringify(customers, null, 2), "utf8");

    return NextResponse.json(
      { message: "Customer saved!", customer: newCustomer },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Failed to write customer data" }, { status: 500 });
  }
}