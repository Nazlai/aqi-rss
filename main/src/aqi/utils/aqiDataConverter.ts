import { Aqi, AqiData } from "../types";

export function aqiDataConverter(value: Aqi): AqiData {
  return {
    siteid: value.siteid,
    sitename: value.sitename,
    county: value.county,
    aqi: value.aqi,
    pollutant: value.pollutant,
    status: value.status,
    "pm2.5": value["pm2.5"],
    no2: value.no2,
    pm10: value.pm10,
    o3: value.o3,
    co: value.co,
    so2: value.so2,
    "pm2.5_avg": value["pm2.5_avg"],
    pm10_avg: value.pm10_avg,
    co_8hr: value.co_8hr,
    o3_8hr: value.o3_8hr,
    publishtime: value.publishtime,
    longitude: value.longitude,
    latitude: value.latitude,
  };
}
