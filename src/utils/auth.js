const jwt = require("jsonwebtoken");
const { AuthenticationError } = require("apollo-server");
module.exports = context => {
  const { authorization } = context.req.headers;

  if (authorization) {
    const [, token] = authorization.split(" ");

    if (token) {
      try {
        const user = jwt.verify(token, process.env.APP_SECRET);
        return user;
      } catch (err) {
        throw new AuthenticationError("Invalid/Expired token");
      }
    }

    throw new AuthenticationError(
      "Authentication token must be Bearer [token]"
    );
  }

  throw new AuthenticationError("Authorization header must be provided");
};
