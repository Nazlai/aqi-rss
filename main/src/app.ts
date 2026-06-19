import express from "express";
import cors from "cors";
import { aqiRouter } from "./aqi/aqi.router";
import { ORIGIN } from "./constants/env";

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
