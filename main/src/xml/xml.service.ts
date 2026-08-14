import { AxiosInstance } from "axios";
import XMLBuilder from "fast-xml-builder";
import { Aqi } from "../aqi/types";
import { AqiFetchError } from "../aqi/aqi.error";

type IXMLBuilder = (options: Record<string, unknown>) => string;

export function fastXmlBuilder(): IXMLBuilder {
  const xmlBuilder = new XMLBuilder({
    attributeNamePrefix: "$",
    ignoreAttributes: false,
    indentBy: "  ",
    textNodeName: "#text",
    format: true,
    suppressBooleanAttributes: false,
    suppressEmptyNode: true,
    cdataPropName: "cdata_desc",
  });

  return xmlBuilder.build.bind(xmlBuilder);
}

export class XmlService {
  builder: IXMLBuilder;
  axiosClient: () => AxiosInstance;

  constructor(builder: IXMLBuilder, axiosClient: () => AxiosInstance) {
    this.builder = builder;
    this.axiosClient = axiosClient;

    this.create = this.create.bind(this);
    this.appendContent = this.appendContent.bind(this);
  }

  async create(lastBuildDate: string) {
    const result = await this.getAqi();
    const description = result
      .filter((record) =>
        [
          "Zhongshan",
          "Zhongming",
          "Tainan",
          "Zuoying",
          "Hualien",
          "Kinmen",
        ].includes(record.sitename),
      )
      .map((item) => `${item.sitename} ${item.aqi} (${item.status}) <br>`)
      .reverse()
      .join("");

    const lastBuildDateInUtc = new Date(lastBuildDate).toUTCString();
    const xml = this.builder({
      rss: {
        $version: "2.0",
        "$xmlns:atom": "http://www.w3.org/2005/Atom",

        channel: {
          title: "Taiwan Aqi",
          link: "https://aqi.tageszeiten.com",
          description: "Taiwan Air Quality Index",
          language: "en-us",
          lastBuildDate: lastBuildDateInUtc,
          "atom:link": {
            $href: "https://aqi.tageszeiten.com/static/rss.xml",
            $rel: "self",
            $type: "application/rss+xml",
          },

          item: {
            title: "Today's air quality index in Taiwan",
            description: { cdata_desc: [description] },
            link: "https://nazlai.github.io/aqi-rss-frontend",
            pubDate: lastBuildDateInUtc,
            guid: {
              $isPermaLink: true,
              "#text": "https://nazlai.github.io/aqi-rss-frontend",
            },
          },
        },
      },
    });

    return xml.trim();
  }

  appendContent(content: string) {
    const head = `<?xml version="1.0" encoding="UTF-8"?>`;

    return head.concat(content);
  }

  async getAqi() {
    try {
      const res = await this.axiosClient().get<Array<Aqi>>("/aqx_p_432");

      return res.data;
    } catch (error) {
      throw new AqiFetchError("failed to fetch aqi data", { cause: error });
    }
  }
}
