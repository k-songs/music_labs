import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    // Return only active music types for patients
    const musicTypes = await sql`
      SELECT * FROM music_types 
      WHERE is_active = true 
      ORDER BY name ASC
    `;

    return Response.json({
      success: true,
      musicTypes: musicTypes,
      total: musicTypes.length,
    });
  } catch (error) {
    console.error("Error fetching active music types:", error);
    return Response.json(
      {
        success: false,
        error: "활성 음악 유형 조회 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
