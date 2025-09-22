import sql from "@/app/api/utils/sql";

// Complete a music session
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { duration_minutes, completion_notes } = body;

    const end_time = new Date().toISOString();
    const completion_time = new Date().toISOString();

    // Get the session to create completion notes
    const [session] = await sql`
      SELECT * FROM music_sessions WHERE id = ${id}
    `;

    if (!session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const completionNote =
      completion_notes ||
      `세션 완료 - ${new Date().toLocaleTimeString("ko-KR")} (${duration_minutes || 60}분 소요)`;

    const result = await sql`
      UPDATE music_sessions 
      SET end_time = ${end_time}, 
          duration_minutes = ${duration_minutes || 60}, 
          completed = true,
          completion_time = ${completion_time},
          session_notes = COALESCE(session_notes, '') || ' | ' || ${completionNote}
      WHERE id = ${id}
      RETURNING *
    `;

    return Response.json({ session: result[0] });
  } catch (error) {
    console.error("Error completing session:", error);
    return Response.json(
      { error: "Failed to complete session" },
      { status: 500 },
    );
  }
}
