import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Define absolute path to customers.json
const filePath = path.join(process.cwd(), "data", "customers.json");

// Helper function to read current JSON data safely
async function readData() {
  try {
    const fileData = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileData);
  } catch {
    return [];
  }
}

// 1. GET: Fetch all customers
export async function GET() {
  const customers = await readData();
  return NextResponse.json(customers);
}

// 2. POST: Add a new customer and save to JSON
export async function POST(req: Request) {
  try {
    const { name, careLevel, location, requiredHours } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    const customers = await readData();

    // Create new customer object with unique ID
    const newCustomer = {
      id: Date.now().toString(),
      name,
      careLevel,
      location,
      requiredHours: Number(requiredHours),
    };

    customers.push(newCustomer);

    // Save updated list back to data/customers.json
    await fs.writeFile(filePath, JSON.stringify(customers, null, 2), "utf-8");

    return NextResponse.json(
      { message: "Customer saved successfully", customer: newCustomer },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to write data to JSON file" },
      { status: 500 }
    );
  }
}