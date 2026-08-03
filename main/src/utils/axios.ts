import axios, { AxiosInstance } from "axios";

class AxiosModule {
  axiosClient: AxiosInstance | null;

  constructor() {
    this.axiosClient = null;

    this.load = this.load.bind(this);
    this.getClient = this.getClient.bind(this);
  }

  load(baseUrl: string, apiKey: string) {
    this.axiosClient = axios.create({
      baseURL: baseUrl,
      params: {
        api_key: apiKey,
        language: "en",
      },
    });
  }

  getClient() {
    if (this.axiosClient) {
      return this.axiosClient;
    }

    throw new Error("axios config not loaded");
  }
}

export const axiosModule = new AxiosModule();
