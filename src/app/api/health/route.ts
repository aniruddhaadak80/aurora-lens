export const revalidate = 60;

export async function GET() {
  return Response.json({
    ok: true,
    app: "aurora-lens",
    version: "1.0.0",
    time: new Date().toISOString(),
    feeds: ["noaa-swpc", "usgs-earthquake"],
    endpoints: [
      "/api/space-weather",
      "/api/quakes",
      "/api/assessment",
      "/api/verify",
      "/api/mcp",
    ],
  });
}
