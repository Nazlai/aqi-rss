import { describe, it, expect, vi } from "vitest";
import { EmptyResponseError, PathNotFoundError } from "../aqi.error";
import { AqiController, RequestWithLocation } from "../aqi.controller";
import { TAIPEI_CITY } from "../enum";
import { Request, Response } from "express";
import expectedAqimock from "./mock/aqi.mock.expected.json";
import expectedHourlyAqimock from "./mock/hourlyaqi.mock.expected.json";

describe("aqi controller", () => {
  describe("getLatestAqi", () => {
    it("should return 200 with latest aqi on success", async () => {
      const MockAqiService = vi.fn(
        class {
          constructor() {}

          getAqiByStationName = vi.fn();

          getLatestAqi = vi.fn(() => Promise.resolve(expectedAqimock));
        },
      );
      const controller = new AqiController(new MockAqiService());
      const request = {} as Request;
      const response = {
        send: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.getLatestAqi(request, response);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.send).toHaveBeenCalledWith(expectedAqimock);
    });
  });

  describe("getAqiByStationName", () => {
    it("should return 200 with aqi response on success", async () => {
      const MockAqiService = vi.fn(
        class {
          constructor() {}

          getAqiByStationName = vi.fn(() =>
            Promise.resolve(expectedHourlyAqimock),
          );

          getLatestAqi = vi.fn();
        },
      );
      const controller = new AqiController(new MockAqiService());
      const request = {
        query: { location: TAIPEI_CITY.ZHONGSHAN },
      } as RequestWithLocation;
      const response = {
        send: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.getAqiByStationName(request, response);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.send).toHaveBeenCalledWith(expectedHourlyAqimock);
    });

    it("should return 404 when a PathNotFoundError error is encountered", async () => {
      const MockAqiService = vi.fn(
        class {
          constructor() {}

          getAqiByStationName = vi.fn(() => {
            throw new PathNotFoundError();
          });

          getLatestAqi = vi.fn();
        },
      );
      const controller = new AqiController(new MockAqiService());
      const request = {
        query: { location: TAIPEI_CITY.ZHONGSHAN },
      } as RequestWithLocation;
      const response = {
        send: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.getAqiByStationName(request, response);

      expect(response.status).toHaveBeenLastCalledWith(404);
      expect(response.send).toHaveBeenCalledWith({ message: "not found" });
    });

    it("should return 404 when a EmptyResponseError error is encountered", async () => {
      const MockAqiService = vi.fn(
        class {
          constructor() {}

          getAqiByStationName = vi.fn(() => {
            throw new EmptyResponseError();
          });

          getLatestAqi = vi.fn();
        },
      );
      const controller = new AqiController(new MockAqiService());
      const request = {
        query: { location: TAIPEI_CITY.ZHONGSHAN },
      } as RequestWithLocation;
      const response = {
        send: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.getAqiByStationName(request, response);

      expect(response.status).toHaveBeenLastCalledWith(404);
      expect(response.send).toHaveBeenCalledWith({ message: "not found" });
    });
  });
});
