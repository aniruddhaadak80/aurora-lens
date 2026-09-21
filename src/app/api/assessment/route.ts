import { assessStorm, flareToPoints, sealAssessment } from "@/lib/engine";
import { getQuakes, getSpaceWeather } from "@/lib/live";

export const revalidate = 120;

function strongestFlare(flares: Array<{ classType: string; magnitude: number }>): string | null {
  let best: string | null = null;
  let bestPts = -1;
  for (const f of flares.slice(0, 15)) {
    const label = `${f.classType}${f.magnitude}`;
    const pts = flareToPoints(label).points;
    if (pts > bestPts) {
      bestPts = pts;
      best = label;
    }
  }
  return best;
}

export async function GET() {
  const [space, quakes] = await Promise.all([getSpaceWeather(), getQuakes()]);
  const assessment = assessStorm({
    kp: space.kp.kp,
    solarWindSpeed: space.wind.speed,
    bz: space.wind.bz,
    maxFlare: strongestFlare(space.flares),
    alertCount: space.alerts.length,
    maxQuake: quakes.maxMag,
    source: space.source === "live" && quakes.source === "live" ? "live" : "fallback",
  });
  const sealed = await sealAssessment(assessment);
  return Response.json({
    ...sealed,
    context: {
      kpTime: space.kp.time,
      windTime: space.wind.time,
      quakeCount: quakes.count,
      flareCount: space.flares.length,
    },
  });
}
