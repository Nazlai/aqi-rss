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
        NEW_TAIPEI_CITY: res.data.filter((i) => i.county === "New Taipei City"),
        KEELUNG_CITY: res.data.filter((i) => i.county === "Keelung City"),
        TAOYUAN_CITY: res.data.filter((i) => i.county === "Taoyuan County"),
        HSINCHU_CITY: res.data.filter((i) => i.county === "Hsinchu City"),
        HSINCHU_COUNTY: res.data.filter((i) => i.county === "Hsinchu County"),
        MIAOLI_COUNTY: res.data.filter((i) => i.county === "Miaoli County"),
        TAICHUNG_CITY: res.data.filter(
          (i) => i.county === "Taichung City" && !/nantou/i.test(i.sitename),
        ),
        NANTOU_COUNTY: res.data.filter(
          (i) => i.county === "Nantou County" || /nantou/i.test(i.sitename),
        ),
        CHANGHUA_COUNTY: res.data.filter((i) => i.county === "Changhua County"),
        YUNLIN_COUNTY: res.data.filter((i) => i.county === "Yunlin County"),
        CHIAYI_CITY: res.data.filter((i) => i.county === "Chiayi City"),
        CHIAYI_COUNTY: res.data.filter((i) => i.county === "Chiayi County"),
        TAINAN_CITY: res.data.filter((i) => i.county === "Tainan City"),
        KAOHSIUNG_CITY: res.data.filter((i) => i.county === "Kaohsiung City"),
        PINGTUNG_COUNTY: res.data.filter((i) => i.county === "Pingtung County"),
        YILAN_COUNTY: res.data.filter((i) => i.county === "Yilan County"),
        HUALIEN_COUNTY: res.data.filter((i) => i.county === "Hualien County"),
        TAITUNG_COUNTY: res.data.filter((i) => i.county === "Taitung County"),
        PENGHU_COUNTY: res.data.filter((i) => i.county === "Penghu County"),
        KINMEN_COUNTY: res.data.filter((i) => i.county === "Kinmen County"),
        LIENCHIANG_COUNTY: res.data.filter(
          (i) => i.county === "Lienchiang County",
        ),
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
