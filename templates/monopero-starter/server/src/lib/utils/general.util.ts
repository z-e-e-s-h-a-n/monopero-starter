import ms, { type StringValue } from "ms";

export const slugify = (str: string, slug?: string) => {
  const base = slug && slug.trim().length > 0 ? slug : str;

  return base
    .toLowerCase()
    .replace(/\s+/g, "-") // replace spaces with dashes
    .replace(/[^\w\-]+/g, "") // remove invalid chars
    .replace(/\-\-+/g, "-") // collapse multiple dashes
    .replace(/^-+/, "") // trim starting dash
    .replace(/-+$/, ""); // trim ending dash
};

export const parseExpiry = (exp: string, future = false): number => {
  const val = ms(exp as StringValue);
  if (future) return Date.now() + val;
  return val;
};

export const expiryDate = (exp: string, future = false): Date => {
  const val = parseExpiry(exp, future);
  return new Date(val);
};
