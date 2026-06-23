import express from "express";
import cors from "cors";
import { aqiRouter } from "./aqi/aqi.router";
import { ORIGIN } from "./constants/env";
import { connectRedis } from "./cache-manager/redisClient";

export const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ORIGIN,
  }),
);

app.use("/api/aqi", aqiRouter);

app.get("/health", (_, res) => {
  res.send({ status: "healthy" });
});

connectRedis().catch((err) => {
  console.log("redis connection failed", err);
  process.exit(1);
});
