import { Router } from "express";
import { AqiController } from "./aqi.controller";
import { AqiService } from "./aqi.service";

export const aqiRouter = Router();

const service = new AqiService();
const controller = new AqiController(service);

aqiRouter.get("/", controller.getLatestAqi.bind(controller));
aqiRouter.get("/hourly", controller.getAqiByStationName.bind(controller));
