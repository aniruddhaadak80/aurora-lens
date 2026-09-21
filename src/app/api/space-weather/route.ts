import { getSpaceWeather } from "@/lib/live";

export const revalidate = 300;

export async function GET() {
  const data = await getSpaceWeather();
  return Response.json(data);
}
