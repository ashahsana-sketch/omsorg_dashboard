// app/roster/page.tsx

import RosterView from "@/app/Components/RosterViewServer";
import { computeRoster } from "@/lib/rosterEngine";
import rawClients from "@/data/client.json";
import rawEmployees from "@/data/employees.json";
import RosterViewServer from "@/app/Components/RosterViewServer";
export const dynamic = 'force-static';
// Agar aapke paas Client type ka import path hai toh use karein, misaal ke taur par:
// import { Client } from "@/types/roster"; 

export default function RosterPage() {
  // Yahan 'as any' ya apna defined Client type use kar lein taake TypeScript error khatam ho jaye
  const clients = rawClients as any; 
  const employees = rawEmployees as any;

  const { roster, employeeWorkloads, missingRequirements } =
    computeRoster(clients, employees);

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#333', borderBottom: '2px solid #eaeaea', paddingBottom: '0.5rem' }}>
        Roster Dashboard
      </h1>

      {/* Roster Section - Server Side Rendered (No JSON.stringify bloat) */}
      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ color: '#0070f3' }}>Generated Roster</h2>
        {roster?.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {roster.map((item: any, index: number) => (
              <div key={index} style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '6px', border: '1px solid #eee' }}>
                <p><strong>ID:</strong> {item.id || index}</p>
                {/* Yahan object ki specific properties dikhayein, poora JSON dump na karein */}
              </div>
            ))}
          </div>
        ) : (
          <p>No roster data available.</p>
        )}
      </section>

      {/* Missing Requirements Section */}
      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ color: '#d9534f' }}>Missing Requirements</h2>
        {missingRequirements?.length > 0 ? (
          <ul>
            {missingRequirements.map((req: any, i: number) => (
              <li key={i}>{typeof req === 'string' ? req : JSON.stringify(req)}</li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'green' }}>No missing requirements!</p>
        )}
      </section>
    </main>
  );
}