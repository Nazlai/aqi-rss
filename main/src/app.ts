import express from "express";
import cors from "cors";
import { aqiRouter } from "./aqi/aqi.router";
import { redisClient } from "./cache-manager/redisClient";
import { loadEnvironmentVariables } from "./utils/loadEnvironmentVariables";
import { axiosModule } from "./utils/axios";

export async function bootstrap() {
  const config = await loadEnvironmentVariables("/aqi");

  axiosModule.load(config.API_ENDPOINT, config.API_KEY);
  redisClient.load(config.REDIS_CONNECTION);

  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: config.ORIGIN,
    }),
  );

  app.use("/api/aqi", aqiRouter);

  app.get("/health", (_, res) => {
    res.send({ status: "healthy" });
  });

  redisClient.connect().catch((err) => {
    console.log("redis connection failed", err);
    process.exit(1);
  });

  return { app, config };
}
