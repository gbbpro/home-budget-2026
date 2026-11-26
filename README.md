# Home Budget

A small private web app for two people to track:

- **Income** – each source, whose it is, and how often it's paid (weekly, every 2 weeks, monthly…). Everything is converted to a monthly figure.
- **Monthly bills** – grouped by category, with due day and autopay flag.
- **Home improvement fund** – deposits and spending, a running balance, and a planned monthly contribution.
- **Home projects** – estimate, actual cost, priority, status, and target start/finish dates. The app forecasts the month the fund will be able to cover each project and flags any that won't be ready by their target start.
- **Savings** – bank, savings, money market and CD accounts with balance, APY (estimated monthly interest) and an optional goal. Quick "update balance" box on each account.
- **Investments** – brokerage, retirement, HSA and crypto accounts. Add each holding (ticker, shares, what you paid) to see value, gain/loss, today's change, allocation by account and top holdings. Prices are live if you add a Finnhub key, otherwise you type them in.
- **Net worth trend** – every time a balance or price changes, today's totals are saved, and the Overview shows savings + investments over time.

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

## Updating an existing deployment

New versions may add tables. The migration is safe to run again; it only creates what's missing. Run it against **both** databases:

```bash
npm run db:migrate                                                   # development (.env.local)
vercel env pull .env.production.local --environment=production
node --env-file=.env.production.local scripts/migrate.mjs            # production
```

## Live stock prices (optional)

1. Sign up for a free key at https://finnhub.io (free tier: 60 requests/minute, US stocks and ETFs).
2. Add it in Vercel → Settings → Environment Variables as `FINNHUB_API_KEY`, then redeploy. Add it to `.env.local` for local use.
3. A **Refresh prices** button appears on the Investments page. Prices are also looked up whenever you add or edit a holding.

Mutual funds (like VFIAX) and anything Finnhub doesn't cover keep the price you typed in. Edit the holding to update it.

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
  (app)/              signed-in pages: overview, income, bills, fund, savings, investments, projects
components/           shared UI pieces
lib/
  auth.ts             JWT sign/verify (jose)
  db.ts               Neon queries
  forecast.ts         project affordability forecast
  accounts.ts         savings/investment totals and net worth snapshots
  prices.ts           Finnhub quote lookup
  money.ts            frequency → monthly conversion, formatting
middleware.ts         sends signed-out visitors to /login
db/schema.sql         database tables
scripts/              migrate + create-user
```

## Security notes

- Every page and every server action checks the session; the middleware also redirects anyone without a valid token.
- Passwords are hashed with bcrypt. Changing `AUTH_SECRET` signs everyone out.
- There's no sign-up page, so only people you add with `user:create` can log in.
