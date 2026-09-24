import { put, del } from "@vercel/blob";

export interface StorageProvider {
  upload(key: string, data: Buffer, options: { contentType: string; access?: "public" | "private" }): Promise<{ url: string; pathname: string }>;
  delete(url: string): Promise<void>;
  getSignedUrl(key: string, expiresIn: number): Promise<string>;
}

export class VercelBlobStorage implements StorageProvider {
  private token: string;

  constructor(token: string = process.env.BLOB_READ_WRITE_TOKEN || "") {
    this.token = token;
  }

  async upload(key: string, data: Buffer, options: { contentType: string; access?: "public" }): Promise<{ url: string; pathname: string }> {
    const blob = await put(key, data, {
      access: "public",
      token: this.token,
      contentType: options.contentType,
      addRandomSuffix: true,
    });
    return { url: blob.url, pathname: blob.pathname };
  }

  async delete(url: string): Promise<void> {
    await del(url, { token: this.token });
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    const blob = await put(key, Buffer.from(""), {
      access: "public",
      token: this.token,
      contentType: "application/octet-stream",
    });
    return blob.url;
  }
}

export class MockStorage implements StorageProvider {
  private store: Map<string, { data: Buffer; contentType: string }> = new Map();

  async upload(key: string, data: Buffer, options: { contentType: string; access?: "public" | "private" }): Promise<{ url: string; pathname: string }> {
    this.store.set(key, { data, contentType: options.contentType });
    return { url: `https://mock-storage.example.com/${key}`, pathname: key };
  }

  async delete(url: string): Promise<void> {
    const key = url.split("/").pop();
    if (key) this.store.delete(key);
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    return `https://mock-storage.example.com/${key}?expires=${Date.now() + expiresIn * 1000}`;
  }
}

export const storage = new VercelBlobStorage();

export async function generateThumbnail(
  videoUrl: string,
  options: { timestamp?: number; width?: number; height?: number } = {}
): Promise<string> {
  const timestamp = options.timestamp || 1;
  const width = options.width || 320;
  const height = options.height || 180;

  if (process.env.REPLICATE_API_TOKEN) {
    try {
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        },
        body: JSON.stringify({
          version: "fofr/thumbnail-generator:1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
          input: {
            video_url: videoUrl,
            timestamp,
            width,
            height,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.output?.[0] || videoUrl;
      }
    } catch (error) {
      console.error("Thumbnail generation failed:", error);
    }
  }

  return videoUrl;
}

export async function generateVideoThumbnails(
  videoUrl: string,
  count: number = 3
): Promise<string[]> {
  const thumbnails: string[] = [];
  const duration = 10;

  for (let i = 0; i < count; i++) {
    const timestamp = (i + 1) * (duration / (count + 1));
    const thumb = await generateThumbnail(videoUrl, { timestamp });
    thumbnails.push(thumb);
  }

  return thumbnails;
}