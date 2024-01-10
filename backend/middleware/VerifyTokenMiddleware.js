const env = require("dotenv");
const jwt = require("jsonwebtoken");

env.config();

const verifyJwtToken = (req, res, next) => {
  try {
    let jwtToken;
    if (req.headers.authorization) {
      jwtToken = req.headers.authorization.split(" ")[1];
      if (jwtToken) {
        jwt.verify(
          jwtToken,
          process.env.JWT_TOKEN_SECRET_KEY,
          (err, payload) => {
            if (err) {
              if (err.name === "TokenExpiredError") {
                res.status(401).send("Token Expired. Please log in again.");
              } else {
                res.status(401).send("Invalid Jwt Token");
              }
            } else {
              req.user = payload;
              next();
            }
          }
        );
      } else {
        res.status(401).send("Invalid Jwt Token");
      }
    } else {
      next();
      // res.status(401).json({ error: "Authorization header missing" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { verifyJwtToken };
