import express from "express";
import cors from "cors";
import { aqiRouter } from "./aqi/aqi.router";
import { redisClient } from "./cache-manager/redisClient";
import { loadEnvironmentVariables } from "./utils/loadEnvironmentVariables";
import { axiosModule } from "./utils/axios";
import Sentry from "@sentry/node";
import { initializeSentry } from "./instrument";

export async function bootstrap() {
  const config = await loadEnvironmentVariables("/aqi");

  axiosModule.load(config.API_ENDPOINT, config.API_KEY);
  redisClient.load(config.REDIS_CONNECTION);
  initializeSentry(config.SENTRY_DSN);

  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: config.ORIGIN,
      allowedHeaders: ["sentry-trace", "baggage"],
    }),
  );

  app.use("/api/aqi", aqiRouter);

  app.get("/health", (_, res) => {
    res.send({ status: "healthy" });
  });

  Sentry.setupExpressErrorHandler(app);

  redisClient.connect().catch((err) => {
    console.error("redis connection failed", err);
    process.exit(1);
  });

  return { app, config };
}
