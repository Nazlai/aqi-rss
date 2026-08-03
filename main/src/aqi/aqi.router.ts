import { Router } from "express";
import { AqiController } from "./aqi.controller";
import { AqiService } from "./aqi.service";
import { redisClient } from "../cache-manager/redisClient";
import { axiosModule } from "../utils/axios";

export const aqiRouter = Router();

const service = new AqiService(redisClient.getClient, axiosModule.getClient);
const controller = new AqiController(service);

aqiRouter.get("/", controller.getLatestAqi.bind(controller));
aqiRouter.get("/hourly", controller.getAqiByStationName.bind(controller));
