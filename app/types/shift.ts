export interface Shift {
  id: string;
  employeeId?: string;
  employeeName: string;
  clientId?: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  location: string;
  status: "Scheduled" | "Completed" | "In-Progress";
}