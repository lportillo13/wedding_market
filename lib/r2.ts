import { DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ownedR2ObjectKey } from "./r2-ownership";

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
    maxAttempts: 2,
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
    }), {abortSignal:AbortSignal.timeout(15000)}
  );

  return {
    key: params.key,
    url: buildR2PublicUrl(params.key),
  };
}

export function getOwnedR2ObjectKey(value: string | null | undefined, ownerPrefix: string) {
  return ownedR2ObjectKey(value, ownerPrefix, readPublicBaseUrl()) ??
    ownedR2ObjectKey(value,ownerPrefix,process.env.R2_LEGACY_PUBLIC_BASE_URL?.trim() ?? null);
}

export async function deleteFromR2(key: string, ownerPrefix: string) {
  if (getOwnedR2ObjectKey(key, ownerPrefix) !== key) throw new Error("Asset ownership could not be verified.");
  const bucket = readBucket();
  const r2Client = getClient();

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }), {abortSignal:AbortSignal.timeout(15000)}
  );
}

/** On-demand deletion work: one 20-object batch; retry drains the same exact owner prefix. */
export async function drainOwnedR2Prefix(ownerPrefix:string) {
  if (!getOwnedR2ObjectKey(ownerPrefix+'ownership-check',ownerPrefix)) throw new Error('Invalid media owner prefix.');
  const bucket=readBucket(); const r2Client=getClient();
  const page=await r2Client.send(new ListObjectsV2Command({Bucket:bucket,Prefix:ownerPrefix,MaxKeys:20}),{abortSignal:AbortSignal.timeout(10_000)});
  const keys=(page.Contents ?? []).map(object=>object.Key).filter((key):key is string=>Boolean(key));
  if (keys.some(key=>getOwnedR2ObjectKey(key,ownerPrefix)!==key)) throw new Error('Media ownership check failed.');
  if (keys.length) {
    const result=await r2Client.send(new DeleteObjectsCommand({Bucket:bucket,Delete:{Objects:keys.map(Key=>({Key})),Quiet:true}}),{abortSignal:AbortSignal.timeout(10_000)});
    if (result.Errors?.length) throw new Error('Some media could not be removed. Retry this batch.');
  }
  return !page.IsTruncated;
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
