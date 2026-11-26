// POST /api/islands/rename — re-sign a deed with a new owner-chosen name.
import {
  sendJson,
  readJsonBody,
  verifyDeedToken,
  signDeedPayload,
  allowRequest,
} from "../_lib/deed_tokens.mjs";
import { getCatalogIsland, validateIslandName } from "../../shared/islandCatalog.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });
  const ip = String(req.headers?.["x-forwarded-for"] || "local").split(",")[0].trim();
  if (!allowRequest(`rename:${ip}`, 20)) {
    return sendJson(res, 429, { error: "Too many attempts — try again in a minute." });
  }

  const body = await readJsonBody(req);
  const payload = verifyDeedToken(body?.token);
  if (!payload) return sendJson(res, 401, { error: "That deed is not valid." });

  const v = validateIslandName(body?.newName);
  if (!v.ok) return sendJson(res, 400, { error: v.error });

  const island = getCatalogIsland(payload.islandId);
  if (island?.name) {
    // Pre-named islands keep their catalog name; renaming is cosmetic only for those.
    return sendJson(res, 400, { error: `${island.name} keeps its given name — renaming is for Unnamed Isles.` });
  }

  const nextPayload = { ...payload, name: v.name };
  return sendJson(res, 200, {
    deed: {
      token: signDeedPayload(nextPayload),
      islandId: payload.islandId,
      name: v.name,
      sessionId: payload.sid || null,
      boughtAt: (payload.iat || 0) * 1000,
    },
  });
}
