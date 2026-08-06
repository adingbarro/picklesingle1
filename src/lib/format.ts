export function peso(amount: number): string {
  return "₱" + amount.toLocaleString("en-PH");
}

export function formatDateLabel(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[date.getUTCDay()]}, ${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function timeLabel(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${m < 10 ? "0" : ""}${m} ${ampm}`;
}

export function addMinutesToTime(hhmm: string, minutes: number): string {
  const [hStr, mStr] = hhmm.split(":");
  const total = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function generateConfirmationCode(): string {
  return "PB-" + Math.floor(10000 + Math.random() * 89999);
}

export function manilaNowHHMM(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

export function isOpenNow(opensAt: string, closesAt: string): boolean {
  const now = timeToMinutes(manilaNowHHMM());
  return now >= timeToMinutes(opensAt) && now < timeToMinutes(closesAt);
}

export function todayManilaDateKey(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return parts; // en-CA formats as YYYY-MM-DD
}
