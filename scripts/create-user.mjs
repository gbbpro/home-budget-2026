// Usage: npm run user:create -- you@example.com "Your Name" "a-strong-password"
// Running it again with the same email updates that person's name and password.
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const [email, name, password] = process.argv.slice(2);
if (!email || !name || !password) {
  console.error('Usage: npm run user:create -- email "Name" "password"');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Put it in .env.local or export it.");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);
const hash = await bcrypt.hash(password, 12);
await sql`
  INSERT INTO users (email, name, password_hash)
  VALUES (${email.toLowerCase()}, ${name}, ${hash})
  ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`;
console.log(`Saved login for ${name} <${email.toLowerCase()}>`);
