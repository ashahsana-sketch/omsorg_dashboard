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
    const {
      name,
      careLevel,
      requiredHours,
      location,
      isFixedTime,
      preferredStart,
      preferredEnd,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    const clients = await readClients();

    const isFixed = Boolean(isFixedTime);

    const newClient = {
      id: Date.now().toString(),
      name,
      careLevel: careLevel || "Standard Care",
      requiredHours: Number(requiredHours) || 10,
      location: location || "Stockholm",
      isFixedTime: isFixed,
      preferredStart: isFixed ? preferredStart : null,
      preferredEnd: isFixed ? preferredEnd : null,
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 }
      );
    }

    let clients = await readClients();

    const clientExists = clients.some((client: any) => client.id === id);
    if (!clientExists) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    clients = clients.filter((client: any) => client.id !== id);

    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(clients, null, 2));

    return NextResponse.json(
      { message: "Client deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client data" },
      { status: 500 }
    );
  }
}