const TIME_ZONE = "Asia/Jakarta";

const dateTimeFormat = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const shortDateTimeFormat = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const timeFormat = new Intl.DateTimeFormat("id-ID", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

const numberFormat = new Intl.NumberFormat("id-ID");

export const EMPTY = "—";

/** MAC from the API is lowercase (Postgres macaddr); the UI shows it uppercase. */
export function formatMac(mac: string | null | undefined): string {
  return mac ? mac.toUpperCase() : EMPTY;
}

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatDateTime(iso: string | null | undefined): string {
  return iso ? dateTimeFormat.format(new Date(iso)).replace(/\./g, ":") : EMPTY;
}

/** "Hari ini 08:02", "Kemarin 17:20", otherwise "26 Okt 13:40". */
export function formatLastSeen(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) {
    return EMPTY;
  }

  const date = new Date(iso);
  const time = timeFormat.format(date).replace(/\./g, ":");
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  if (dayKey.format(date) === dayKey.format(now)) {
    return `Hari ini ${time}`;
  }
  if (dayKey.format(date) === dayKey.format(yesterday)) {
    return `Kemarin ${time}`;
  }

  return shortDateTimeFormat.format(date).replace(/\./g, ":");
}

export function initialOf(nameOrEmail: string): string {
  const letter = nameOrEmail.replace(/[^\p{L}]/gu, "").charAt(0);

  return letter ? letter.toUpperCase() : "?";
}
