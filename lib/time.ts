// 15分刻みのスロット生成・整形

const SLOT_MIN = 15;
const SLOTS_PER_DAY = (24 * 60) / SLOT_MIN; // = 96
const SLOTS_PER_HOUR = 60 / SLOT_MIN; // = 4

export function floorTo15Min(d: Date): Date {
  const x = new Date(d);
  x.setSeconds(0, 0);
  x.setMinutes(Math.floor(x.getMinutes() / SLOT_MIN) * SLOT_MIN);
  return x;
}

// 指定日の 00:00 〜 24:00 を 15分刻みで返す（96個）
export function slotsOfDay(date: Date): Date[] {
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);
  const out: Date[] = [];
  for (let i = 0; i < SLOTS_PER_DAY; i++) {
    out.push(new Date(base.getTime() + i * SLOT_MIN * 60 * 1000));
  }
  return out;
}

// 指定日・指定時間帯（hourStart〜hourEnd）を 15分刻みで返す
export function slotsOfDayRange(
  date: Date,
  hourStart: number,
  hourEnd: number
): Date[] {
  return slotsOfDay(date).filter((d) => {
    const h = d.getHours();
    return h >= hourStart && h < hourEnd;
  });
}

// 1時間ぶんの15分刻み（:00 :15 :30 :45）を返す
export function quartersOfHour(date: Date, hour: number): Date[] {
  const base = new Date(date);
  base.setHours(hour, 0, 0, 0);
  const out: Date[] = [];
  for (let i = 0; i < SLOTS_PER_HOUR; i++) {
    out.push(new Date(base.getTime() + i * SLOT_MIN * 60 * 1000));
  }
  return out;
}

// 今日から N 日分の日付配列
export function daysFromToday(n: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out: Date[] = [];
  for (let i = 0; i < n; i++) {
    out.push(new Date(today.getTime() + i * 24 * 60 * 60 * 1000));
  }
  return out;
}

export function formatHM(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${String(x.getHours()).padStart(2, "0")}:${String(
    x.getMinutes()
  ).padStart(2, "0")}`;
}

export function formatDate(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  const wd = ["日", "月", "火", "水", "木", "金", "土"][x.getDay()];
  return `${x.getMonth() + 1}/${x.getDate()}（${wd}）`;
}

export function formatDateTime(d: Date | string): string {
  return `${formatDate(d)} ${formatHM(d)}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export { SLOT_MIN, SLOTS_PER_DAY, SLOTS_PER_HOUR };
