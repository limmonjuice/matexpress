import { getSearchIndex } from "@/lib/catalog";

/** The list the header's search box runs on. Built ahead of time like a static page, so asking for it wakes nothing. */
export async function GET() {
  return Response.json(await getSearchIndex());
}
