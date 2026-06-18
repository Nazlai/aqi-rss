import { DISTRICT_LOOKUP } from "../aqi/constant";
import { DISTRICT, RAW_LOCATION } from "../aqi/enum";

export function parseDistrict(value: RAW_LOCATION): DISTRICT {
  const result = DISTRICT_LOOKUP[value];

  if (!result) {
    return DISTRICT.UNKNOWN;
  }

  return result;
}
