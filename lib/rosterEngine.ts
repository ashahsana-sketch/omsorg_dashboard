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
  careLevel: "High Care" | "Standard Care" | "Basic Care" | "Basic care" | "Low Care" | string;
  isFixedTime: boolean;
  preferredStart?: string;
  preferredEnd?: string;
  requiredHours: number;
  location: string;
  services?: string[];
  tasks?: Task[];
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  qualification?: string;
  location?: string;
  isFixedTime?: boolean;
  maxHours?: number;
  maxHoursPerDay?: number;
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

export function normalizeCareLevel(level?: string): "High Care" | "Standard Care" | "Basic Care" {
  if (!level) return "Standard Care";
  const l = level.toLowerCase().trim();
  if (l.includes("high")) return "High Care";
  if (l.includes("basic") || l.includes("low")) return "Basic Care";
  return "Standard Care";
}

export function getRoleNeededForCareLevel(careLevel: string): string {
  const norm = normalizeCareLevel(careLevel);
  if (norm === "High Care") return "Registered Nurse (RN) / Senior Care Worker";
  if (norm === "Standard Care") return "Care Assistant";
  return "Support Worker";
}

/**
 * Priority Rule 1: Role-to-Care-Level Matching
 * - Registered Nurses and Senior Care Workers exclusively -> High Care
 * - Care Assistants exclusively -> Standard Care
 * - Support Workers exclusively -> Basic Care
 */
export function matchesRoleForCareLevel(roleName?: string, careLevelName?: string): boolean {
  if (!roleName) return false;
  const role = roleName.toLowerCase().trim();
  const careLevel = normalizeCareLevel(careLevelName);

  const isHighCareRole =
    role.includes("nurse") ||
    role.includes("rn") ||
    role.includes("senior care");

  const isStandardCareRole =
    role.includes("care assistant") && !role.includes("senior");

  const isBasicCareRole =
    role.includes("support") ||
    role.includes("home care") ||
    (!isHighCareRole && !isStandardCareRole);

  if (careLevel === "High Care") {
    return isHighCareRole;
  } else if (careLevel === "Standard Care") {
    return isStandardCareRole;
  } else {
    // Basic Care / Low Care
    return isBasicCareRole;
  }
}

export function timeToMinutes(timeStr?: string, defaultTime: string = "08:00"): number {
  const safeTime =
    timeStr && typeof timeStr === "string" && timeStr.includes(":")
      ? timeStr
      : defaultTime;

  const [h, m] = safeTime.split(":").map(Number);
  return (isNaN(h) ? 8 : h) * 60 + (isNaN(m) ? 0 : m);
}

export function minutesToTime(mins: number): string {
  const safeMins = Math.max(0, Math.min(23 * 60 + 59, Math.round(mins)));
  const h = Math.floor(safeMins / 60);
  const m = safeMins % 60;
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

  // Sort clients: Fixed time first, then High Care -> Standard Care -> Basic Care
  const careLevelPriority: Record<string, number> = {
    "High Care": 3,
    "Standard Care": 2,
    "Basic Care": 1,
  };

  const sortedClients = [...clients].sort((a, b) => {
    if (a.isFixedTime && !b.isFixedTime) return -1;
    if (!a.isFixedTime && b.isFixedTime) return 1;

    const prioA = careLevelPriority[normalizeCareLevel(a.careLevel)] || 0;
    const prioB = careLevelPriority[normalizeCareLevel(b.careLevel)] || 0;
    return prioB - prioA;
  });

  const roster: FinalRosterItem[] = [];

  for (const client of sortedClients) {
    const totalRequiredHours = Number(client.requiredHours) || 1;
    const totalRequiredMins = totalRequiredHours * 60;
    const travelMarginMins = 15; // 15 mins buffer between visits

    let remainingMinsToAssign = totalRequiredMins;
    let baseStartMins = timeToMinutes(client.preferredStart, "08:00");

    const assignedTasks: Task[] = [];
    const assignedStaffMembers: Employee[] = [];

    /**
     * Attempts to find and assign an employee according to the 3-Tier Priority Rules:
     * 1. Role-to-Care-Level Matching (exclusive match)
     * 2. Location Matching & Fallback (same location first, then cross-location)
     * 3. Working Hours & Shift Constraints (max 8h/day flexible, strict window for fixed)
     */
    const tryAssignStaff = (
      reqMins: number,
      targetStartMins: number
    ): { emp: Employee; start: number; end: number } | null => {
      // Filter candidates that match the exact role for this care level
      const eligibleCandidates = employees.filter((emp) => {
        if (assignedStaffMembers.some((s) => s.id === emp.id)) return false;
        return matchesRoleForCareLevel(emp.role, client.careLevel);
      });

      // Priority 2: Sort candidates: Same location first, then cross-location
      const sortedCandidates = [...eligibleCandidates].sort((a, b) => {
        const aSameLoc = (a.location || "").toLowerCase().trim() === (client.location || "").toLowerCase().trim();
        const bSameLoc = (b.location || "").toLowerCase().trim() === (client.location || "").toLowerCase().trim();

        if (aSameLoc && !bSameLoc) return -1;
        if (!aSameLoc && bSameLoc) return 1;

        // Balance workload among same-priority candidates
        return (employeeWorkloads[a.name] || 0) - (employeeWorkloads[b.name] || 0);
      });

      for (const emp of sortedCandidates) {
        const isFixedEmp = Boolean(emp.isFixedTime);
        const empShiftStart = isFixedEmp ? timeToMinutes(emp.shiftStart, "08:00") : 8 * 60; // 08:00
        const empShiftEnd = isFixedEmp ? timeToMinutes(emp.shiftEnd, "17:00") : 20 * 60; // 20:00

        // Priority 3: Maximum 8 hours per day for flexible staff (or defined maxHours)
        const dailyMaxHours = isFixedEmp
          ? Math.max(1, (empShiftEnd - empShiftStart) / 60)
          : Math.min(8, emp.maxHoursPerDay || (emp.maxHours ? Math.min(8, emp.maxHours) : 8));
        
        const maxDailyMins = dailyMaxHours * 60;
        const currentWorkloadMins = (employeeWorkloads[emp.name] || 0) * 60;
        const availableCapacity = maxDailyMins - currentWorkloadMins;

        if (availableCapacity <= 0) continue;

        const assignableMins = Math.min(reqMins, availableCapacity);
        if (assignableMins <= 0) continue;

        const existingSlots = (employeeSchedules[emp.id] || []).sort(
          (a, b) => a.startMins - b.startMins
        );

        // If client has fixed time, strictly try that specific window
        if (client.isFixedTime) {
          const clientStart = timeToMinutes(client.preferredStart, "09:00");
          const clientEnd = clientStart + assignableMins;

          // Check if employee's shift bounds contain the client time
          if (clientStart < empShiftStart || clientEnd > empShiftEnd) {
            continue;
          }

          // Check overlap with existing employee slots
          const hasOverlap = existingSlots.some((slot) => {
            const slotStartWithMargin = slot.startMins - travelMarginMins;
            const slotEndWithMargin = slot.endMins + travelMarginMins;
            return clientStart < slotEndWithMargin && clientEnd > slotStartWithMargin;
          });

          if (!hasOverlap) {
            return { emp, start: clientStart, end: clientEnd };
          }
          continue;
        }

        // Flexible client: Find earliest available non-overlapping slot within employee shift bounds
        let candidateStart = Math.max(targetStartMins, empShiftStart);
        let candidateEnd = candidateStart + assignableMins;

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

    // Primary Shift Assignment
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
      currentStart = end + travelMarginMins;
    }

    // Secondary Shift Assignment (if client required more hours than 1 staff could cover)
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

  // Gap Analysis Calculation
  const unassignedOrPartial = roster.filter((item) => item.status !== "Fully Assigned");
  const missingSummary: Record<string, { totalHours: number; count: number; roleNeeded: string }> = {};

  // Standardize 3 tiers
  ["High Care", "Standard Care", "Basic Care"].forEach((level) => {
    missingSummary[level] = {
      totalHours: 0,
      count: 0,
      roleNeeded: getRoleNeededForCareLevel(level),
    };
  });

  unassignedOrPartial.forEach((item) => {
    const level = normalizeCareLevel(item.client.careLevel);
    const totalHours = Number(item.client.requiredHours) || 1;
    const assignedHours = item.tasks.reduce((sum, t) => sum + t.durationMinutes / 60, 0);
    const unassignedHours = Math.max(0, totalHours - assignedHours);

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
      const totalRequiredHours = Number(item.client.requiredHours) || 1;
      const existingTasks = item.tasks || [];
      const alreadyAssignedHours = existingTasks.reduce(
        (sum, t) => sum + t.durationMinutes / 60,
        0
      );

      const remainingHours = Math.max(0, totalRequiredHours - alreadyAssignedHours);
      addedHours = remainingHours > 0 ? remainingHours : totalRequiredHours;
      const reqMins = addedHours * 60;

      const isFixed = Boolean(chosenEmployee.isFixedTime);
      const startHour = isFixed && chosenEmployee.shiftStart ? chosenEmployee.shiftStart : "08:00";
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

  // Recalculate Gap Analysis
  const unassignedOrPartial = updatedRoster.filter((item) => item.status !== "Fully Assigned");
  const missingSummary: Record<string, { totalHours: number; count: number; roleNeeded: string }> = {};

  ["High Care", "Standard Care", "Basic Care"].forEach((level) => {
    missingSummary[level] = {
      totalHours: 0,
      count: 0,
      roleNeeded: getRoleNeededForCareLevel(level),
    };
  });

  unassignedOrPartial.forEach((item) => {
    const level = normalizeCareLevel(item.client.careLevel);
    const totalH = Number(item.client.requiredHours) || 1;
    const assignedH = item.tasks.reduce((sum, t) => sum + t.durationMinutes / 60, 0);
    const unassignedH = Math.max(0, totalH - assignedH);

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