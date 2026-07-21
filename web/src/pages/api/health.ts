import type { APIRoute } from "astro";
import { probeRedeemService } from "../../redeem/data";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    await probeRedeemService();
    return new Response(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    console.error("Redeem service health probe failed");
    return new Response("Service unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
};
