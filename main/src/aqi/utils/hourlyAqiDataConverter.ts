export function hourlyAqiDataConverter(value: string): number | null {
  const castedValue = Number(value);

  if (value === "x" || Number.isNaN(castedValue)) {
    return null;
  }

  return castedValue;
}
