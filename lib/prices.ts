/**
 * Live quotes from Finnhub (free tier: https://finnhub.io — sign up, copy the API key,
 * add it to Vercel as FINNHUB_API_KEY). Covers US stocks and ETFs. Mutual funds and
 * anything Finnhub doesn't know keep the price you typed in by hand.
 */
export const pricesEnabled = () => !!process.env.FINNHUB_API_KEY;

export type Quote = { price: number; prevClose: number | null };

export async function fetchQuote(symbol: string): Promise<Quote | null> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${key}`, { cache: "no-store" });
    if (!res.ok) return null;
    const q = (await res.json()) as { c?: number; pc?: number };
    if (!q.c || q.c <= 0) return null; // Finnhub returns 0 for symbols it doesn't cover
    return { price: q.c, prevClose: q.pc && q.pc > 0 ? q.pc : null };
  } catch {
    return null;
  }
}
