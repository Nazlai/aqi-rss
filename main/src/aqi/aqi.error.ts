export class PathNotFoundError extends Error {
  constructor(
    message: string = "location does not have a corresponding api path",
  ) {
    super(message);
  }
}

export class EmptyResponseError extends Error {
  constructor(message: string = "api response does not have entries") {
    super(message);
  }
}
