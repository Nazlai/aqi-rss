import { capitalize } from "../../utils/capitalize";
import { parseAirQuality } from "../../utils/parseAirQuality";
import { RAW_LOCATION } from "../enum";
import { Aqi, AqiData } from "../types";

const LEFT_UNICODE_PARENTHESIS = "\\uff08";
const RIGHT_UNICODE_PARENTHESIS = "\\uff09";
const cities = Object.values(RAW_LOCATION)
  .map((city) => city.replace(/\s(city)|\s(county)/i, ""))
  .join("|");
const citiesRegex = new RegExp(
  `(${cities})${LEFT_UNICODE_PARENTHESIS}|${RIGHT_UNICODE_PARENTHESIS}`,
  "g",
);

export function aqiDataConverter(value: Aqi): AqiData {
  const siteName = value.sitename.replace(citiesRegex, "");

  return {
    siteid: value.siteid,
    sitename: capitalize(siteName),
    county: value.county,
    aqi: value.aqi,
    pollutant: value.pollutant,
    status: parseAirQuality(value.status),
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
