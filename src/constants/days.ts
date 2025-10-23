export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

const SHORT_DAY_LABELS: Record<(typeof DAYS_OF_WEEK)[number], string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export const DAY_OPTIONS = DAYS_OF_WEEK.map((day) => ({
  value: day,
  label: day,
  short: SHORT_DAY_LABELS[day],
})) as const;
