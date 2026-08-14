import { type PutObjectCommandOutput } from "@aws-sdk/client-s3";

export class RssUploadError extends Error {
  name: string;
  result: PutObjectCommandOutput;

  constructor(result: PutObjectCommandOutput) {
    super(
      `rss xml upload failed with status: ${result?.$metadata.httpStatusCode ? result?.$metadata.httpStatusCode : "unknown"}`,
    );

    this.name = "rss-xml-error";
    this.result = result;
  }
}

export function parseRssUploadError(error: RssUploadError) {
  const { $metadata, ...rest } = error.result;

  return {
    ETag: rest.ETag,
    ChecksumType: rest.ChecksumType,
    ServerSideEncryption: rest.ServerSideEncryption,
    ...$metadata,
  };
}
