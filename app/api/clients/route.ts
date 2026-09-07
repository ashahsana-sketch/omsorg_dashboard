import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const dirPath = path.join(process.cwd(), "data");
const filePath = path.join(dirPath, "client.json");

async function readClients() {
  try {
    const fileData = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileData);
  } catch (error) {
    return [];
  }
}

export async function GET() {
  const clients = await readClients();
  return NextResponse.json(clients);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, careLevel, requiredHours, location } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    const clients = await readClients();

    const newClient = {
      id: Date.now().toString(),
      name,
      careLevel: careLevel || "Standard Care",
      requiredHours: Number(requiredHours) || 10,
      location: location || "Stockholm",
    };

    clients.push(newClient);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(clients, null, 2));

    return NextResponse.json({ client: newClient }, { status: 201 });
  } catch (error) {
    console.error("API Error saving client:", error);
    return NextResponse.json(
      { error: "Failed to write client data" },
      { status: 500 }
    );
  }
}
