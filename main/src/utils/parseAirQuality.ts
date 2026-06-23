import { AIR_QUALITY_STRING_MAP } from "../aqi/constant";
import { AirQuality } from "../aqi/enum";

export function parseAirQuality(value: string): AirQuality {
  const normalizedValue = value.toLocaleLowerCase();
  const airQuality = AIR_QUALITY_STRING_MAP[normalizedValue];

  if (!airQuality) {
    return AirQuality.UNKNOWN;
  }

  return airQuality;
}
