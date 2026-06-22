import axios from "axios";
import { API_ENDPOINT, API_KEY } from "../constants/env";

export const axiosClient = axios.create({
  baseURL: API_ENDPOINT,
  params: {
    api_key: API_KEY,
    language: "en",
  },
});
