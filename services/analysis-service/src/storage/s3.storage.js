import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { pipeline } from "stream/promises";
import { createReadStream, createWriteStream } from "fs";

function getS3() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
    throw new Error("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be configured together");
  }

  return new S3Client({
    region: process.env.AWS_REGION,
    ...(accessKeyId && secretAccessKey
      ? { credentials: { accessKeyId, secretAccessKey } }
      : {})
  });
}

function getBucket() {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) {
    throw new Error("S3_BUCKET is not configured");
  }
  return bucket;
}

export async function uploadFileToS3(localPath, key) {
  const bucket = getBucket();
  const s3 = getS3();

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: createReadStream(localPath)
    })
  );

  return key;
}

export async function downloadFileFromS3(key, localPath) {
  const bucket = getBucket();
  const s3 = getS3();

  const res = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key
    })
  );

  await fs.promises.mkdir(path.dirname(localPath), { recursive: true });
  await pipeline(res.Body, createWriteStream(localPath));
  return localPath;
}

export async function deleteFileFromS3(key) {
  const bucket = getBucket();
  const s3 = getS3();

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key
    })
  );
}