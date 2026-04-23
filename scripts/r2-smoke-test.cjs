const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const sharp = require("sharp");
const ffmpegPath = require("ffmpeg-static");
const { spawnSync } = require("child_process");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

function loadDotEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function sanitizeSegment(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildStorageKey(parts, extension) {
  const prefix = parts.map(sanitizeSegment).filter(Boolean).join("/");
  return `${prefix}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

function buildPublicUrl(key) {
  const base = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
  const normalizedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${base}/${normalizedKey}`;
}

async function processImageUpload(buffer) {
  const transformed = sharp(buffer).rotate().resize({ width: 1920, withoutEnlargement: true }).webp({
    quality: 82,
    effort: 5,
  });
  const { data, info } = await transformed.toBuffer({ resolveWithObject: true });
  return {
    buffer: data,
    width: info.width || 0,
    height: info.height || 0,
    extension: "webp",
    contentType: "image/webp",
  };
}

async function processVideoUpload(inputPath) {
  const outputPath = path.join(os.tmpdir(), `${crypto.randomUUID()}.mp4`);
  const ffmpegResult = spawnSync(
    ffmpegPath,
    [
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
    ],
    { encoding: "utf8" }
  );

  if (ffmpegResult.status !== 0) {
    throw new Error(ffmpegResult.stderr || ffmpegResult.stdout || "ffmpeg failed");
  }

  const data = fs.readFileSync(outputPath);
  fs.unlinkSync(outputPath);
  return {
    buffer: data,
    extension: "mp4",
    contentType: "video/mp4",
  };
}

async function main() {
  loadDotEnvLocal();

  const imageInputPath = path.join(process.cwd(), ".tmp-r2-test-image-input.png");
  const imageBuffer = await sharp({
    create: {
      width: 2400,
      height: 1600,
      channels: 3,
      background: { r: 210, g: 180, b: 140 },
    },
  })
    .png()
    .toBuffer();
  fs.writeFileSync(imageInputPath, imageBuffer);

  const videoInputPath = path.join(process.cwd(), ".tmp-r2-test-video-input.mp4");
  const ffmpegSeedResult = spawnSync(
    ffmpegPath,
    [
      "-y",
      "-f",
      "lavfi",
      "-i",
      "color=c=#8a6d3b:s=1920x1080:d=2",
      "-f",
      "lavfi",
      "-i",
      "anullsrc=r=48000:cl=stereo",
      "-shortest",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      videoInputPath,
    ],
    { encoding: "utf8" }
  );

  if (ffmpegSeedResult.status !== 0) {
    throw new Error(ffmpegSeedResult.stderr || ffmpegSeedResult.stdout || "ffmpeg seed failed");
  }

  const client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });

  const processedImage = await processImageUpload(fs.readFileSync(imageInputPath));
  const imageKey = buildStorageKey(["vendors", "smoke-test", "gallery"], processedImage.extension);
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: imageKey,
      Body: processedImage.buffer,
      ContentType: processedImage.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const processedVideo = await processVideoUpload(videoInputPath);
  const videoKey = buildStorageKey(["vendors", "smoke-test", "videos"], processedVideo.extension);
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: videoKey,
      Body: processedVideo.buffer,
      ContentType: processedVideo.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  console.log(
    JSON.stringify(
      {
        image: {
          inputBytes: fs.statSync(imageInputPath).size,
          outputBytes: processedImage.buffer.byteLength,
          width: processedImage.width,
          height: processedImage.height,
          url: buildPublicUrl(imageKey),
        },
        video: {
          inputBytes: fs.statSync(videoInputPath).size,
          outputBytes: processedVideo.buffer.byteLength,
          format: "mp4",
          url: buildPublicUrl(videoKey),
        },
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
