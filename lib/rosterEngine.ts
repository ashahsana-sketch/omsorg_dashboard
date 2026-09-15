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

export interface ShiftRecord {
  id: string;
  employeeId?: string;
  employeeName: string;
  employeeRole?: string;
  clientId?: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  durationHours?: number;
  location: string;
  careLevel?: string;
  status: "Scheduled" | "Completed" | "In-Progress";
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

/**
 * Enforces Registered Maximum Working Hours for each employee:
 * - If maxHoursPerDay is explicitly given, uses that limit.
 * - For fixed shifts, uses (shiftEnd - shiftStart).
 * - For weekly maxHours (e.g., 40h/week or 35h/week), computes standard daily max = maxHours / 5.
 * - Caps flexible daily limit at 8.0 hours.
 */
export function getEmployeeDailyMaxHours(emp: Employee): number {
  if (emp.maxHoursPerDay && emp.maxHoursPerDay > 0) {
    return emp.maxHoursPerDay;
  }
  if (emp.isFixedTime && emp.shiftStart && emp.shiftEnd) {
    const start = timeToMinutes(emp.shiftStart, "08:00");
    const end = timeToMinutes(emp.shiftEnd, "17:00");
    const fixedHours = Math.max(0, (end - start) / 60);
    if (emp.maxHours && emp.maxHours > 0) {
      const dailyCap = emp.maxHours <= 12 ? emp.maxHours : emp.maxHours / 5;
      return Math.min(fixedHours, dailyCap);
    }
    return fixedHours;
  }
  if (emp.maxHours && emp.maxHours > 0) {
    const daily = emp.maxHours <= 12 ? emp.maxHours : emp.maxHours / 5;
    return Math.min(8.0, Number(daily.toFixed(1)));
  }
  return 8.0;
}

/**
 * Checks if two time intervals overlap (with an optional travel buffer).
 */
export function hasTimeOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
  bufferMins: number = 0
): boolean {
  return start1 < end2 + bufferMins && end1 > start2 - bufferMins;
}

interface ScheduleSlot {
  id?: string;
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
  const clientSchedules: Record<string, ScheduleSlot[]> = {};

  if (!Array.isArray(clients) || !Array.isArray(employees)) {
    return { roster: [], employeeWorkloads: {}, missingRequirements: [] };
  }

  employees.forEach((emp) => {
    employeeWorkloads[emp.name] = 0;
    employeeSchedules[emp.id] = [];
  });

  clients.forEach((client) => {
    clientSchedules[client.id] = [];
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
    const travelMarginMins = 15; // 15 mins buffer between consecutive visits

    let remainingMinsToAssign = totalRequiredMins;
    let baseStartMins = timeToMinutes(client.preferredStart, "08:00");

    const assignedTasks: Task[] = [];
    const assignedStaffMembers: Employee[] = [];

    /**
     * Attempts to find and assign an employee according to all constraints:
     * 1. Role-to-Care-Level Matching (exclusive match)
     * 2. Location Matching & Fallback (same location first, then cross-location)
     * 3. Working Hours & Shift Constraints (strictly enforces daily registered max hours)
     * 4. Double-Booking Prevention (strictly verifies no overlap for employee OR client)
     */
    const tryAssignStaff = (
      reqMins: number,
      targetStartMins: number
    ): { emp: Employee; start: number; end: number } | null => {
      // 1. Role matching
      const eligibleCandidates = employees.filter((emp) => {
        if (assignedStaffMembers.some((s) => s.id === emp.id)) return false;
        return matchesRoleForCareLevel(emp.role, client.careLevel);
      });

      // 2. Location matching priority
      const sortedCandidates = [...eligibleCandidates].sort((a, b) => {
        const aSameLoc = (a.location || "").toLowerCase().trim() === (client.location || "").toLowerCase().trim();
        const bSameLoc = (b.location || "").toLowerCase().trim() === (client.location || "").toLowerCase().trim();

        if (aSameLoc && !bSameLoc) return -1;
        if (!aSameLoc && bSameLoc) return 1;

        // Workload balancing
        return (employeeWorkloads[a.name] || 0) - (employeeWorkloads[b.name] || 0);
      });

      for (const emp of sortedCandidates) {
        const isFixedEmp = Boolean(emp.isFixedTime);
        const empShiftStart = isFixedEmp ? timeToMinutes(emp.shiftStart, "08:00") : 8 * 60; // 08:00
        const empShiftEnd = isFixedEmp ? timeToMinutes(emp.shiftEnd, "17:00") : 20 * 60; // 20:00

        // 3. Strictly enforce registered max working hours
        const dailyMaxHours = getEmployeeDailyMaxHours(emp);
        const maxDailyMins = dailyMaxHours * 60;
        const currentWorkloadMins = (employeeWorkloads[emp.name] || 0) * 60;
        const availableCapacity = maxDailyMins - currentWorkloadMins;

        if (availableCapacity <= 0) continue;

        const assignableMins = Math.min(reqMins, availableCapacity);
        if (assignableMins <= 0) continue;

        const existingEmpSlots = (employeeSchedules[emp.id] || []).sort(
          (a, b) => a.startMins - b.startMins
        );
        const existingClientSlots = (clientSchedules[client.id] || []).sort(
          (a, b) => a.startMins - b.startMins
        );

        // Fixed-time client: strictly check the exact requested window
        if (client.isFixedTime) {
          const clientStart = timeToMinutes(client.preferredStart, "09:00");
          const clientEnd = clientStart + assignableMins;

          // Must be within employee shift bounds
          if (clientStart < empShiftStart || clientEnd > empShiftEnd) {
            continue;
          }

          // Double-booking check: No overlap with employee's existing slots
          const empHasOverlap = existingEmpSlots.some((slot) =>
            hasTimeOverlap(clientStart, clientEnd, slot.startMins, slot.endMins, travelMarginMins)
          );
          if (empHasOverlap) continue;

          // Double-booking check: No overlap with client's existing slots
          const clientHasOverlap = existingClientSlots.some((slot) =>
            hasTimeOverlap(clientStart, clientEnd, slot.startMins, slot.endMins, 0)
          );
          if (clientHasOverlap) continue;

          return { emp, start: clientStart, end: clientEnd };
        }

        // Flexible client: Find earliest valid non-overlapping slot
        let candidateStart = Math.max(targetStartMins, empShiftStart);
        let candidateEnd = candidateStart + assignableMins;

        let slotFound = false;
        while (candidateEnd <= empShiftEnd) {
          let hasOverlap = false;

          // Check employee existing slots (with travel buffer)
          for (const slot of existingEmpSlots) {
            if (hasTimeOverlap(candidateStart, candidateEnd, slot.startMins, slot.endMins, travelMarginMins)) {
              hasOverlap = true;
              candidateStart = slot.endMins + travelMarginMins;
              candidateEnd = candidateStart + assignableMins;
              break;
            }
          }

          if (hasOverlap) continue;

          // Check client existing slots
          for (const slot of existingClientSlots) {
            if (hasTimeOverlap(candidateStart, candidateEnd, slot.startMins, slot.endMins, 0)) {
              hasOverlap = true;
              candidateStart = slot.endMins;
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
        startMins: start,
        endMins: end,
      });

      clientSchedules[client.id].push({
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
          startMins: start,
          endMins: end,
        });

        clientSchedules[client.id].push({
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
 * Helper function to handle manual staff assignment:
 * - Validates and strictly prevents exceeding the employee's registered maximum working hours.
 * - Validates and strictly prevents double-booking time slot overlaps.
 * - Dynamically calculates non-overlapping shift times and updates workloads.
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
  error?: string;
} {
  const targetItem = currentRoster.find((item) => item.client.id === clientId);
  if (!targetItem) {
    return {
      updatedRoster: currentRoster,
      updatedWorkloads: currentWorkloads,
      missingRequirements: [],
      error: "Client not found in roster",
    };
  }

  const totalRequiredHours = Number(targetItem.client.requiredHours) || 1;
  const existingClientTasks = targetItem.tasks || [];
  const alreadyAssignedHours = existingClientTasks.reduce(
    (sum, t) => sum + t.durationMinutes / 60,
    0
  );

  const remainingHoursNeeded = Math.max(0, totalRequiredHours - alreadyAssignedHours);
  if (remainingHoursNeeded <= 0) {
    return {
      updatedRoster: currentRoster,
      updatedWorkloads: currentWorkloads,
      missingRequirements: [],
      error: `Client ${targetItem.client.name} is already fully assigned (${totalRequiredHours}h).`,
    };
  }

  // 1. Check employee maximum registered working hours
  const dailyMax = getEmployeeDailyMaxHours(chosenEmployee);
  const currentEmpWorkload = currentWorkloads[chosenEmployee.name] || 0;
  const availableEmpCapacity = Math.max(0, Number((dailyMax - currentEmpWorkload).toFixed(1)));

  if (availableEmpCapacity <= 0) {
    return {
      updatedRoster: currentRoster,
      updatedWorkloads: currentWorkloads,
      missingRequirements: [],
      error: `Cannot assign ${chosenEmployee.name}. Maximum registered daily hours (${dailyMax}h) already reached! Current workload: ${currentEmpWorkload}h.`,
    };
  }

  const addedHours = Math.min(remainingHoursNeeded, availableEmpCapacity);
  const reqMins = Math.round(addedHours * 60);

  // 2. Prevent Double-Booking / Time Overlaps:
  // Gather all existing tasks across all clients assigned to chosenEmployee
  const empExistingSlots: ScheduleSlot[] = [];
  currentRoster.forEach((item) => {
    item.tasks.forEach((t) => {
      if (t.assignedStaffId === chosenEmployee.id || t.assignedStaffName === chosenEmployee.name) {
        empExistingSlots.push({
          startMins: timeToMinutes(t.start),
          endMins: timeToMinutes(t.end),
        });
      }
    });
  });

  // Gather existing tasks for this client
  const clientExistingSlots: ScheduleSlot[] = existingClientTasks.map((t) => ({
    startMins: timeToMinutes(t.start),
    endMins: timeToMinutes(t.end),
  }));

  const isFixed = Boolean(chosenEmployee.isFixedTime);
  const empShiftStart = isFixed && chosenEmployee.shiftStart ? timeToMinutes(chosenEmployee.shiftStart, "08:00") : 8 * 60;
  const empShiftEnd = isFixed && chosenEmployee.shiftEnd ? timeToMinutes(chosenEmployee.shiftEnd, "17:00") : 20 * 60;
  const travelBuffer = 15;

  let candidateStart = empShiftStart;
  if (targetItem.client.preferredStart && targetItem.client.isFixedTime) {
    candidateStart = timeToMinutes(targetItem.client.preferredStart, "08:00");
  } else if (clientExistingSlots.length > 0) {
    // If client already has a shift, schedule after it
    const lastClientSlot = [...clientExistingSlots].sort((a, b) => b.endMins - a.endMins)[0];
    candidateStart = Math.max(candidateStart, lastClientSlot.endMins + travelBuffer);
  }

  let candidateEnd = candidateStart + reqMins;
  let slotFound = false;

  while (candidateEnd <= empShiftEnd) {
    let hasOverlap = false;

    // Check employee existing slots
    for (const slot of empExistingSlots) {
      if (hasTimeOverlap(candidateStart, candidateEnd, slot.startMins, slot.endMins, travelBuffer)) {
        hasOverlap = true;
        candidateStart = slot.endMins + travelBuffer;
        candidateEnd = candidateStart + reqMins;
        break;
      }
    }

    if (hasOverlap) continue;

    // Check client existing slots
    for (const slot of clientExistingSlots) {
      if (hasTimeOverlap(candidateStart, candidateEnd, slot.startMins, slot.endMins, 0)) {
        hasOverlap = true;
        candidateStart = slot.endMins;
        candidateEnd = candidateStart + reqMins;
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

  if (!slotFound) {
    // Fallback search from earliest operating time
    candidateStart = empShiftStart;
    candidateEnd = candidateStart + reqMins;
    while (candidateEnd <= empShiftEnd) {
      let hasOverlap = false;
      for (const slot of empExistingSlots) {
        if (hasTimeOverlap(candidateStart, candidateEnd, slot.startMins, slot.endMins, travelBuffer)) {
          hasOverlap = true;
          candidateStart = slot.endMins + travelBuffer;
          candidateEnd = candidateStart + reqMins;
          break;
        }
      }
      if (hasOverlap) continue;
      for (const slot of clientExistingSlots) {
        if (hasTimeOverlap(candidateStart, candidateEnd, slot.startMins, slot.endMins, 0)) {
          hasOverlap = true;
          candidateStart = slot.endMins;
          candidateEnd = candidateStart + reqMins;
          break;
        }
      }
      if (!hasOverlap) {
        if (candidateEnd <= empShiftEnd) slotFound = true;
        break;
      }
    }
  }

  const finalStartMins = slotFound ? candidateStart : empShiftStart;
  const finalEndMins = finalStartMins + reqMins;

  const newManualTask: Task = {
    id: `task-${targetItem.client.id}-manual-${Date.now()}`,
    name: `Manual Shift (${targetItem.client.careLevel})`,
    durationMinutes: reqMins,
    start: minutesToTime(finalStartMins),
    end: minutesToTime(finalEndMins),
    assignedStaffId: chosenEmployee.id,
    assignedStaffName: chosenEmployee.name,
  };

  const updatedTasks = [...existingClientTasks, newManualTask];
  const totalAssignedMins = updatedTasks.reduce((sum, t) => sum + t.durationMinutes, 0);
  const totalAssignedHours = Number((totalAssignedMins / 60).toFixed(1));

  const newStatus =
    totalAssignedHours >= totalRequiredHours
      ? ("Fully Assigned" as const)
      : ("Partially Assigned" as const);

  const hasExistingPrimary = targetItem.primaryEmployeeId && targetItem.primaryEmployeeId !== "UNASSIGNED";
  const primaryStaff = hasExistingPrimary
    ? { id: targetItem.primaryEmployeeId, name: targetItem.primaryEmployeeName, role: targetItem.primaryEmployeeRole }
    : chosenEmployee;
  const secondaryStaff = hasExistingPrimary && targetItem.primaryEmployeeId !== chosenEmployee.id ? chosenEmployee : undefined;

  const updatedRoster = currentRoster.map((item) => {
    if (item.client.id === clientId) {
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
  updatedWorkloads[chosenEmployee.name] = Number(
    ((updatedWorkloads[chosenEmployee.name] || 0) + addedHours).toFixed(1)
  );

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

/**
 * Converts a generated/updated roster into persistent Shift records for backend storage.
 */
export function rosterToShifts(roster: FinalRosterItem[], dateStr: string): ShiftRecord[] {
  const shifts: ShiftRecord[] = [];
  roster.forEach((item) => {
    item.tasks.forEach((task, idx) => {
      const durationHours = Number((task.durationMinutes / 60).toFixed(1));
      shifts.push({
        id: `shift-${item.client.id}-${task.id || idx}-${dateStr}`,
        employeeId: task.assignedStaffId || item.primaryEmployeeId,
        employeeName: task.assignedStaffName || item.primaryEmployeeName,
        employeeRole: item.primaryEmployeeRole,
        clientId: item.client.id,
        clientName: item.client.name,
        date: dateStr,
        startTime: task.start,
        endTime: task.end,
        durationHours,
        location: item.client.location || "Stockholm",
        careLevel: item.client.careLevel,
        status: "Scheduled",
      });
    });
  });
  return shifts;
}