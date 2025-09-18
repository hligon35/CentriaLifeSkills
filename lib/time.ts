/**
 * Centralized time & date helpers.
 * Use these instead of ad-hoc toLocaleString / toLocaleDateString so
 * formatting can be unified or localized later.
 */

export function toDate(d: string | Date) {
  return typeof d === 'string' ? new Date(d) : d
}

export function fmtDateTime(d: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return toDate(d).toLocaleString(undefined, opts)
}

export function fmtDate(d: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return toDate(d).toLocaleDateString(undefined, opts)
}

export function fmtTime(d: string | Date, opts?: Intl.DateTimeFormatOptions) {
  return toDate(d).toLocaleTimeString(undefined, opts)
}

// Future: plug in full i18n or day.js/date-fns formatting abstraction.
