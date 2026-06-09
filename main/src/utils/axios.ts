import axios from "axios";
import { API_ENDPOINT } from "../constants/env";

export const axiosClient = axios.create({
  baseURL: API_ENDPOINT,
  params: {
    api_key: process.env.API_KEY,
    language: "en",
  },
});
