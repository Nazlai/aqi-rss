import { axiosClient } from "../utils/axios";
import { EmptyResponseError, PathNotFoundError } from "./aqi.error";
import { LOCATION_API, DISTRICT_LOOKUP } from "./constant";
import { DISTRICT, Location, Pollutant, RAW_LOCATION } from "./enum";
import { Aqi, AqiData, HourlyAqi, HourlyAqiData } from "./types";
import { aqiDataConverter } from "./utils/aqiDataConverter";
import { RedisClientType } from "redis";

const HOURS_IN_DAY = 24;

const INITIAL_LOCATION_MAP = {
  [DISTRICT.TAIPEI_CITY]: [],
  [DISTRICT.NEW_TAIPEI_CITY]: [],
  [DISTRICT.KEELUNG_CITY]: [],
  [DISTRICT.TAOYUAN_CITY]: [],
  [DISTRICT.HSINCHU_CITY]: [],
  [DISTRICT.HSINCHU_COUNTY]: [],
  [DISTRICT.MIAOLI_COUNTY]: [],
  [DISTRICT.TAICHUNG_CITY]: [],
  [DISTRICT.NANTOU_COUNTY]: [],
  [DISTRICT.CHANGHUA_COUNTY]: [],
  [DISTRICT.YUNLIN_COUNTY]: [],
  [DISTRICT.CHIAYI_CITY]: [],
  [DISTRICT.CHIAYI_COUNTY]: [],
  [DISTRICT.TAINAN_CITY]: [],
  [DISTRICT.KAOHSIUNG_CITY]: [],
  [DISTRICT.PINGTUNG_COUNTY]: [],
  [DISTRICT.YILAN_COUNTY]: [],
  [DISTRICT.HUALIEN_COUNTY]: [],
  [DISTRICT.TAITUNG_COUNTY]: [],
  [DISTRICT.PENGHU_COUNTY]: [],
  [DISTRICT.KINMEN_COUNTY]: [],
  [DISTRICT.LIENCHIANG_COUNTY]: [],
};

export class AqiService {
  cacheManager: RedisClientType;

  constructor(cacheManager: RedisClientType) {
    this.cacheManager = cacheManager;
  }

  async getLatestAqi() {
    const cache = await this.cacheManager.get("aqx_p_432");

    if (cache) {
      return JSON.parse(cache);
    }

    try {
      const res = await axiosClient.get<Array<Aqi>>("/aqx_p_432");
      const data = res.data.reduce(
        (acc: Record<Exclude<DISTRICT, DISTRICT.UNKNOWN>, AqiData[]>, cur) => {
          const key = DISTRICT_LOOKUP[cur.county];
          const list = acc[key];
          const aqiData = aqiDataConverter(cur);

          if (
            cur.county === RAW_LOCATION.NANTOU_COUNTY ||
            /nantou/i.test(cur.sitename)
          ) {
            return {
              ...acc,
              [DISTRICT.NANTOU_COUNTY]: list.concat(aqiData),
            };
          }

          if (
            cur.county === RAW_LOCATION.TAICHUNG_CITY &&
            !/nantou/i.test(cur.sitename)
          ) {
            return {
              ...acc,
              [DISTRICT.TAICHUNG_CITY]: list.concat(aqiData),
            };
          }

          return {
            ...acc,
            [key]: list.concat(aqiData),
          };
        },
        INITIAL_LOCATION_MAP,
      );

      this.cacheManager.set("aqx_p_432", JSON.stringify(data));

      return data;
    } catch (error) {
      throw error;
    }
  }

  async getAqiByStationName(location: Location) {
    const cache = await this.cacheManager.get(location);

    if (cache) {
      return JSON.parse(cache);
    }

    try {
      const locationId = LOCATION_API[location];

      if (!locationId) {
        throw new PathNotFoundError();
      }

      const endpoint = `/aqx_p_${locationId}`;
      const pollutants = Object.keys(Pollutant).length;
      const res = await axiosClient.get<Array<HourlyAqi>>(endpoint, {
        params: {
          limit: pollutants * HOURS_IN_DAY,
        },
      });

      if (!res.data.length) {
        throw new EmptyResponseError();
      }

      const head = res.data[0];
      const mergedData = res.data
        .reduce((acc: Partial<HourlyAqiData>[], cur) => {
          const [last] = acc.slice(-1);

          if (last && last.monitordate === cur.monitordate) {
            return acc.concat([
              { ...last, [cur.itemengname]: Number(cur.concentration) },
            ]);
          }

          return acc.concat({
            monitordate: cur.monitordate,
            [cur.itemengname]: Number(cur.concentration),
          });
        }, [])
        .filter((item) => Object.values(item).length === pollutants + 1);

      const data = {
        result: mergedData,
        total: mergedData.length,
        county: head.county,
        sitename: head.sitename,
      };

      this.cacheManager.set(location, JSON.stringify(data));

      return data;
    } catch (error) {
      throw error;
    }
  }
}
