export function getAge(birthday?: string | null): number | undefined {
  if (!birthday) return undefined;

  let date: Date | undefined;

  if (birthday.includes(".")) {
    const parts = birthday.split(".");
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
        date = new Date(year, month - 1, day);
      }
    }
  }

  if (!date) {
    const parsed = new Date(birthday);
    if (!isNaN(parsed.getTime())) {
      date = parsed;
    }
  }

  if (!date) return undefined;

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}
