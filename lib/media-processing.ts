import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import type { MediaAsset } from "@/types/images";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1920;
const MAX_LOGO_WIDTH = 640;
const packageRequire = createRequire(__filename);

function makeId() {
  return crypto.randomUUID();
}

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function resolveFfmpegBinary() {
  if (typeof ffmpegPath === "string" && ffmpegPath && !ffmpegPath.includes(`${path.sep}.next${path.sep}`)) {
    return ffmpegPath;
  }

  try {
    const packageEntry = packageRequire.resolve("ffmpeg-static");
    const packageDir = path.dirname(packageEntry);
    const binaryName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
    return path.join(packageDir, binaryName);
  } catch {
    if (typeof ffmpegPath === "string" && ffmpegPath) {
      return ffmpegPath;
    }
    return null;
  }
}

export function validateImageUpload(file: File | null) {
  if (!file) {
    return "Please choose an image.";
  }
  if (file.size <= 0) {
    return "The selected image is empty.";
  }
  if (!file.type.startsWith("image/")) {
    return "Unsupported image type.";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "Each image must be 10MB or smaller.";
  }
  return null;
}

export function validateVideoUpload(file: File | null) {
  if (!file) {
    return "Please choose a video.";
  }
  if (file.size <= 0) {
    return "The selected video is empty.";
  }
  if (!file.type.startsWith("video/")) {
    return "Unsupported video type.";
  }
  return null;
}

export async function processImageUpload(file: File): Promise<{
  asset: MediaAsset;
  buffer: Buffer;
  contentType: string;
  extension: string;
}> {
  const input = Buffer.from(await file.arrayBuffer());
  const transformer = sharp(input).rotate().resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true }).webp({
    quality: 82,
    effort: 5,
  });
  const { data, info } = await transformer.toBuffer({ resolveWithObject: true });

  return {
    asset: {
      type: "image",
      url: "",
      public_id: "",
      width: info.width ?? 0,
      height: info.height ?? 0,
      format: "webp",
      bytes: data.byteLength,
    },
    buffer: data,
    contentType: "image/webp",
    extension: "webp",
  };
}

export async function processCarouselLogoUpload(file: File): Promise<{
  asset: MediaAsset;
  buffer: Buffer;
  contentType: string;
  extension: string;
}> {
  const input = Buffer.from(await file.arrayBuffer());
  const base = sharp(input).rotate().resize({ width: MAX_LOGO_WIDTH, withoutEnlargement: true }).ensureAlpha();
  const { data, info } = await base.raw().toBuffer({ resolveWithObject: true });
  const channels = info.channels;
  const width = info.width ?? 0;
  const height = info.height ?? 0;
  const cornerSize = Math.max(2, Math.floor(Math.min(width, height) * 0.08));
  const corners: Array<[number, number]> = [
    [0, 0],
    [Math.max(0, width - cornerSize), 0],
    [0, Math.max(0, height - cornerSize)],
    [Math.max(0, width - cornerSize), Math.max(0, height - cornerSize)],
  ];
  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  let bgCount = 0;
  let transparentCornerCount = 0;
  let totalCornerCount = 0;

  for (const [startX, startY] of corners) {
    for (let y = startY; y < Math.min(height, startY + cornerSize); y += 1) {
      for (let x = startX; x < Math.min(width, startX + cornerSize); x += 1) {
        const offset = (y * width + x) * channels;
        const alpha = data[offset + 3] ?? 255;
        totalCornerCount += 1;
        if (alpha < 8) {
          transparentCornerCount += 1;
          continue;
        }
        bgR += data[offset] ?? 0;
        bgG += data[offset + 1] ?? 0;
        bgB += data[offset + 2] ?? 0;
        bgCount += 1;
      }
    }
  }

  if (bgCount > 0) {
    bgR /= bgCount;
    bgG /= bgCount;
    bgB /= bgCount;
  }

  const output = Buffer.alloc(width * height * 4);
  const maxDistance = Math.sqrt(255 * 255 * 3);
  const hasTransparentBackground = totalCornerCount > 0 && transparentCornerCount / totalCornerCount > 0.65;

  for (let index = 0; index < width * height; index += 1) {
    const inputOffset = index * channels;
    const outputOffset = index * 4;
    const sourceAlpha = data[inputOffset + 3] ?? 255;
    const r = data[inputOffset] ?? 0;
    const g = data[inputOffset + 1] ?? 0;
    const b = data[inputOffset + 2] ?? 0;
    const distance = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
    const backgroundRemovedAlpha = hasTransparentBackground
      ? sourceAlpha
      : Math.max(0, Math.min(255, Math.round(((distance / maxDistance) - 0.08) / 0.32 * 255)));
    const finalAlpha = Math.round((backgroundRemovedAlpha * sourceAlpha) / 255);

    output[outputOffset] = 255;
    output[outputOffset + 1] = 255;
    output[outputOffset + 2] = 255;
    output[outputOffset + 3] = finalAlpha;
  }

  const { data: webp, info: webpInfo } = await sharp(output, {
    raw: { width, height, channels: 4 },
  })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 8 })
    .resize({ width: MAX_LOGO_WIDTH, withoutEnlargement: true })
    .webp({ quality: 90, effort: 5 })
    .toBuffer({ resolveWithObject: true });

  return {
    asset: {
      type: "image",
      url: "",
      public_id: "",
      width: webpInfo.width ?? width,
      height: webpInfo.height ?? height,
      format: "webp",
      bytes: webp.byteLength,
    },
    buffer: webp,
    contentType: "image/webp",
    extension: "webp",
  };
}

async function runFfmpeg(args: string[]) {
  const binaryPath = resolveFfmpegBinary();

  if (typeof binaryPath !== "string" || !binaryPath) {
    throw new Error("ffmpeg is not available.");
  }

  await new Promise<void>((resolve, reject) => {
    const child = spawn(binaryPath, args, { stdio: ["ignore", "ignore", "pipe"] }) as unknown as ChildProcessWithoutNullStreams;
    let stderr = "";

    child.stderr?.on("data", (chunk: Buffer | string) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `ffmpeg exited with code ${code}`));
    });
  });
}

export async function processVideoUpload(file: File): Promise<{
  asset: MediaAsset;
  buffer: Buffer;
  contentType: string;
  extension: string;
}> {
  const workdir = await mkdtemp(path.join(tmpdir(), "wm-video-"));
  const inputPath = path.join(workdir, `${makeId()}-${sanitizeSegment(file.name || "upload")}.input`);
  const outputPath = path.join(workdir, `${makeId()}.mp4`);

  try {
    await writeFile(inputPath, Buffer.from(await file.arrayBuffer()));
    await mkdir(workdir, { recursive: true });

    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-vf",
      "scale='min(1920,iw)':-2",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "28",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-fs",
      "50M",
      outputPath,
    ]);

    const data = await readFile(outputPath);
    if (data.byteLength > MAX_VIDEO_BYTES) {
      throw new Error("Video must be 50MB or smaller after compression.");
    }

    return {
      asset: {
        type: "video",
        url: "",
        public_id: "",
        width: 0,
        height: 0,
        format: "mp4",
        bytes: data.byteLength,
      },
      buffer: data,
      contentType: "video/mp4",
      extension: "mp4",
    };
  } finally {
    await rm(workdir, { recursive: true, force: true });
  }
}

export function buildStorageKey(parts: string[], extension: string) {
  const prefix = parts.map(sanitizeSegment).filter(Boolean).join("/");
  return `${prefix}/${Date.now()}-${makeId()}.${extension}`;
}
