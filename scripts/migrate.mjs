import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) { console.error("缺少 DATABASE_URL"); process.exit(1); }
if (!url.includes("-pooler")) console.warn("⚠️  非 pooled 连接串");

const sql = neon(url);
const raw = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
const stmts = raw
  .split(/;\s*(?:\r?\n|$)/)
  .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
  .filter(Boolean);

let ok = 0;
for (const s of stmts) {
  try { await sql.query(s); ok++; }
  catch (e) { console.error("❌", s.slice(0, 70).replace(/\s+/g, " "), "\n   ", e.message); process.exit(1); }
}
const tables = await sql.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
);
console.log(`✅ 迁移完成：执行 ${ok} 条语句`);
console.log("   表:", tables.map((t) => t.table_name).join(", "));
