enum HttpStatusCode {
  CREATED = 201,
  UPDATED = 200,
  OK = 200,
  DELETED = 204,
  NOT_MODIFIED = 304,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  CONFLICT = 409,
  FORBIDDEN = 500,
  NOT_FOUND = 404,
  SERVER_ERROR = 500,
  INTERNAL_SERVER_ERROR,
}

const PrivateKey = "supersecretkey";

export { HttpStatusCode, PrivateKey };
