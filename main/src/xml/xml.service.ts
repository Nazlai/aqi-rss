import XMLBuilder from "fast-xml-builder";

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
  });

  return xmlBuilder.build.bind(xmlBuilder);
}

export function XmlService(builder: IXMLBuilder) {
  function create(lastBuildDate: string) {
    const lastBuildDateInUtc = new Date(lastBuildDate).toUTCString();
    const xml = builder({
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
            $href: "https://aqi.tageszeiten.com/feed.xml",
            $rel: "self",
            $type: "application/rss+xml",
          },

          item: {
            title: "Today's air quality index in Taiwan",
            link: "https://aqi.tageszeiten.com",
            pubDate: lastBuildDateInUtc,
            guid: {
              $isPermaLink: true,
              "#text": "https://aqi.tageszeiten.com",
            },
          },
        },
      },
    });

    return xml.trim();
  }

  function appendContent(content: string) {
    const head = `<?xml version="1.0" encoding="UTF-8"?>`;

    return head.concat(content);
  }

  return { create, appendContent };
}
