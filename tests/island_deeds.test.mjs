import test from "node:test";
import assert from "node:assert/strict";

process.env.ISLAND_DEED_SECRET = "test-deed-secret-for-unit-tests-0123456789abcdef";
process.env.ISLAND_DEEDS_TEST_MODE = "1";
delete process.env.STRIPE_SECRET_KEY;

const catalog = await import("../shared/islandCatalog.mjs");
const deedTokens = await import("../api/_lib/deed_tokens.mjs");

const {
  ISLANDS,
  ISLAND_COUNT,
  getCatalogIsland,
  formatPrice,
  validateIslandName,
  resolvePurchaseName,
} = catalog;

test("catalog holds exactly 20 islands with unique ids", () => {
  assert.equal(ISLAND_COUNT, 20);
  assert.equal(ISLANDS.length, 20);
  const ids = new Set(ISLANDS.map((i) => i.id));
  assert.equal(ids.size, 20);
});

test("ten named + ten unnamed islands, all purchasable", () => {
  const named = ISLANDS.filter((i) => i.name);
  const unnamed = ISLANDS.filter((i) => !i.name);
  assert.equal(named.length, 10);
  assert.equal(unnamed.length, 10);
  for (const island of ISLANDS) {
    assert.ok(island.priceCents > 0, `${island.id} needs a price`);
    assert.ok(island.radius >= 10 && island.radius <= 50, `${island.id} radius in sane range`);
  }
});

test("every island has a distinct size and sits inside the map bounds", () => {
  const radii = new Set(ISLANDS.map((i) => i.radius));
  assert.ok(radii.size >= 18, "sizes should meaningfully differ");
  for (const island of ISLANDS) {
    const dist = Math.hypot(island.x, island.z);
    assert.ok(Math.abs(dist - island.distance) < 1, `${island.id} distance matches coordinates`);
    assert.ok(island.diameterMeters === island.radius * 2);
    assert.ok(island.areaSqm > 400);
    // Must not overlap the main island (~165 m half-extent + margin)
    assert.ok(dist - island.radius > 180, `${island.id} clear of the main island`);
    // Ocean plane is 4600 m across — everything must sit on it
    assert.ok(dist + island.radius < 2300);
  }
});

test("no two islands overlap each other", () => {
  for (let a = 0; a < ISLANDS.length; a++) {
    for (let b = a + 1; b < ISLANDS.length; b++) {
      const d = Math.hypot(ISLANDS[a].x - ISLANDS[b].x, ISLANDS[a].z - ISLANDS[b].z);
      assert.ok(
        d > ISLANDS[a].radius + ISLANDS[b].radius + 10,
        `${ISLANDS[a].id} and ${ISLANDS[b].id} overlap (d=${d.toFixed(1)})`,
      );
    }
  }
});

test("catalog positions derive from angle and distance", () => {
  for (const island of ISLANDS) {
    const rad = (island.angleDeg * Math.PI) / 180;
    assert.ok(Math.abs(island.x - Math.sin(rad) * island.distance) < 0.2);
    assert.ok(Math.abs(island.z - Math.cos(rad) * island.distance) < 0.2);
  }
});

test("prices are all different and format as USD", () => {
  const prices = new Set(ISLANDS.map((i) => i.priceCents));
  assert.equal(prices.size, 20);
  assert.equal(formatPrice(199), "$1.99");
  assert.equal(formatPrice(1999), "$19.99");
});

test("island name validation: accepts friendly names", () => {
  for (const good of ["Coral Bay", "My Island", "IREOLUWA-2", "Sunset Point 7", "Ångström Isle"]) {
    assert.equal(validateIslandName(good).ok, true, good);
  }
});

test("island name validation: rejects bad names", () => {
  for (const bad of ["", "hi", "x".repeat(25), "visit my site https://spam.example", "buy www.coins.com now", "fuck island", "!!!", "thisnamehas waytoolong because reasons"]) {
    assert.equal(validateIslandName(bad).ok, false, JSON.stringify(bad));
  }
});

test("resolvePurchaseName: named islands keep catalog name, unnamed need a name", () => {
  const named = ISLANDS.find((i) => i.name);
  const unnamed = ISLANDS.find((i) => !i.name);
  assert.equal(resolvePurchaseName(named, "Whatever").name, named.name);
  assert.equal(resolvePurchaseName(unnamed, "Coral Cove").name, "Coral Cove");
  assert.equal(resolvePurchaseName(unnamed, "").ok, false);
});

test("deed tokens round-trip and reject tampering", () => {
  const deed = deedTokens.mintDeed({ islandId: "isle-pelican-rock", name: "Pelican Rock", sessionId: "cs_test_123" });
  const payload = deedTokens.verifyDeedToken(deed.token);
  assert.ok(payload);
  assert.equal(payload.islandId, "isle-pelican-rock");
  assert.equal(payload.name, "Pelican Rock");

  // Tampered payload
  const [body, sig] = deed.token.split(".");
  const tampered = `${body.slice(0, -2)}xx.${sig}`;
  assert.equal(deedTokens.verifyDeedToken(tampered), null);
  // Truncated signature
  assert.equal(deedTokens.verifyDeedToken(`${body}.${sig.slice(0, -2)}`), null);
  // Garbage
  assert.equal(deedTokens.verifyDeedToken("not-a-deed"), null);
});

test("named island keeps its catalog name even if token says otherwise", () => {
  const token = deedTokens.signDeedPayload({
    v: 1,
    islandId: "isle-crown",
    name: "Definitely Not Crown",
    sid: null,
    iat: 1700000000,
  });
  const payload = deedTokens.verifyDeedToken(token);
  assert.equal(payload.name, "IREOLUWA Crown Isle");
});

function makeRes() {
  const chunks = [];
  return {
    statusCode: 200,
    headers: {},
    setHeader(key, value) {
      this.headers[key.toLowerCase()] = String(value);
    },
    end(chunk) {
      if (chunk !== undefined) chunks.push(Buffer.from(String(chunk)));
      this.body = Buffer.concat(chunks).toString("utf8");
    },
  };
}

test("test-mode checkout + fulfill mints a verifiable deed without Stripe", async () => {
  process.env.ISLAND_DEEDS_TEST_MODE = "1";
  const checkout = (await import("../api/islands/checkout.js")).default;
  const fulfill = (await import("../api/islands/fulfill.js")).default;

  // Buy the unnamed island and name it in the same flow.
  const checkoutReq = {
    method: "POST",
    url: "/api/islands/checkout",
    headers: { host: "localhost:3000", "x-forwarded-proto": "http" },
    body: { islandId: "isle-driftwood-pod", customName: "Coral Cove", playerName: "Explorer" },
  };
  const checkoutRes = makeRes();
  await checkout(checkoutReq, checkoutRes);
  assert.equal(checkoutRes.statusCode, 200);
  const checkoutBody = JSON.parse(checkoutRes.body);
  const sessionId = new URL(checkoutBody.url).searchParams.get("deed_session");
  assert.ok(sessionId?.startsWith("test_"));

  const fulfillReq = {
    method: "GET",
    url: `/api/islands/fulfill?session_id=${encodeURIComponent(sessionId)}`,
    headers: { host: "localhost:3000" },
  };
  const fulfillRes = makeRes();
  await fulfill(fulfillReq, fulfillRes);
  assert.equal(fulfillRes.statusCode, 200);
  const fulfillBody = JSON.parse(fulfillRes.body);
  assert.equal(fulfillBody.deed.islandId, "isle-driftwood-pod");
  assert.equal(fulfillBody.deed.name, "Coral Cove");
  assert.ok(deedTokens.verifyDeedToken(fulfillBody.deed.token));

  // A client trying to buy a named island with a spoofed cheap price can't: catalog price wins.
  const checkout2Res = makeRes();
  await checkout(
    { method: "POST", url: "/api/islands/checkout", headers: {}, body: { islandId: "isle-crown", priceCents: 1 } },
    checkout2Res,
  );
  assert.equal(checkout2Res.statusCode, 200); // test mode redirect contains catalog id, priced server-side
  const namedFulfillRes = makeRes();
  const crownSession = new URL(JSON.parse(checkout2Res.body).url).searchParams.get("deed_session");
  await fulfill({ method: "GET", url: `/api/islands/fulfill?session_id=${crownSession}`, headers: {} }, namedFulfillRes);
  const crownDeed = JSON.parse(namedFulfillRes.body).deed;
  assert.equal(crownDeed.name, "IREOLUWA Crown Isle");
});

test("test-mode fulfill rejects tampered test sessions", async () => {
  const fulfill = (await import("../api/islands/fulfill.js")).default;
  const res = makeRes();
  // "YWI" is base64url for "ab" — too short for the buyer-name validator.
  await fulfill(
    { method: "GET", url: "/api/islands/fulfill?session_id=test_isle-driftwood-pod_YWI", headers: {} },
    res,
  );
  assert.equal(res.statusCode, 400);
});

test("checkout rejects unknown islands and bad unnamed names", async () => {
  const checkout = (await import("../api/islands/checkout.js")).default;
  const res1 = makeRes();
  await checkout({ method: "POST", url: "/", headers: {}, body: { islandId: "isle-nope" } }, res1);
  assert.equal(res1.statusCode, 404);

  const res2 = makeRes();
  await checkout(
    { method: "POST", url: "/", headers: {}, body: { islandId: "isle-driftwood-pod", customName: "x" } },
    res2,
  );
  assert.equal(res2.statusCode, 400);
});
