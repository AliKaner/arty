import { ConvexError } from "convex/values";
export function requireAdmin(key: string) {
  const expected = process.env.ATELIER_ADMIN_KEY;
  if (!expected)
    throw new ConvexError("Stüdyo erişimi henüz yapılandırılmadı.");
  let mismatch = expected.length ^ key.length;
  for (let i = 0; i < expected.length; i++)
    mismatch |= expected.charCodeAt(i) ^ (key.charCodeAt(i) || 0);
  if (mismatch !== 0) throw new ConvexError("Stüdyo anahtarı geçersiz.");
}
