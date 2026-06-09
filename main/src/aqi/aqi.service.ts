import { axiosClient } from "../utils/axios";
import { EmptyResponseError, PathNotFoundError } from "./aqi.error";
import { LOCATION_API } from "./constant";
import { Location, Pollutant } from "./enum";
import { Aqi, HourlyAqi, HourlyAqiData } from "./types";

const HOURS_IN_DAY = 24;

export class AqiService {
  constructor() {}

  async getLatestAqi() {
    try {
      const res = await axiosClient.get<Array<Aqi>>("/aqx_p_432");
      const data = {
        TAIPEI_CITY: res.data.filter((i) => i.county === "Taipei City"),
      };

      return data;
    } catch (error) {
      throw error;
    }
  }

  async getAqiByStationName(location: Location) {
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
              { ...last, [cur.itemengname]: cur.concentration },
            ]);
          }

          return acc.concat({
            monitordate: cur.monitordate,
            [cur.itemengname]: cur.concentration,
          });
        }, [])
        .filter((item) => Object.values(item).length === pollutants + 1);

      return {
        result: mergedData,
        total: mergedData.length,
        county: head.county,
        sitename: head.sitename,
      };
    } catch (error) {
      throw error;
    }
  }
}
