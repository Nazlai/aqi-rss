import { NextFunction, Request, Response } from "express";
import { AqiService } from "./aqi.service";
import { Location } from "./enum";
import { cacheControl } from "../utils/cacheControl";
import { EmptyResponseError, PathNotFoundError } from "./aqi.error";

export type RequestWithLocation = Request<
  unknown,
  unknown,
  unknown,
  { location: Location }
>;

export class AqiController {
  service: AqiService;

  constructor(service: AqiService) {
    this.service = service;
  }

  async getLatestAqi(_: Request, res: Response) {
    const { data: result, ttl } = await this.service.getLatestAqi();

    res.set("Cache-Control", cacheControl(ttl));

    return res.status(200).send(result);
  }

  async getAqiByStationName(
    req: RequestWithLocation,
    res: Response,
    next: NextFunction,
  ) {
    try {
      if (req.query.location) {
        const { data: result, ttl } = await this.service.getAqiByStationName(
          req.query.location,
        );

        res.set("Cache-Control", cacheControl(ttl));

        return res.status(200).send(result);
      }
    } catch (error) {
      if (error instanceof PathNotFoundError) {
        return res.status(404).send({ message: "not found" });
      }

      if (error instanceof EmptyResponseError) {
        return res.status(404).send({ message: "not found" });
      }

      return next(error);
    }
  }
}
