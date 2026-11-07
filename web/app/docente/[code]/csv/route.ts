import { loadQuiz } from "@/lib/content";
import { reportCsv } from "@/lib/report";
import { loadRoom } from "@/lib/teacher-data";
import { isTeacher } from "@/lib/teacher";

/** Grade sheet of one room as CSV (REQ-30 CA4). Teacher only. */
export async function GET(_request: Request, { params }: RouteContext<"/docente/[code]/csv">) {
  if (!(await isTeacher())) return new Response("No autorizado", { status: 401 });
  const code = (await params).code.toUpperCase();
  const detail = await loadRoom(code);
  if (!detail) return new Response("Sala no encontrada", { status: 404 });
  const date = new Date().toISOString().slice(0, 10);
  return new Response(reportCsv(loadQuiz(1), detail.report), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="persisteapp-${code}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
