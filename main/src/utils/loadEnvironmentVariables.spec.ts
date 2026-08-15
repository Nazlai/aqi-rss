import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { loadEnvironmentVariables } from "./loadEnvironmentVariables";
import { SSM } from "@aws-sdk/client-ssm";
import getParametersByPathMock from "./__test__/mock/getParametersByPath.mock.json";

const APP_ENV_KEYS = [
  "DEBUG",
  "API_ENDPOINT",
  "ORIGIN",
  "API_KEY",
  "PORT",
  "REDIS_CONNECTION",
  "SENTRY_DSN",
  "S3_BUCKET_NAME",
] as const;

beforeEach(() => {
  for (const key of APP_ENV_KEYS) {
    vi.stubEnv(key, undefined);
  }
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("load environment variables", () => {
  it("should load values from process env in dev env", async () => {
    vi.stubEnv("DEBUG", "true");
    vi.stubEnv("API_ENDPOINT", "API_ENDPOINT");
    vi.stubEnv("ORIGIN", "ORIGIN");
    vi.stubEnv("API_KEY", "API_KEY");
    vi.stubEnv("PORT", "PORT");
    vi.stubEnv("REDIS_CONNECTION", "REDIS_CONNECTION");
    vi.stubEnv("SENTRY_DSN", "SENTRY_DSN");
    vi.stubEnv("S3_BUCKET_NAME", "S3_BUCKET_NAME");

    const ssmClient = new SSM();
    const spy = vi.spyOn(ssmClient, "getParametersByPath");
    spy.mockImplementation(vi.fn());

    expect(await loadEnvironmentVariables(ssmClient, "/test")).toEqual({
      API_ENDPOINT: "API_ENDPOINT",
      ORIGIN: "ORIGIN",
      API_KEY: "API_KEY",
      PORT: "PORT",
      REDIS_CONNECTION: "REDIS_CONNECTION",
      SENTRY_DSN: "SENTRY_DSN",
      S3_BUCKET_NAME: "S3_BUCKET_NAME",
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it("should load values from ssm parameter store in production", async () => {
    const ssmClient = new SSM();
    const spy = vi.spyOn(ssmClient, "getParametersByPath");
    spy.mockImplementationOnce(() => getParametersByPathMock);

    const cache = {};

    expect(await loadEnvironmentVariables(ssmClient, "/aqi", cache)).toEqual({
      API_ENDPOINT: "https://myendpoint",
      ORIGIN: "myorigin",
      API_KEY: "mykey",
      PORT: "4321",
      REDIS_CONNECTION: "myredisconnectionstring",
      REDIS_HOST_PASSWORD: "myredishostpassword",
      SENTRY_DSN: "mysentrydsn",
      S3_BUCKET_NAME: "mybucketname",
    });
  });

  it("should cache values loaded from aws parameter store", async () => {
    const ssmClient = new SSM();
    const spy = vi.spyOn(ssmClient, "getParametersByPath");
    spy.mockImplementationOnce(() => getParametersByPathMock);

    const cache = {};

    const first = await loadEnvironmentVariables(ssmClient, "/aqi", cache);
    const second = await loadEnvironmentVariables(ssmClient, "/aqi", cache);

    expect(spy).toHaveBeenCalledOnce();
    expect(first).toEqual(second);
  });
});
