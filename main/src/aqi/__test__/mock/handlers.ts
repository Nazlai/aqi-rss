import { http, HttpResponse } from "msw";
import aqiMock from "./aqi.mock.json";
import hourlyAqiMock from "./hourlyaqi.mock.json";

const API_ENDPOINT = process.env.API_ENDPOINT;

export const handlers = [
  http.get(`${API_ENDPOINT}/aqx_p_432`, () => {
    return HttpResponse.json(aqiMock);
  }),
  http.get(`${API_ENDPOINT}/aqx_p_200`, () => {
    return HttpResponse.json(hourlyAqiMock);
  }),
];
