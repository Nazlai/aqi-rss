import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { loadEnvironmentVariables } from "./loadEnvironmentVariables";

export async function uploadToBucket(filename: string, body: string) {
  const s3Client = new S3Client({});
  const environmentVariables = await loadEnvironmentVariables();

  const putObjectCommand = new PutObjectCommand({
    Bucket: environmentVariables.S3_BUCKET_NAME,
    Key: `static/${filename}`,
    Body: body,
    ContentType: "application/rss+xml; charset=utf-8",
  });

  const response = await s3Client.send(putObjectCommand);

  return response;
}
