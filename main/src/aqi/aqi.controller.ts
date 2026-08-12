import { Request, Response } from "express";
import { AqiService } from "./aqi.service";
import { Location } from "./enum";
import { cacheControl } from "../utils/cacheControl";

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
    try {
      const { data: result, ttl } = await this.service.getLatestAqi();

      res.set("Cache-Control", cacheControl(ttl));

      return res.status(200).send(result);
    } catch (error) {
      // FIXME
      // improve error handling
      console.error(error);
    }
  }

  async getAqiByStationName(req: RequestWithLocation, res: Response) {
    try {
      if (req.query.location) {
        const { data: result, ttl } = await this.service.getAqiByStationName(
          req.query.location,
        );

        res.set("Cache-Control", cacheControl(ttl));

        return res.status(200).send(result);
      }
    } catch (error) {
      // FIXME
      // improve error handling
      console.error(error);
      return res.status(404).send({ message: "not found" });
    }
  }
}
