import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { fastXmlBuilder, XmlService } from "../xml.service";
import { handlers } from "../../aqi/__test__/mock/handlers";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import axios from "axios";
import { afterEach } from "node:test";
import { AqiFetchError } from "../../aqi/aqi.error";

const server = setupServer(...handlers);

const axiosClient = axios.create({
  baseURL: process.env.API_ENDPOINT,
  params: {
    api_key: process.env.API_KEY,
    language: "en",
  },
});

const mockAxiosClient = () => axiosClient;

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

describe("xml service", () => {
  it("should parse json into xml", async () => {
    const builder = fastXmlBuilder();
    const service = new XmlService(builder, mockAxiosClient);
    const expected = `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Taiwan Aqi</title>
    <link>https://aqi.tageszeiten.com</link>
    <description>Taiwan Air Quality Index</description>
    <language>en-us</language>
    <lastBuildDate>Thu, 04 Jun 2026 00:00:00 GMT</lastBuildDate>
    <atom:link href="https://aqi.tageszeiten.com/static/rss.xml" rel="self" type="application/rss+xml"/>
    <item>
      <title>Today&apos;s air quality index in Taiwan</title>
      <description>
        <![CDATA[Zhongshan 52 (Hazardous) <br>Zhongming 36 (Good) <br>Tainan 45 (Good) <br>Zuoying 40 (Good) <br>Hualien 11 (Good) <br>Kinmen 49 (Good) <br>]]>
      </description>
      <link>https://nazlai.github.io/aqi-rss-frontend</link>
      <pubDate>Thu, 04 Jun 2026 00:00:00 GMT</pubDate>
      <guid isPermaLink="true">https://nazlai.github.io/aqi-rss-frontend</guid>
    </item>
  </channel>
</rss>`;

    expect(await service.create("2026-06-04T00:00:00.000Z")).toBe(expected);
  });

  it("should handle empty aqi data", async () => {
    server.use(
      http.get(`${process.env.API_ENDPOINT}/aqx_p_432`, () => {
        return HttpResponse.json([]);
      }),
    );

    const builder = fastXmlBuilder();
    const service = new XmlService(builder, mockAxiosClient);
    const expected = `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Taiwan Aqi</title>
    <link>https://aqi.tageszeiten.com</link>
    <description>Taiwan Air Quality Index</description>
    <language>en-us</language>
    <lastBuildDate>Thu, 04 Jun 2026 00:00:00 GMT</lastBuildDate>
    <atom:link href="https://aqi.tageszeiten.com/static/rss.xml" rel="self" type="application/rss+xml"/>
    <item>
      <title>Today&apos;s air quality index in Taiwan</title>
      <description>
        <![CDATA[]]>
      </description>
      <link>https://nazlai.github.io/aqi-rss-frontend</link>
      <pubDate>Thu, 04 Jun 2026 00:00:00 GMT</pubDate>
      <guid isPermaLink="true">https://nazlai.github.io/aqi-rss-frontend</guid>
    </item>
  </channel>
</rss>`;

    expect(await service.create("2026-06-04T00:00:00.000Z")).toBe(expected);
  });

  it("should handle api errors", async () => {
    server.use(
      http.get(`${process.env.API_ENDPOINT}/aqx_p_432`, () => {
        return HttpResponse.json({}, { status: 500 });
      }),
    );

    const builder = fastXmlBuilder();
    const service = new XmlService(builder, mockAxiosClient);

    await expect(service.create("2026-06-04T00:00:00.000Z")).rejects.toThrow(
      AqiFetchError,
    );
  });
});
