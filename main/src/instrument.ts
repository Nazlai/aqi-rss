import Sentry from "@sentry/node";

export function initializeSentry(dsn: string) {
  Sentry.init({
    dsn,
    enableLogs: true,
    dataCollection: {
      // To disable sending user data and HTTP bodies, uncomment the lines below. For more info visit:
      // https://docs.sentry.io/platforms/javascript/guides/node/configuration/options/#dataCollection
      // userInfo: false,
      // httpBodies: [],
    },
    integrations: [
      Sentry.consoleLoggingIntegration({
        levels: ["warn", "error"],
      }),
    ],
  });
}
