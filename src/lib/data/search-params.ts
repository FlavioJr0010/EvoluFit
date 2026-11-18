import { isDateString } from "@/lib/dates";

type Params = Record<string, string | string[] | undefined>;

export function param(params: Params, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

/** ?data=YYYY-MM-DD válida ou hoje. */
export function dateParam(params: Params, today: string): string {
  const value = param(params, "data");
  return value && isDateString(value) ? value : today;
}
