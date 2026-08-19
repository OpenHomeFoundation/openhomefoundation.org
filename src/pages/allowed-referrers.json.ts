import type { APIRoute } from "astro";
import { allowedReferrers } from "../lib/allowed-referrers.js";

export const GET: APIRoute = () =>
  new Response(`${JSON.stringify(allowedReferrers)}\n`, {
    headers: { "Content-Type": "application/json" },
  });
