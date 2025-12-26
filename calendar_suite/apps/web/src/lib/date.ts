export type YMD = { y: number; m: number; d: number }; // m: 1-12

export function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function toISODate({ y, m, d }: YMD) {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function fromDate(date: Date): YMD {
  return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() };
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function startOfMonth(y: number, m1: number) {
  return new Date(y, m1 - 1, 1);
}

export function endOfMonth(y: number, m1: number) {
  return new Date(y, m1, 0);
}

/**
 * 월간 캘린더 6행(42칸) 그리드 생성
 * - 주 시작: 일요일
 */
export function buildMonthGrid(y: number, m1: number) {
  const first = startOfMonth(y, m1);
  const firstDow = first.getDay(); // 0=Sun
  const gridStart = addDays(first, -firstDow);

  const cells = Array.from({ length: 42 }).map((_, i) => {
    const date = addDays(gridStart, i);
    return { date, inMonth: date.getMonth() === m1 - 1 };
  });

  const rows = Array.from({ length: 6 }).map((_, r) => cells.slice(r * 7, r * 7 + 7));
  return { cells, rows, gridStart };
}

export function monthTitle(y: number, m1: number) {
  const now = new Date();
  if (y === now.getFullYear()) return `${m1}월`;
  return `${y}년 ${m1}월`;
}

export function isSunday(date: Date) {
  return date.getDay() === 0;
}

export function isPast(date: Date, today = new Date()) {
  const a = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const b = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return a < b;
}

export function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function getDDay(targetDate: string) {
  const target = new Date(targetDate.slice(0, 10));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "D-Day";
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

// Simple holiday list for 2024-2025 (KR)
const HOLIDAYS: Record<string, string> = {
  "01-01": "신정",
  "03-01": "3.1절",
  "05-05": "어린이날",
  "06-06": "현충일",
  "08-15": "광복절",
  "10-03": "개천절",
  "10-09": "한글날",
  "12-25": "성탄절",
};

// Lunar holidays (approximate for 2024-2025)
const LUNAR_HOLIDAYS: Record<string, string> = {
  "2024-02-09": "설날 연휴",
  "2024-02-10": "설날",
  "2024-02-11": "설날 연휴",
  "2024-02-12": "대체공휴일",
  "2024-05-15": "부처님오신날",
  "2024-09-16": "추석 연휴",
  "2024-09-17": "추석",
  "2024-09-18": "추석 연휴",
  "2025-01-28": "설날 연휴",
  "2025-01-29": "설날",
  "2025-01-30": "설날 연휴",
  "2025-05-05": "부처님오신날",
  "2025-05-06": "대체공휴일",
  "2025-10-06": "추석",
};

export function getHoliday(d: Date): string | null {
  const iso = isoDate(d);
  const md = iso.slice(5); // MM-DD

  if (LUNAR_HOLIDAYS[iso]) return LUNAR_HOLIDAYS[iso];
  if (HOLIDAYS[md]) return HOLIDAYS[md];

  return null;
}
