import { capitalize } from "../../utils/capitalize";
import { parseAirQuality } from "../../utils/parseAirQuality";
import { parseDistrict } from "../../utils/parseDistrict";
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

function castToNumber(value: string): number | null {
  const castedValue = Number(value);

  if (!value || Number.isNaN(castedValue)) {
    return null;
  }

  return castedValue;
}

export function aqiDataConverter(value: Aqi): AqiData {
  const siteName = value.sitename.replace(citiesRegex, "");

  return {
    siteid: value.siteid,
    sitename: capitalize(siteName),
    county: parseDistrict(value.county),
    aqi: castToNumber(value.aqi),
    pollutant: value.pollutant,
    status: parseAirQuality(value.status),
    "pm2.5": castToNumber(value["pm2.5"]),
    no2: castToNumber(value.no2),
    pm10: castToNumber(value.pm10),
    o3: castToNumber(value.o3),
    co: castToNumber(value.co),
    so2: castToNumber(value.so2),
    "pm2.5_avg": castToNumber(value["pm2.5_avg"]),
    pm10_avg: castToNumber(value.pm10_avg),
    co_8hr: castToNumber(value.co_8hr),
    o3_8hr: castToNumber(value.o3_8hr),
    publishtime: value.publishtime,
    longitude: value.longitude,
    latitude: value.latitude,
  };
}
