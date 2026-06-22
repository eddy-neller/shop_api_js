const ISO_DURATION =
  /^P(?:(?<days>\d+)D)?(?:T(?:(?<hours>\d+)H)?(?:(?<minutes>\d+)M)?(?:(?<seconds>\d+)S)?)?$/;

export function addIsoDuration(date: Date, duration: string): Date {
  const match = ISO_DURATION.exec(duration);

  if (match?.groups === undefined) {
    throw new Error(`Invalid ISO duration: ${duration}`);
  }

  const days = Number(match.groups.days ?? 0);
  const hours = Number(match.groups.hours ?? 0);
  const minutes = Number(match.groups.minutes ?? 0);
  const seconds = Number(match.groups.seconds ?? 0);
  const milliseconds =
    (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000;

  return new Date(date.getTime() + milliseconds);
}
