import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { AqiService } from "../aqi.service";
import { setupServer } from "msw/node";
import { handlers } from "./mock/handlers";
import expectedAqimock from "./mock/aqi.mock.expected.json";
import expectedHourlyAqimock from "./mock/hourlyaqi.mock.expected.json";
import { TAICHUNG_CITY, TAIPEI_CITY } from "../enum";
import { http, HttpResponse } from "msw";
import { EmptyResponseError, PathNotFoundError } from "../aqi.error";
import { createClient, RedisClientType } from "redis";
import axios from "axios";
import RedisMemoryServer from "redis-memory-server";

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => {
  server.close();
});

const mockRedis = () =>
  vi.mockObject({
    get: vi.fn(),
    set: vi.fn(),
  }) as unknown as RedisClientType;

const axiosClient = axios.create({
  baseURL: process.env.API_ENDPOINT,
  params: {
    api_key: process.env.API_KEY,
    language: "en",
  },
});
const axiosSpy = vi.spyOn(axiosClient, "get");

const mockAxiosClient = () => axiosClient;

describe("aqi service", () => {
  describe("getLatestAqi", () => {
    it("parses retrieved aqi data", async () => {
      const service = new AqiService(mockRedis, mockAxiosClient);
      expect((await service.getLatestAqi()).data).toEqual(expectedAqimock);
    });

    it("should handle empty list response", async () => {
      const service = new AqiService(mockRedis, mockAxiosClient);
      server.use(
        http.get(`${process.env.API_ENDPOINT}/aqx_p_432`, () => {
          return HttpResponse.json([]);
        }),
      );

      await expect(service.getLatestAqi()).rejects.toThrow(EmptyResponseError);
    });
  });

  describe("getAqiByStationName", () => {
    it("parses retrieved hourly aqi data", async () => {
      const service = new AqiService(mockRedis, mockAxiosClient);
      expect(
        (await service.getAqiByStationName(TAIPEI_CITY.ZHONGSHAN)).data,
      ).toEqual(expectedHourlyAqimock);
    });

    it("should handle locations with empty api path", async () => {
      const service = new AqiService(mockRedis, mockAxiosClient);
      await expect(
        service.getAqiByStationName(TAICHUNG_CITY.TAIWAN_AVENUE),
      ).rejects.toThrow(PathNotFoundError);
    });

    it("should handle empty list response", async () => {
      const service = new AqiService(mockRedis, mockAxiosClient);
      server.use(
        http.get(`${process.env.API_ENDPOINT}/aqx_p_200`, () => {
          return HttpResponse.json([]);
        }),
      );

      await expect(
        service.getAqiByStationName(TAIPEI_CITY.ZHONGSHAN),
      ).rejects.toThrow(EmptyResponseError);
    });
  });

  describe("should cache", () => {
    let client: RedisClientType;
    let cacheManager: () => RedisClientType;
    let redisServer: RedisMemoryServer;

    beforeAll(async () => {
      redisServer = new RedisMemoryServer();
      const host = await redisServer.getHost();
      const port = await redisServer.getPort();

      client = createClient({ socket: { host, port } });
      await client.connect();

      cacheManager = () => {
        return client;
      };
    });

    afterEach(async () => {
      await client?.flushAll();
    });

    afterAll(async () => {
      await client?.quit();
      await redisServer?.stop();
    });

    it("getLatestAqi with redis cache", async () => {
      const service = new AqiService(cacheManager, mockAxiosClient);
      const uncachedRequest = await service.getLatestAqi();

      expect(uncachedRequest.data).toEqual(expectedAqimock);
      expect(await client.KEYS("*")).toContain("aqx_p_432");
      expect(axiosSpy).toHaveBeenCalledTimes(1);

      const cachedRequest = await service.getLatestAqi();

      expect(axiosSpy).toHaveBeenCalledTimes(1);
      expect(cachedRequest.data).toEqual(expectedAqimock);
      expect(cachedRequest.ttl).toBeGreaterThan(0);
    });

    it("getAqiByStationName with redis cache", async () => {
      const service = new AqiService(cacheManager, mockAxiosClient);
      const uncachedRequest = await service.getAqiByStationName(
        TAIPEI_CITY.ZHONGSHAN,
      );

      expect(uncachedRequest.data).toEqual(expectedHourlyAqimock);
      expect(await client.KEYS("*")).toContain(TAIPEI_CITY.ZHONGSHAN);
      expect(axiosSpy).toHaveBeenCalledTimes(1);

      const cachedRequest = await service.getAqiByStationName(
        TAIPEI_CITY.ZHONGSHAN,
      );

      expect(axiosSpy).toHaveBeenCalledTimes(1);
      expect(cachedRequest.data).toEqual(expectedHourlyAqimock);
      expect(cachedRequest.ttl).toBeGreaterThan(0);
    });
  });
});
