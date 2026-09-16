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
  careLevel: "HighCare" | "StandardCare" | "BasicCare" | string;
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

export function normalizeCareLevel(level?: string): "HighCare" | "StandardCare" | "BasicCare" {
  if (!level) return "StandardCare";
  const l = level.replace(/\s+/g, "");
  if (l.includes("High")) return "HighCare";
  if (l.includes("Basic")) return "BasicCare";
  return "StandardCare";
}

export function getRoleNeededForCareLevel(careLevel: string): string {
  const norm = normalizeCareLevel(careLevel);
  if (norm === "HighCare") return "RegisteredNurse / SeniorCareAssistant (Primary)";
  if (norm === "StandardCare") return "SeniorCareAssistant -> JuniorCareAssistant (Primary)";
  return "JuniorCareAssistant (Primary)";
}

export function matchesRoleForCareLevel(roleName?: string, careLevelName?: string, tier: "primary" | "secondary" = "primary"): boolean {
  if (!roleName) return false;
  const role = roleName.replace(/\s+/g, "").toLowerCase();
  const careLevel = normalizeCareLevel(careLevelName);

  if (careLevel === "HighCare") {
    if (tier === "primary") {
      return role.includes("registerednurse") || role.includes("seniorcareassistant") || role.includes("nurse");
    }
    return role.includes("assistant") || role.includes("worker") || role.includes("carer") || role.includes("junior");
  } 
  else if (careLevel === "StandardCare") {
    if (tier === "primary") {
      // StandardCare ke primary tier mein sirf Senior allow hain taake pehle senior assign ho
      return role.includes("seniorcareassistant") || role.includes("senior");
    }
    // Secondary tier mein Junior allow hain taake senior na milne par junior assign ho sake
    return role.includes("juniorcareassistant") || role.includes("junior") || role.includes("assistant") || role.includes("carer");
  } 
  else { // BasicCare
    if (tier === "primary") {
      return role.includes("juniorcareassistant") || role.includes("junior") || role.includes("assistant");
    }
    return role.includes("assistant") || role.includes("staff") || role.includes("carer") || role.includes("worker");
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

export function getEmployeeDailyMaxHours(emp: Employee): number {
  if (emp.maxHoursPerDay && emp.maxHoursPerDay > 0) {
    return emp.maxHoursPerDay;
  }
  if (emp.isFixedTime && emp.shiftStart && emp.shiftEnd) {
    const start = timeToMinutes(emp.shiftStart, "09:00");
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

  const careLevelPriority: Record<string, number> = {
    "HighCare": 3,
    "StandardCare": 2,
    "BasicCare": 1,
  };

  const sortedClients = [...clients].sort((a, b) => {
    const prioA = careLevelPriority[normalizeCareLevel(a.careLevel)] || 0;
    const prioB = careLevelPriority[normalizeCareLevel(b.careLevel)] || 0;
    return prioB - prioA;
  });

  const roster: FinalRosterItem[] = [];

  for (const client of sortedClients) {
    const totalRequiredHours = Number(client.requiredHours) || 1;
    const totalRequiredMins = totalRequiredHours * 60;
    const travelMarginMins = 30;

    let remainingMinsToAssign = totalRequiredMins;
    let baseStartMins = timeToMinutes(client.preferredStart, "09:00");

    const assignedTasks: Task[] = [];
    const assignedStaffMembers: Employee[] = [];

    const tryAssignStaff = (
      reqMins: number,
      targetStartMins: number
    ): { emp: Employee; start: number; end: number } | null => {
      
      const findCandidateForTier = (tier: "primary" | "secondary") => {
        const eligibleCandidates = employees.filter((emp) => {
          if (assignedStaffMembers.some((s) => s.id === emp.id)) return false;
          return matchesRoleForCareLevel(emp.role, client.careLevel, tier);
        });

        return [...eligibleCandidates].sort((a, b) => {
          const careLevel = normalizeCareLevel(client.careLevel);
          const aRole = a.role.replace(/\s+/g, "").toLowerCase();
          const bRole = b.role.replace(/\s+/g, "").toLowerCase();
          
          if (careLevel === "HighCare" && tier === "primary") {
            const aIsRN = aRole.includes("registerednurse") ? 1 : 0;
            const bIsRN = bRole.includes("registerednurse") ? 1 : 0;
            if (aIsRN !== bIsRN) {
              return bIsRN - aIsRN; 
            }
          }

          if (careLevel === "BasicCare" && tier === "primary") {
            const aIsJunior = aRole.includes("junior") ? 1 : 0;
            const bIsJunior = bRole.includes("junior") ? 1 : 0;
            if (aIsJunior !== bIsJunior) {
              return bIsJunior - aIsJunior; 
            }
          }

          const aCap = (getEmployeeDailyMaxHours(a) - (employeeWorkloads[a.name] || 0)) * 60;
          const bCap = (getEmployeeDailyMaxHours(b) - (employeeWorkloads[b.name] || 0)) * 60;
          
          const aCanCoverFull = aCap >= reqMins ? 1 : 0;
          const bCanCoverFull = bCap >= reqMins ? 1 : 0;

          if (aCanCoverFull !== bCanCoverFull) {
            return bCanCoverFull - aCanCoverFull;
          }

          const aSameLoc = (a.location || "").trim() === (client.location || "").trim();
          const bSameLoc = (b.location || "").trim() === (client.location || "").trim();

          if (aSameLoc && !bSameLoc) return -1;
          if (!aSameLoc && bSameLoc) return 1;

          return (employeeWorkloads[a.name] || 0) - (employeeWorkloads[b.name] || 0);
        });
      };

      // 1. Sab se pehle primary tier (StandardCare ke liye Senior) check karega
      let sortedCandidates = findCandidateForTier("primary");

      // 2. Agar primary tier mein koi senior available na ho, tab secondary tier (Junior) par move karega
      if (sortedCandidates.length === 0) {
        sortedCandidates = findCandidateForTier("secondary");
      }

      for (const emp of sortedCandidates) {
        const isFixedEmp = Boolean(emp.isFixedTime);
        const empShiftStart = isFixedEmp ? timeToMinutes(emp.shiftStart, "09:00") : 9 * 60;
        const empShiftEnd = isFixedEmp ? timeToMinutes(emp.shiftEnd, "17:00") : 20 * 60;

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

        if (client.isFixedTime) {
          const clientStart = timeToMinutes(client.preferredStart, "09:00");
          const clientEnd = clientStart + assignableMins;

          if (clientStart < empShiftStart || clientEnd > empShiftEnd) continue;

          const empHasOverlap = existingEmpSlots.some((slot) =>
            hasTimeOverlap(clientStart, clientEnd, slot.startMins, slot.endMins, travelMarginMins)
          );
          if (empHasOverlap) continue;

          const clientHasOverlap = existingClientSlots.some((slot) =>
            hasTimeOverlap(clientStart, clientEnd, slot.startMins, slot.endMins, 0)
          );
          if (clientHasOverlap) continue;

          return { emp, start: clientStart, end: clientEnd };
        }

        let candidateStart = Math.max(targetStartMins, empShiftStart);
        let candidateEnd = candidateStart + assignableMins;

        let slotFound = false;
        while (candidateEnd <= empShiftEnd) {
          let hasOverlap = false;

          for (const slot of existingEmpSlots) {
            if (hasTimeOverlap(candidateStart, candidateEnd, slot.startMins, slot.endMins, travelMarginMins)) {
              hasOverlap = true;
              candidateStart = slot.endMins + travelMarginMins;
              candidateEnd = candidateStart + assignableMins;
              break;
            }
          }

          if (hasOverlap) continue;

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

  const unassignedOrPartial = roster.filter((item) => item.status !== "Fully Assigned");
  const missingSummary: Record<string, { totalHours: number; count: number; roleNeeded: string }> = {};

  ["HighCare", "StandardCare", "BasicCare"].forEach((level) => {
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
    const lastClientSlot = [...clientExistingSlots].sort((a, b) => b.endMins - a.endMins)[0];
    candidateStart = Math.max(candidateStart, lastClientSlot.endMins + travelBuffer);
  }

  let candidateEnd = candidateStart + reqMins;
  let slotFound = false;

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
      if (candidateEnd <= empShiftEnd) {
        slotFound = true;
      }
      break;
    }
  }

  if (!slotFound) {
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

  const unassignedOrPartial = updatedRoster.filter((item) => item.status !== "Fully Assigned");
  const missingSummary: Record<string, { totalHours: number; count: number; roleNeeded: string }> = {};

  ["HighCare", "StandardCare", "BasicCare"].forEach((level) => {
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

export function rosterToShifts(roster: FinalRosterItem[], dateStr: string): ShiftRecord[] {
  const shifts: ShiftRecord[] = [];
  roster.forEach((item) => {
    item.tasks.forEach((task, idx) => {
      const durationHours = Number((task.durationMinutes / 60).toFixed(1));
      shifts.push({
        id: `shift-${item.client.id}-${task.id || idx}-${Date.now()}`,
        employeeId: task.assignedStaffId || item.primaryEmployeeId,
        employeeName: task.assignedStaffId ? task.assignedStaffName : item.primaryEmployeeName,
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