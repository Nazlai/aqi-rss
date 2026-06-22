import { Router } from "express";
import { AqiController } from "./aqi.controller";
import { AqiService } from "./aqi.service";
import { client } from "../cache-manager/redisClient";

export const aqiRouter = Router();

const service = new AqiService(client);
const controller = new AqiController(service);

aqiRouter.get("/", controller.getLatestAqi.bind(controller));
aqiRouter.get("/hourly", controller.getAqiByStationName.bind(controller));
