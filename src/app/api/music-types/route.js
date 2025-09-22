import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    // Return all music types for admin management
    const musicTypes = await sql`
      SELECT * FROM music_types 
      ORDER BY created_at DESC
    `;

    return Response.json({ music_types: musicTypes });
  } catch (error) {
    console.error("Error fetching music types:", error);
    return Response.json(
      { error: "Failed to fetch music types" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { name, description, file_url } = await request.json();

    if (!name?.trim()) {
      return Response.json(
        { error: "Music type name is required" },
        { status: 400 },
      );
    }

    const [newMusicType] = await sql`
      INSERT INTO music_types (name, description, file_url, is_active)
      VALUES (${name.trim()}, ${description || null}, ${file_url || null}, true)
      RETURNING *
    `;

    return Response.json({ musicType: newMusicType });
  } catch (error) {
    console.error("Error creating music type:", error);
    if (error.code === "23505") {
      // Unique constraint violation
      return Response.json(
        { error: "Music type with this name already exists" },
        { status: 400 },
      );
    }
    return Response.json(
      { error: "Failed to create music type" },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { id, name, description, file_url, is_active } = await request.json();

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    // Build update fields based on provided data
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description || null;
    if (file_url !== undefined) updateData.file_url = file_url || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    const setClause = fields
      .map((field, index) => `${field} = $${index + 1}`)
      .join(", ");
    const values = fields.map((field) => updateData[field]);
    values.push(id);

    const query = `
      UPDATE music_types 
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *
    `;

    const [updatedMusicType] = await sql(query, values);

    if (!updatedMusicType) {
      return Response.json({ error: "Music type not found" }, { status: 404 });
    }

    return Response.json({ musicType: updatedMusicType });
  } catch (error) {
    console.error("Error updating music type:", error);
    if (error.code === "23505") {
      return Response.json(
        { error: "Music type with this name already exists" },
        { status: 400 },
      );
    }
    return Response.json(
      { error: "Failed to update music type" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "ID is required" }, { status: 400 });
    }

    // Hard delete for admin purposes
    const [deletedMusicType] = await sql`
      DELETE FROM music_types 
      WHERE id = ${id}
      RETURNING *
    `;

    if (!deletedMusicType) {
      return Response.json({ error: "Music type not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting music type:", error);
    return Response.json(
      { error: "Failed to delete music type" },
      { status: 500 },
    );
  }
}
