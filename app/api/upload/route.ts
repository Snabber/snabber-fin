// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false, // desativa o body parser padrão do Next
  },
};

export async function POST(req: NextRequest) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024, // limite de 5MB
      fileWriteStreamHandler: () => {
        // não escreve em disco, apenas bufferiza
        const chunks: Buffer[] = [];
        return {
          write: (chunk: Buffer) => {
            chunks.push(chunk);
          },
          end: () => {
            const buffer = Buffer.concat(chunks);
            // aqui você tem o conteúdo do arquivo em memória
            console.log("Arquivo recebido:", buffer.length, "bytes");
          },
        } as any;
      },
    });

    form.parse(req as any, (err: any, fields: any, files: any) => {
      if (err) return reject(err);

      // se precisar pegar o conteúdo processado acima, pode passar via files
      resolve(
        NextResponse.json({ ok: true, fields, files })
      );
    });
  });
}
