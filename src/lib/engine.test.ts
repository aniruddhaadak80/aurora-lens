import { describe, expect, it } from "vitest";
import {
  assessStorm,
  canonicalJson,
  dayGenesis,
  sealAssessment,
  strongestFlare,
  verifyChain,
} from "./engine";

const base = {
  kp: 4,
  solarWindSpeed: 600,
  bz: -8,
  maxFlare: "M5.0",
  alertCount: 2,
  maxQuake: 5.1,
  source: "live" as const,
};

describe("audit chain", () => {
  it("anchors the first record to the daily genesis", async () => {
    const first = await sealAssessment(assessStorm(base));
    expect(first.prevSeal).toBe(await dayGenesis(new Date(first.generatedAt)));
    const result = await verifyChain([first]);
    expect(result.ok).toBe(true);
  });

  it("rejects a self-consistent chain that starts at a different day's genesis", async () => {
    const payload = assessStorm(base);
    const wrongPrev = await dayGenesis(new Date(Date.now() - 86_400_000));
    const { sha384Hex } = await import("./engine");
    const forged = {
      ...payload,
      prevSeal: wrongPrev,
      seal: await sha384Hex(`${wrongPrev}${canonicalJson(payload)}`),
      canonical: canonicalJson(payload),
    };
    const result = await verifyChain([forged as never]);
    expect(result.ok).toBe(false);
    expect(result.failedIndex).toBe(0);
  });

  it("rejects a chain whose first record does not start at the genesis", async () => {
    const first = await sealAssessment(assessStorm(base));
    const tampered = { ...first, prevSeal: "not-the-genesis" };
    const result = await verifyChain([tampered]);
    expect(result.ok).toBe(false);
  });
});

describe("strongestFlare", () => {
  it("picks the strongest flare in the window, not the newest", () => {
    const flares = [
      { classType: "C", magnitude: 1.3 },
      { classType: "M", magnitude: 5.0 },
      { classType: "B", magnitude: 2.1 },
    ];
    expect(strongestFlare(flares)).toBe("M5");
  });

  it("returns null when there is no flare", () => {
    expect(strongestFlare([])).toBeNull();
  });
});
