// @/lib/rosterEngine.ts

export interface Task {
  id: string;
  name: string;
  durationMinutes: number;
  start: string;
  end: string;
  assignedStaffId: string;
  assignedStaffName: string;
}

export interface Client {
  id: string;
  name: string;
  careLevel: "High Care" | "Standard Care" | "Low Care";
  isFixedTime: boolean;
  preferredStart?: string;
  requiredHours: number;
  location: string;
  tasks?: Task[];
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  qualification?: string;
  maxHoursPerDay: number;
  shiftStart?: string;
  shiftEnd?: string;
}

export interface FinalRosterItem {
  client: Client;
  tasks: Task[];
  primaryEmployeeId: string;
  primaryEmployeeName: string;
  primaryEmployeeRole: string;
  secondaryEmployeeId?: string;
  secondaryEmployeeName?: string;
  secondaryEmployeeRole?: string;
  status: "Fully Assigned" | "Partially Assigned" | "Unassigned";
}

export interface MissingStaffRequirement {
  careLevel: string;
  roleNeeded: string;
  unassignedClientsCount: number;
  totalHoursNeeded: number;
  estimatedStaffCount: number;
}

function timeToMinutes(timeStr?: string, defaultTime: string = "08:00"): number {
  const safeTime =
    timeStr && typeof timeStr === "string" && timeStr.includes(":")
      ? timeStr
      : defaultTime;

  const [h, m] = safeTime.split(":").map(Number);
  return (isNaN(h) ? 8 : h) * 60 + (isNaN(m) ? 0 : m);
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface ScheduleSlot {
  employeeId: string;
  startMins: number;
  endMins: number;
}

export function computeRoster(
  clients: Client[],
  employees: Employee[]
): {
  roster: FinalRosterItem[];
  employeeWorkloads: Record<string, number>;
  missingRequirements: MissingStaffRequirement[];
} {
  const employeeWorkloads: Record<string, number> = {};
  const employeeSchedules: Record<string, ScheduleSlot[]> = {};

  if (!Array.isArray(clients) || !Array.isArray(employees)) {
    return { roster: [], employeeWorkloads: {}, missingRequirements: [] };
  }

  employees.forEach((emp) => {
    employeeWorkloads[emp.name] = 0;
    employeeSchedules[emp.id] = [];
  });

  const sortedClients = [...clients].sort((a, b) => {
    if (a.isFixedTime && !b.isFixedTime) return -1;
    if (!a.isFixedTime && b.isFixedTime) return 1;
    return 0;
  });

  const roster: FinalRosterItem[] = [];

  for (const client of sortedClients) {
    const totalRequiredHours = client.requiredHours || 1;
    const totalRequiredMins = totalRequiredHours * 60;
    const travelMarginMins = 30;

    let remainingMinsToAssign = totalRequiredMins;
    let baseStartMins = timeToMinutes(client.preferredStart, "08:00");

    const assignedTasks: Task[] = [];
    const assignedStaffMembers: Employee[] = [];

    const tryAssignStaff = (
      reqMins: number,
      startMins: number
    ): { emp: Employee; start: number; end: number } | null => {
      for (const emp of employees) {
        if (assignedStaffMembers.some((s) => s.id === emp.id)) continue;

        const empRole = (emp.role || "").toLowerCase();
        const empQual = (emp.qualification || "").toLowerCase();
        const isNurse =
          empRole.includes("nurse") ||
          empRole.includes("rn") ||
          empQual.includes("rn") ||
          empQual.includes("nurse");

        if (client.careLevel === "High Care" && !isNurse) continue;

        const empShiftStart = timeToMinutes(emp.shiftStart, "08:00");
        const empShiftEnd = timeToMinutes(emp.shiftEnd, "22:00"); 
        const maxDailyMins = (emp.maxHoursPerDay || 8) * 60;
        const currentWorkloadMins = (employeeWorkloads[emp.name] || 0) * 60;

        const availableCapacity = maxDailyMins - currentWorkloadMins;
        if (availableCapacity <= 0) continue;

        const assignableMins = Math.min(reqMins, availableCapacity);
        let candidateStart = Math.max(startMins, empShiftStart);
        let candidateEnd = candidateStart + assignableMins;

        const existingSlots = (employeeSchedules[emp.id] || []).sort(
          (a, b) => a.startMins - b.startMins
        );

        let slotFound = false;
        while (candidateEnd <= empShiftEnd) {
          let hasOverlap = false;

          for (const slot of existingSlots) {
            const slotStartWithMargin = slot.startMins - travelMarginMins;
            const slotEndWithMargin = slot.endMins + travelMarginMins;

            if (
              candidateStart < slotEndWithMargin &&
              candidateEnd > slotStartWithMargin
            ) {
              hasOverlap = true;
              candidateStart = slot.endMins + travelMarginMins;
              candidateEnd = candidateStart + assignableMins;
              break;
            }
          }

          if (!hasOverlap) {
            if (candidateEnd <= empShiftEnd) {
              slotFound = true;
            }
            break;
          }
        }

        if (slotFound) {
          return { emp, start: candidateStart, end: candidateEnd };
        }
      }
      return null;
    };

    // 1st Shift Assignment
    let currentStart = baseStartMins;
    let firstAssignment = tryAssignStaff(remainingMinsToAssign, currentStart);

    if (firstAssignment) {
      const { emp, start, end } = firstAssignment;
      const assignedMins = end - start;

      employeeSchedules[emp.id].push({
        employeeId: emp.id,
        startMins: start,
        endMins: end,
      });

      employeeWorkloads[emp.name] = Number(
        ((employeeWorkloads[emp.name] || 0) + assignedMins / 60).toFixed(1)
      );

      assignedStaffMembers.push(emp);
      assignedTasks.push({
        id: `task-${client.id}-1`,
        name: `Shift 1 (${client.careLevel})`,
        durationMinutes: assignedMins,
        start: minutesToTime(start),
        end: minutesToTime(end),
        assignedStaffId: emp.id,
        assignedStaffName: emp.name,
      });

      remainingMinsToAssign -= assignedMins;
      currentStart = end; 
    }

    // 2nd Shift Assignment
    if (remainingMinsToAssign > 0) {
      let secondAssignment = tryAssignStaff(remainingMinsToAssign, currentStart);

      if (secondAssignment) {
        const { emp, start, end } = secondAssignment;
        const assignedMins = end - start;

        employeeSchedules[emp.id].push({
          employeeId: emp.id,
          startMins: start,
          endMins: end,
        });

        employeeWorkloads[emp.name] = Number(
          ((employeeWorkloads[emp.name] || 0) + assignedMins / 60).toFixed(1)
        );

        assignedStaffMembers.push(emp);
        assignedTasks.push({
          id: `task-${client.id}-2`,
          name: `Shift 2 (${client.careLevel})`,
          durationMinutes: assignedMins,
          start: minutesToTime(start),
          end: minutesToTime(end),
          assignedStaffId: emp.id,
          assignedStaffName: emp.name,
        });

        remainingMinsToAssign -= assignedMins;
      }
    }

    let status: "Fully Assigned" | "Partially Assigned" | "Unassigned" = "Unassigned";
    if (remainingMinsToAssign === 0 && assignedStaffMembers.length > 0) {
      status = "Fully Assigned";
    } else if (remainingMinsToAssign < totalRequiredMins && assignedStaffMembers.length > 0) {
      status = "Partially Assigned";
    }

    const primaryStaff = assignedStaffMembers[0];
    const secondaryStaff = assignedStaffMembers[1];

    roster.push({
      client,
      tasks: assignedTasks,
      primaryEmployeeId: primaryStaff ? primaryStaff.id : "UNASSIGNED",
      primaryEmployeeName: primaryStaff ? primaryStaff.name : "Unassigned",
      primaryEmployeeRole: primaryStaff ? primaryStaff.role : "N/A",
      secondaryEmployeeId: secondaryStaff?.id,
      secondaryEmployeeName: secondaryStaff?.name,
      secondaryEmployeeRole: secondaryStaff?.role,
      status,
    });
  }

  // Gap Analysis
  const unassignedOrPartial = roster.filter((item) => item.status !== "Fully Assigned");
  const missingSummary: Record<string, { totalHours: number; count: number; roleNeeded: string }> = {};

  unassignedOrPartial.forEach((item) => {
    const level = item.client.careLevel || "Standard Care";
    const totalHours = item.client.requiredHours || 1;
    const assignedHours = item.tasks.reduce((sum, t) => sum + t.durationMinutes / 60, 0);
    const unassignedHours = totalHours - assignedHours;

    const roleNeeded = level === "High Care" ? "Registered Nurse (RN)" : "Care Assistant / Carer";

    if (!missingSummary[level]) {
      missingSummary[level] = { totalHours: 0, count: 0, roleNeeded };
    }

    missingSummary[level].totalHours += unassignedHours;
    missingSummary[level].count += 1;
  });

  const missingRequirements: MissingStaffRequirement[] = Object.entries(missingSummary).map(
    ([careLevel, data]) => ({
      careLevel,
      roleNeeded: data.roleNeeded,
      unassignedClientsCount: data.count,
      totalHoursNeeded: Number(data.totalHours.toFixed(1)),
      estimatedStaffCount: Math.ceil(data.totalHours / 8),
    })
  );

  return { roster, employeeWorkloads, missingRequirements };
}

/**
 * Helper function to handle manual staff assignment, updating workloads and slot durations dynamically.
 */
export function assignStaffManually(
  currentRoster: FinalRosterItem[],
  currentWorkloads: Record<string, number>,
  clientId: string,
  chosenEmployee: Employee
): {
  updatedRoster: FinalRosterItem[];
  updatedWorkloads: Record<string, number>;
  missingRequirements: MissingStaffRequirement[];
} {
  let addedHours = 0;

  const updatedRoster = currentRoster.map((item) => {
    if (item.client.id === clientId) {
      const totalRequiredHours = item.client.requiredHours || 1;
      const existingTasks = item.tasks || [];
      const alreadyAssignedHours = existingTasks.reduce(
        (sum, t) => sum + t.durationMinutes / 60,
        0
      );

      const remainingHours = Math.max(0, totalRequiredHours - alreadyAssignedHours);
      addedHours = remainingHours > 0 ? remainingHours : totalRequiredHours;
      const reqMins = addedHours * 60;

      const startHour = chosenEmployee.shiftStart || "08:00";
      const [sHour, sMin] = startHour.split(":").map(Number);
      const calculatedEndHour = Math.min(22, sHour + Math.ceil(addedHours));
      const endHourStr = `${String(calculatedEndHour).padStart(2, "0")}:${String(sMin || 0).padStart(2, "0")}`;

      const newManualTask: Task = {
        id: `task-${item.client.id}-manual-${Date.now()}`,
        name: `Manual Shift (${item.client.careLevel})`,
        durationMinutes: reqMins,
        start: startHour,
        end: endHourStr,
        assignedStaffId: chosenEmployee.id,
        assignedStaffName: chosenEmployee.name,
      };

      const updatedTasks = [...existingTasks, newManualTask];
      const totalAssignedMins = updatedTasks.reduce((sum, t) => sum + t.durationMinutes, 0);
      const totalAssignedHours = totalAssignedMins / 60;

      const newStatus =
        totalAssignedHours >= totalRequiredHours
          ? ("Fully Assigned" as const)
          : ("Partially Assigned" as const);

      const hasExistingPrimary = item.primaryEmployeeId && item.primaryEmployeeId !== "UNASSIGNED";
      const primaryStaff = hasExistingPrimary
        ? { id: item.primaryEmployeeId, name: item.primaryEmployeeName, role: item.primaryEmployeeRole }
        : chosenEmployee;
      const secondaryStaff = hasExistingPrimary ? chosenEmployee : undefined;

      return {
        ...item,
        tasks: updatedTasks,
        primaryEmployeeId: primaryStaff.id,
        primaryEmployeeName: primaryStaff.name,
        primaryEmployeeRole: primaryStaff.role,
        secondaryEmployeeId: secondaryStaff?.id,
        secondaryEmployeeName: secondaryStaff?.name,
        secondaryEmployeeRole: secondaryStaff?.role,
        status: newStatus,
      };
    }
    return item;
  });

  const updatedWorkloads = { ...currentWorkloads };
  if (addedHours > 0) {
    updatedWorkloads[chosenEmployee.name] = Number(
      ((updatedWorkloads[chosenEmployee.name] || 0) + addedHours).toFixed(1)
    );
  }

  // Recalculate Missing Requirements (Gap Analysis)
  const unassignedOrPartial = updatedRoster.filter((item) => item.status !== "Fully Assigned");
  const missingSummary: Record<string, { totalHours: number; count: number; roleNeeded: string }> = {};

  unassignedOrPartial.forEach((item) => {
    const level = item.client.careLevel || "Standard Care";
    const totalH = item.client.requiredHours || 1;
    const assignedH = item.tasks.reduce((sum, t) => sum + t.durationMinutes / 60, 0);
    const unassignedH = Math.max(0, totalH - assignedH);

    const roleNeeded = level === "High Care" ? "Registered Nurse (RN)" : "Care Assistant / Carer";

    if (!missingSummary[level]) {
      missingSummary[level] = { totalHours: 0, count: 0, roleNeeded };
    }

    missingSummary[level].totalHours += unassignedH;
    missingSummary[level].count += 1;
  });

  const missingRequirements: MissingStaffRequirement[] = Object.entries(missingSummary).map(
    ([careLevel, data]) => ({
      careLevel,
      roleNeeded: data.roleNeeded,
      unassignedClientsCount: data.count,
      totalHoursNeeded: Number(data.totalHours.toFixed(1)),
      estimatedStaffCount: Math.ceil(data.totalHours / 8),
    })
  );

  return {
    updatedRoster,
    updatedWorkloads,
    missingRequirements,
  };
}