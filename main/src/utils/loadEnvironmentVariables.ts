import { SSM } from "@aws-sdk/client-ssm";

const variableCache: Record<string, string> = {};

export async function loadEnvironmentVariables(
  client: SSM,
  path?: string,
  cache: Record<string, string> = variableCache,
) {
  if (process.env.DEBUG === "true") {
    return loadLocalEnvironmentVariables();
  }

  if (Object.keys(cache).length) {
    return cache;
  }

  const result = await client.getParametersByPath({
    Path: path,
    WithDecryption: true,
  });
  const values = result.Parameters?.values();

  if (values) {
    for (const item of values) {
      cache[item.Name!.split("/").pop()!] = item.Value!;
    }
  }

  return cache;
}

function loadLocalEnvironmentVariables() {
  return {
    API_ENDPOINT: process.env.API_ENDPOINT!,
    ORIGIN: process.env.ORIGIN!,
    API_KEY: process.env.API_KEY!,
    PORT: process.env.PORT!,
    REDIS_CONNECTION: process.env.REDIS_CONNECTION!,
    SENTRY_DSN: process.env.SENTRY_DSN!,
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME!,
  };
}
