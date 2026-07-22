export type JudicialOrderDeadlineStatus = "running" | "today" | "missed" | "unknown";

export type JudicialOrderDeadlineResult = {
  status: JudicialOrderDeadlineStatus;
  receivedDate: Date | null;
  baseDeadline: Date | null;
  deadline: Date | null;
  daysLeft: number | null;
  movedFromWeekend: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function calculateJudicialOrderDeadline(params: {
  alreadyMissed?: boolean;
  receivedDateValue?: string;
  today?: Date;
  unknownReceiptDate?: boolean;
}): JudicialOrderDeadlineResult {
  if (params.alreadyMissed) return emptyResult("missed");
  if (params.unknownReceiptDate) return emptyResult("unknown");

  const receivedDate = parseInputDate(params.receivedDateValue);
  if (!receivedDate) return emptyResult("unknown");

  const baseDeadline = addDays(receivedDate, 10);
  const deadline = moveWeekendToMonday(baseDeadline);
  const today = startOfDay(params.today ?? new Date());
  const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / DAY_MS);
  const status: JudicialOrderDeadlineStatus = daysLeft < 0 ? "missed" : daysLeft === 0 ? "today" : "running";

  return {
    status,
    receivedDate,
    baseDeadline,
    deadline,
    daysLeft,
    movedFromWeekend: deadline.getTime() !== baseDeadline.getTime()
  };
}

export function formatDateForInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function emptyResult(status: JudicialOrderDeadlineStatus): JudicialOrderDeadlineResult {
  return { status, receivedDate: null, baseDeadline: null, deadline: null, daysLeft: null, movedFromWeekend: false };
}

function parseInputDate(value: string | undefined) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

function moveWeekendToMonday(date: Date) {
  const next = new Date(date);
  if (next.getDay() === 6) next.setDate(next.getDate() + 2);
  if (next.getDay() === 0) next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}
