import { ValidationError } from "../../../../core/auth/errors.js";
import { FoodWithdrawalWindow } from "../models/withdrawalWindow.model.js";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const normalizeTime = (value) => {
  const raw = String(value || "").trim();
  const m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return "";
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return "";
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

const toMinutes = (hhmm) => {
  const t = normalizeTime(hhmm);
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const getNowInTimezone = (timeZone = "Asia/Kolkata") => {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    weekday: weekdayMap[map.weekday] ?? -1,
    minutes: Number(map.hour) * 60 + Number(map.minute),
  };
};

const isWithinWindow = (settings) => {
  if (!settings?.isEnabled) return { allowed: true };

  const timezone = settings.timezone || "Asia/Kolkata";
  const now = getNowInTimezone(timezone);
  const start = toMinutes(settings.startTime);
  const end = toMinutes(settings.endTime);

  if (now.weekday !== Number(settings.dayOfWeek) || start === null || end === null) {
    return { allowed: false };
  }

  // Normal window (e.g. 10:00-18:00) OR overnight window (e.g. 22:00-02:00).
  const inRange = start <= end
    ? now.minutes >= start && now.minutes <= end
    : now.minutes >= start || now.minutes <= end;

  return { allowed: inRange };
};

export const getWithdrawalWindowSettings = async () => {
  const doc = await FoodWithdrawalWindow.findOne({}).sort({ createdAt: -1 }).lean();
  return doc || {
    isEnabled: false,
    dayOfWeek: 1,
    startTime: "10:00",
    endTime: "18:00",
    timezone: "Asia/Kolkata",
  };
};

export const upsertWithdrawalWindowSettings = async (body = {}) => {
  const isEnabled = Boolean(body.isEnabled);
  const dayOfWeek = Number(body.dayOfWeek);
  const startTime = normalizeTime(body.startTime);
  const endTime = normalizeTime(body.endTime);
  const timezone = String(body.timezone || "Asia/Kolkata").trim() || "Asia/Kolkata";

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new ValidationError("dayOfWeek must be between 0 and 6");
  }
  if (!startTime || !endTime) {
    throw new ValidationError("startTime and endTime must be in HH:mm format");
  }

  const existing = await FoodWithdrawalWindow.findOne({}).sort({ createdAt: -1 });
  if (existing) {
    existing.isEnabled = isEnabled;
    existing.dayOfWeek = dayOfWeek;
    existing.startTime = startTime;
    existing.endTime = endTime;
    existing.timezone = timezone;
    await existing.save();
    return existing.toObject();
  }

  const created = await FoodWithdrawalWindow.create({
    isEnabled,
    dayOfWeek,
    startTime,
    endTime,
    timezone,
  });
  return created.toObject();
};

export const assertWithdrawalWindowOpen = async () => {
  const settings = await getWithdrawalWindowSettings();
  const check = isWithinWindow(settings);
  if (check.allowed) return;

  throw new ValidationError(
    `Withdrawals are open only on ${DAY_LABELS[Number(settings.dayOfWeek)]} between ${settings.startTime} and ${settings.endTime} (${settings.timezone}).`,
  );
};

