# Home Budget

A small private web app for two people to track:

- **Income** – each source, whose it is, and how often it's paid (weekly, every 2 weeks, monthly…). Everything is converted to a monthly figure.
- **Monthly bills** – grouped by category, with due day and autopay flag.
- **Home improvement fund** – deposits and spending, a running balance, and a planned monthly contribution.
- **Home projects** – estimate, actual cost, priority, status, and target start/finish dates. The app forecasts the month the fund will be able to cover each project and flags any that won't be ready by their target start.

Built with Next.js 15 (App Router, server actions), Neon Postgres, and Tailwind. Login is email + password; a signed JWT is stored in an httpOnly cookie for 30 days. No Clerk or third-party auth.

---

## Deploy on Vercel + Neon (about 10 minutes)

1. **Push this folder to a GitHub repo** (private is fine).
2. In Vercel, **Add New → Project** and import the repo.
3. In the project, open **Storage → Create Database → Neon** and connect it. Vercel adds `DATABASE_URL` to your environment variables automatically.
4. In **Settings → Environment Variables**, add `AUTH_SECRET` – a long random string. Generate one with:
   ```bash
   openssl rand -base64 32
   ```
5. **Redeploy** so the new variables are picked up.

### Create the tables and your two logins

Do this once from your own computer:

```bash
npm install
vercel env pull .env.local        # or copy .env.example to .env.local and paste DATABASE_URL in
npm run db:migrate
npm run user:create -- you@example.com "Your Name" "a-strong-password"
npm run user:create -- partner@example.com "Partner Name" "another-strong-password"
```

Run `user:create` again with the same email to change that person's password.

## Run locally

```bash
cp .env.example .env.local   # fill in DATABASE_URL and AUTH_SECRET
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000.

## How the project forecast works

Open projects are lined up in this order: in progress → planned → ideas, then by priority (High first), then by target start date. The app adds up what each still needs (estimate minus anything already spent on it from the fund) and compares the running total against the fund balance plus your planned monthly contribution. A project is "Funded" when today's balance already covers it and everything ahead of it in line.

To record spending on a project, use **Fund → Spend** and pick the project. That lowers the balance and shows progress on the project card.

## Project layout

```
app/
  actions.ts          server actions (login, add/edit/delete everything)
  login/              sign-in page
  (app)/              signed-in pages: overview, income, bills, fund, projects
components/           shared UI pieces
lib/
  auth.ts             JWT sign/verify (jose)
  db.ts               Neon queries
  forecast.ts         project affordability forecast
  money.ts            frequency → monthly conversion, formatting
middleware.ts         sends signed-out visitors to /login
db/schema.sql         database tables
scripts/              migrate + create-user
```

## Security notes

- Every page and every server action checks the session; the middleware also redirects anyone without a valid token.
- Passwords are hashed with bcrypt. Changing `AUTH_SECRET` signs everyone out.
- There's no sign-up page, so only people you add with `user:create` can log in.
