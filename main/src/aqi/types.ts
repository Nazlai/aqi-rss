import { AirQuality, Pollutant, RAW_LOCATION } from "./enum";

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
  county: RAW_LOCATION;
  aqi: string;
  pollutant: string;
  status: AirQuality;
  "pm2.5": string;
  no2: string;
  pm10: string;
  o3: string;
  co: string;
  so2: string;
  "pm2.5_avg": string;
  pm10_avg: string;
  co_8hr: string;
  o3_8hr: string;
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
  [Pollutant.PARTICULATE_MATTER_TWO_POINT_FIVE]: string;
  [Pollutant.NITOGEN_DIOXIDE]: string;
  [Pollutant.PARTICULATE_MATTER_TEN]: string;
  [Pollutant.OZONE]: string;
  [Pollutant.CARBON_MONOXIDE]: string;
  [Pollutant.SULFUR_DIOXIDE]: string;
}
