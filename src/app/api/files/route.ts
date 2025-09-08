import { NextRequest, NextResponse } from "next/server";
import { getFileStore } from "./fileStore";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart/form-data" },
        { status: 400 }
      );
    }

    const formData = await req.formData();

    const store = getFileStore();

    const files = formData.getAll("file");
    if (files.length === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const saved = [] as Array<{
      id: string;
      name: string;
      type: string;
      size: number;
    }>;

    for (const f of files) {
      if (!(f instanceof File)) continue;

      const id = (formData.get("id") as string) || crypto.randomUUID();
      const text = await f.text();

      store.addFile({
        id,
        name: f.name,
        type: f.type || "text/plain",
        size: f.size,
        data: text,
      });

      saved.push({ id, name: f.name, type: f.type, size: f.size });
    }

    return NextResponse.json({ files: saved }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
