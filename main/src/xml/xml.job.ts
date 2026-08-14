import { axiosModule } from "../utils/axios";
import { fastXmlBuilder, XmlService } from "./xml.service";
import { uploadToBucket } from "../utils/uploadToBucket";
import { CronJob } from "cron";
import Sentry from "@sentry/node";
import { parseRssUploadError, RssUploadError } from "./xml.error";

const EVERY_DAY_AT_SEVEN = "0 0 7 * * *";

async function updateRssFeed(
  xmlService: XmlService,
  upload: typeof uploadToBucket,
) {
  const date = new Date().toISOString();
  const xml = await xmlService.create(date);
  const result = await upload("rss.xml", xmlService.appendContent(xml));
  const status = result?.$metadata.httpStatusCode;

  if (status && status >= 200 && status < 300) {
    return result;
  }

  if (result) {
    throw new RssUploadError(result);
  }

  throw new Error("aqi-rss update failure");
}

export function scheduleXmlJob(cron: typeof CronJob) {
  return cron.from({
    cronTime: EVERY_DAY_AT_SEVEN,
    timeZone: "Asia/Taipei",
    onTick: async function onTick() {
      try {
        const result = await updateRssFeed(
          new XmlService(fastXmlBuilder(), axiosModule.getClient),
          uploadToBucket,
        );
        Sentry.logger.info("aqi-rss xml updated", { result });
      } catch (error) {
        if (error instanceof RssUploadError) {
          Sentry.getCurrentScope().setContext(
            "s3_response",
            parseRssUploadError(error),
          );
        }
        throw error;
      }
    },
    errorHandler: function (error) {
      Sentry.captureException(error);
    },
  });
}
