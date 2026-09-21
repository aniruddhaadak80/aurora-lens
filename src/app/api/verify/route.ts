import { verifyChain } from "@/lib/engine";
import type { SealedAssessment } from "@/lib/types";

export const revalidate = 0;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "invalid JSON body" }, { status: 400 });
  }
  const records = (body as { records?: SealedAssessment[] }).records;
  if (!Array.isArray(records) || records.length === 0) {
    return Response.json({ ok: false, error: "provide { records: SealedAssessment[] }" }, { status: 400 });
  }
  const result = await verifyChain(records);
  return Response.json(result);
}

export async function GET() {
  return Response.json({
    usage: "POST { records: SealedAssessment[] } to replay SHA-384(prevSeal ‖ canonicalJson) seals.",
  });
}
