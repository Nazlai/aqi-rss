import { SSM } from "@aws-sdk/client-ssm";

export async function loadEnvironmentVariables(path: string) {
  if (process.env.DEBUG === "true") {
    return loadLocalEnvironmentVariables();
  }

  const cache: Record<string, string> = {};

  const client = new SSM();
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
  };
}
