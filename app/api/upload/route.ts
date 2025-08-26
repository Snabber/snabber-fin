// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { IncomingForm, Fields, Files } from "formidable";
import { IncomingMessage } from "http";
import { Readable } from "stream";

// Converte ReadableStream (NextRequest.body) em Node.js Readable
async function toNodeStream(stream: ReadableStream<Uint8Array> | null): Promise<Readable> {
  if (!stream) throw new Error("Request body is empty");

  const reader = stream.getReader();
  return new Readable({
    async read() {
      const { done, value } = await reader.read();
      if (done) {
        this.push(null);
      } else {
        this.push(Buffer.from(value));
      }
    },
  });
}

// Função helper para processar upload
async function parseForm(req: NextRequest): Promise<{ fields: Fields; files: Files }> {
  return new Promise(async (resolve, reject) => {
    try {
      const nodeReq = (await toNodeStream(req.body)) as unknown as IncomingMessage;
      const form = new IncomingForm({ keepExtensions: true, maxFileSize: 5 * 1024 * 1024 });

      form.parse(nodeReq, (err: Error | null, fields: Fields, files: Files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    } catch (err) {
      reject(err);
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const { fields, files } = await parseForm(req);
    return NextResponse.json({ ok: true, fields, files });
  } catch (err) {
    console.error("Erro upload:", err);
    return new NextResponse("Erro ao processar upload", { status: 500 });
  }
}
