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
const require = createRequire(import.meta.url);

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
    const packageEntry = require.resolve("ffmpeg-static");
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
