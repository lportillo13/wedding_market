import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function readBucket() {
  return process.env.R2_BUCKET?.trim() || "the-wedding-market";
}

function readEndpoint() {
  const explicit = process.env.R2_ENDPOINT?.trim();
  if (explicit) {
    return stripTrailingSlash(explicit);
  }

  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  if (accountId) {
    return `https://${accountId}.r2.cloudflarestorage.com`;
  }

  const publicBase = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (!publicBase) {
    return null;
  }

  const match = publicBase.match(/^(https:\/\/[^/]+\.r2\.cloudflarestorage\.com)(?:\/.+)?$/i);
  return match ? stripTrailingSlash(match[1]!) : null;
}

function readPublicBaseUrl() {
  const explicit = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (explicit) {
    return stripTrailingSlash(explicit);
  }

  const endpoint = readEndpoint();
  if (!endpoint) {
    return null;
  }

  return `${endpoint}/${readBucket()}`;
}

export function isR2Configured() {
  return Boolean(
    readEndpoint() &&
      readPublicBaseUrl() &&
      process.env.R2_ACCESS_KEY_ID?.trim() &&
      process.env.R2_SECRET_ACCESS_KEY?.trim()
  );
}

let client: S3Client | null = null;

function getClient() {
  if (client) {
    return client;
  }

  const endpoint = readEndpoint();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 storage is not configured.");
  }

  client = new S3Client({
    region: "auto",
    endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  return client;
}

export function buildR2PublicUrl(key: string) {
  const base = readPublicBaseUrl();
  if (!base) {
    throw new Error("R2 public base URL is not configured.");
  }

  const normalizedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${base}/${normalizedKey}`;
}

export async function uploadToR2(params: {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
}) {
  const bucket = readBucket();
  const r2Client = getClient();

  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
      CacheControl: params.cacheControl ?? "public, max-age=31536000, immutable",
    })
  );

  return {
    key: params.key,
    url: buildR2PublicUrl(params.key),
  };
}

export async function deleteFromR2(key: string) {
  const bucket = readBucket();
  const r2Client = getClient();

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

export async function getFromR2(key: string) {
  const bucket = readBucket();
  const r2Client = getClient();

  return r2Client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

export function getR2ObjectKeyFromUrl(url: string) {
  const base = readPublicBaseUrl();
  const bucket = readBucket();

  if (base) {
    const normalizedBase = `${stripTrailingSlash(base)}/`;
    if (url.startsWith(normalizedBase)) {
      return decodeURIComponent(url.slice(normalizedBase.length));
    }
  }

  const storageMatch = url.match(/^https:\/\/[^/]+\.r2\.cloudflarestorage\.com\/([^/]+)\/(.+)$/i);
  if (storageMatch) {
    const [, urlBucket, key] = storageMatch;
    if (urlBucket === bucket && key) {
      return decodeURIComponent(key);
    }
  }

  const devMatch = url.match(/^https:\/\/[^/]+\.r2\.dev\/(.+)$/i);
  if (devMatch?.[1]) {
    return decodeURIComponent(devMatch[1]);
  }

  return null;
}
