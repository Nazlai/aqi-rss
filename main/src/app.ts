import express from "express";
import { aqiRouter } from "./aqi/aqi.router";

export const app = express();

app.use(express.json());

app.use("/aqi", aqiRouter);

app.get("/health", (_, res) => {
  res.send({ status: "healthy" });
});
