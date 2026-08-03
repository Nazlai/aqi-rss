import { Request, Response } from "express";
import { AqiService } from "./aqi.service";
import { Location } from "./enum";

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
      const result = await this.service.getLatestAqi();

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
        const result = await this.service.getAqiByStationName(
          req.query.location,
        );

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
