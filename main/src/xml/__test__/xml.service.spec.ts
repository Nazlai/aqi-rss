import { describe, it, expect } from "vitest";
import { fastXmlBuilder, XmlService } from "../xml.service";

describe("xml service", () => {
  it("should parse json into xml", () => {
    const builder = fastXmlBuilder();
    const service = XmlService(builder);
    const expected = `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Taiwan Aqi</title>
    <link>https://aqi.tageszeiten.com</link>
    <description>Taiwan Air Quality Index</description>
    <language>en-us</language>
    <lastBuildDate>Wed, 03 Jun 2026 16:00:00 GMT</lastBuildDate>
    <atom:link href="https://aqi.tageszeiten.com/feed.xml" rel="self" type="application/rss+xml"/>
    <item>
      <title>Today&apos;s air quality index in Taiwan</title>
      <link>https://aqi.tageszeiten.com</link>
      <pubDate>Wed, 03 Jun 2026 16:00:00 GMT</pubDate>
      <guid isPermaLink="true">https://aqi.tageszeiten.com</guid>
    </item>
  </channel>
</rss>`;

    expect(service.create("Thu Jun 04 2026")).toBe(expected);
  });
});
