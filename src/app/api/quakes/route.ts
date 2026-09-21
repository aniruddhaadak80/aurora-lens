import { getQuakes } from "@/lib/live";

export const revalidate = 300;

export async function GET() {
  const data = await getQuakes();
  return Response.json(data);
}
