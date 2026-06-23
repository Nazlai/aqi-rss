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
import { API_ENDPOINT } from "../../constants/env";
import { RedisClientType } from "redis";

const server = setupServer(...handlers);

beforeAll(() => {
  server.listen();
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => {
  server.close();
});

const mockRedis = vi.mockObject({
  get: vi.fn(),
  set: vi.fn(),
}) as unknown as RedisClientType;

describe("aqi service", () => {
  describe("getLatestAqi", () => {
    it("parses retrieved aqi data", async () => {
      const service = new AqiService(mockRedis);
      expect(await service.getLatestAqi()).toEqual(expectedAqimock);
    });
  });

  describe("getAqiByStationName", () => {
    it("parses retrieved hourly aqi data", async () => {
      const service = new AqiService(mockRedis);
      expect(await service.getAqiByStationName(TAIPEI_CITY.ZHONGSHAN)).toEqual(
        expectedHourlyAqimock,
      );
    });

    it("should handle locations with empty api path", async () => {
      const service = new AqiService(mockRedis);
      await expect(
        service.getAqiByStationName(TAICHUNG_CITY.TAIWAN_AVENUE),
      ).rejects.toThrow(PathNotFoundError);
    });

    it("should handle empty list response", async () => {
      const service = new AqiService(mockRedis);
      server.use(
        http.get(`${API_ENDPOINT}/aqx_p_200`, () => {
          return HttpResponse.json([]);
        }),
      );

      await expect(
        service.getAqiByStationName(TAIPEI_CITY.ZHONGSHAN),
      ).rejects.toThrow(EmptyResponseError);
    });
  });
});
