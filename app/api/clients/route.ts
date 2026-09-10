import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Sahi root-level path: data/client.json
const filePath = path.join(process.cwd(), "data", "client.json");

function getNextClientId(clients: any[]): string {
  if (!clients || clients.length === 0) return "CL-1001";
  
  let maxNum = 1000;
  clients.forEach((c) => {
    if (c.id && typeof c.id === "string" && c.id.startsWith("CL-")) {
      const num = parseInt(c.id.replace("CL-", ""), 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  return `CL-${maxNum + 1}`;
}

// GET: Sabhi clients fetch karne ke liye
export async function GET() {
  try {
    if (!fs.existsSync(filePath)) {
      return NextResponse.json([], { status: 200 });
    }
    const fileData = fs.readFileSync(filePath, "utf-8");
    const clients = JSON.parse(fileData);
    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

// POST: Naya client add karne ke liye (Sequential ID e.g. CL-1014)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    let clients = [];
    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf-8");
      clients = JSON.parse(fileData);
    }

    const newId = getNextClientId(clients);

    const newClient = {
      id: newId,
      ...body,
    };

    clients.push(newClient);

    // Ensure directory exists if needed, then write file
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(clients, null, 2), "utf-8");

    return NextResponse.json({ success: true, client: newClient }, { status: 201 });
  } catch (error) {
    console.error("Save error:", error);
    return NextResponse.json({ error: "Failed to save client" }, { status: 500 });
  }
}

// DELETE: Client delete karne ke liye
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileData = fs.readFileSync(filePath, "utf-8");
    let clients = JSON.parse(fileData);

    const filteredClients = clients.filter((c: any) => c.id !== id);

    fs.writeFileSync(filePath, JSON.stringify(filteredClients, null, 2), "utf-8");

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}