declare const Buffer: {
  from(data: string, encoding: "binary"): Buffer;
  concat(chunks: Uint8Array[]): Buffer;
  isBuffer(obj: any): obj is Buffer;
};
interface Buffer extends Uint8Array {
  toString(encoding?: string): string;
}

export async function parseMultipartFormData(req: any): Promise<{
  files: Record<string, Array<{ name: string; type: string; buffer: Buffer; size: number }>>;
  fields: Record<string, string[]>;
}> {
  const contentType = req.headers["content-type"] || "";
  const boundary = contentType.split("boundary=")[1];

  if (!boundary) {
    throw new Error("No boundary found in content-type");
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const body = Buffer.concat(chunks);

  const files: Record<string, Array<{ name: string; type: string; buffer: Buffer; size: number }>> = {};
  const fields: Record<string, string[]> = {};

  const parts = body.toString("binary").split(`--${boundary}`);

  for (const part of parts) {
    if (!part.trim() || part.includes("--\r\n")) continue;

    const [headersRaw, ...contentParts] = part.split("\r\n\r\n");
    if (!headersRaw) continue;

    const content = contentParts.join("\r\n\r\n").replace(/\r\n--$/, "").replace(/\r\n$/, "");

    const headers: Record<string, string> = {};
    for (const line of headersRaw.split("\r\n")) {
      const [key, ...valueParts] = line.split(": ");
      if (key && valueParts.length) {
        headers[key.toLowerCase()] = valueParts.join(": ");
      }
    }

    const contentDisposition = headers["content-disposition"] || "";
    const nameMatch = contentDisposition.match(/name="([^"]+)"/);
    const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);

    const fieldName = nameMatch?.[1];
    if (!fieldName) continue;

    if (filenameMatch) {
      const filename = filenameMatch[1];
      const type = headers["content-type"] || "application/octet-stream";
      const buffer = Buffer.from(content, "binary");

      if (!files[fieldName]) files[fieldName] = [];
      files[fieldName].push({
        name: filename,
        type,
        buffer,
        size: buffer.length,
      });
    } else {
      if (!fields[fieldName]) fields[fieldName] = [];
      fields[fieldName].push(content);
    }
  }

  return { files, fields };
}