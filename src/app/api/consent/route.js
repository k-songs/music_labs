import sql from "@/app/api/utils/sql";

// 동의서 제출
export async function POST(request) {
  try {
    const {
      user_id,
      consent_type,
      consent_text,
      agreed,
      digital_signature,
      witness_name
    } = await request.json();

    if (!user_id || !consent_type || !consent_text || !digital_signature) {
      return Response.json(
        { error: "Required fields are missing" },
        { status: 400 }
      );
    }

    // IP 주소 추출
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";

    // User-Agent 추출
    const userAgent = request.headers.get("user-agent") || "unknown";

    const [consentForm] = await sql`
      INSERT INTO consent_forms (
        user_id, consent_type, consent_text, agreed, agreed_at,
        ip_address, user_agent, digital_signature, witness_name
      ) VALUES (
        ${user_id}, ${consent_type}, ${consent_text}, ${agreed}, 
        ${new Date().toISOString()}, ${ip}, ${userAgent}, 
        ${digital_signature}, ${witness_name || null}
      )
      RETURNING *
    `;

    return Response.json({ 
      success: true, 
      consent_form: consentForm 
    });

  } catch (error) {
    console.error('Error saving consent form:', error);
    return Response.json(
      { error: 'Failed to save consent form' },
      { status: 500 }
    );
  }
}

// 동의서 조회
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const consentType = searchParams.get('consent_type');

    if (!userId) {
      return Response.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    let query = `
      SELECT 
        cf.*,
        u.name as user_name,
        u.patient_id
      FROM consent_forms cf
      JOIN users u ON cf.user_id = u.id
      WHERE cf.user_id = $1
    `;
    
    const params = [userId];
    
    if (consentType) {
      query += ` AND cf.consent_type = $2`;
      params.push(consentType);
    }
    
    query += ` ORDER BY cf.created_at DESC`;

    const consentForms = await sql(query, params);

    return Response.json({ consent_forms: consentForms });

  } catch (error) {
    console.error('Error fetching consent forms:', error);
    return Response.json(
      { error: 'Failed to fetch consent forms' },
      { status: 500 }
    );
  }
}