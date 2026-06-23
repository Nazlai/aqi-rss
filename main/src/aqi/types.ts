import { AirQuality, DISTRICT, Pollutant, RAW_LOCATION } from "./enum";

export interface Aqi {
  siteid: string;
  sitename: string;
  county: RAW_LOCATION;
  aqi: string;
  pollutant: string;
  status: string;
  so2: string;
  co: string;
  o3: string;
  o3_8hr: string;
  pm10: string;
  "pm2.5": string;
  no2: string;
  nox: string;
  no: string;
  wind_speed: string;
  wind_direc: string;
  publishtime: string;
  co_8hr: string;
  "pm2.5_avg": string;
  pm10_avg: string;
  so2_avg: string;
  longitude: string;
  latitude: string;
}

export interface AqiData {
  siteid: string;
  sitename: string;
  county: DISTRICT;
  aqi: number | null;
  pollutant: string;
  status: AirQuality;
  "pm2.5": number | null;
  no2: number | null;
  pm10: number | null;
  o3: number | null;
  co: number | null;
  so2: number | null;
  "pm2.5_avg": number | null;
  pm10_avg: number | null;
  co_8hr: number | null;
  o3_8hr: number | null;
  publishtime: string;
  longitude: string;
  latitude: string;
}

export interface HourlyAqi {
  siteId: string;
  sitename: string;
  county: string;
  itemid: string;
  itemname: string;
  itemengname: Pollutant;
  itemunit: string;
  monitordate: string;
  concentration: string;
}

export interface HourlyAqiData {
  monitordate: string;
  [Pollutant.PARTICULATE_MATTER_TWO_POINT_FIVE]: number | null;
  [Pollutant.NITOGEN_DIOXIDE]: number | null;
  [Pollutant.PARTICULATE_MATTER_TEN]: number | null;
  [Pollutant.OZONE]: number | null;
  [Pollutant.CARBON_MONOXIDE]: number | null;
  [Pollutant.SULFUR_DIOXIDE]: number | null;
}
