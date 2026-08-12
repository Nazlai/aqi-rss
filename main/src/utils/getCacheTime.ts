const SECONDS_IN_MINUTE = 60;
const MS_IN_SECOND = 1000;
const TWENTY_MINUTES_FLOOR = 20 * SECONDS_IN_MINUTE;

export function getCacheTime(minuteCeiling: number) {
  const now = new Date();
  const ceilingInSeconds = minuteCeiling * SECONDS_IN_MINUTE;
  const nowInMs =
    now.getMinutes() * SECONDS_IN_MINUTE * MS_IN_SECOND +
    now.getSeconds() * MS_IN_SECOND +
    now.getMilliseconds();
  const rawDuration = Math.ceil(
    (ceilingInSeconds * MS_IN_SECOND - nowInMs) / MS_IN_SECOND,
  );

  return Math.min(
    ceilingInSeconds,
    Math.max(TWENTY_MINUTES_FLOOR, rawDuration),
  );
}
