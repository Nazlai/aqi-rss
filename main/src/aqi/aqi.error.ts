export class PathNotFoundError extends Error {
  location: string;

  constructor(
    message: string = "location does not have a corresponding api path",
    location: string,
  ) {
    super(message);

    this.location = location;
  }
}

export class EmptyResponseError extends Error {
  constructor(message: string = "api response does not have entries") {
    super(message);
  }
}
