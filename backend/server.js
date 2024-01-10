const express = require("express");
const env = require("dotenv");
const multer = require("multer");
const cors = require("cors");

const client = require("./connectDb");
const verifyIdTokenMiddleware = require("./middleware/VerifyTokenMiddleware");
const userController = require("./controllers/userController");
const tweetController = require("./controllers/tweetController");
const likesController = require("./controllers/likesController");

const multerUpload = multer({ storage: multer.memoryStorage() });
env.config();
const PORT = process.env.PORT;
const app = express();
app.use(express.json());
app.use(cors());
const connectDb = async () => {
  try {
    await client.connect();
    console.log("Connected to the database");
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
};
connectDb();

// User

app.post("/user/login", userController.signInUser);
app.get(
  "/user/info",
  verifyIdTokenMiddleware.verifyJwtToken,
  userController.getUserInfo
);
app.put(
  "/user/update/picture",
  verifyIdTokenMiddleware.verifyJwtToken,
  multerUpload.single("profile_picture"),
  userController.updateProfilePicture
);
app.delete(
  "/user/delete",
  verifyIdTokenMiddleware.verifyJwtToken,
  userController.deleteUser
);

// Tweets

app.post(
  "/user/post/tweet",
  verifyIdTokenMiddleware.verifyJwtToken,
  multerUpload.single("tweet_picture"),
  tweetController.postTweet
);
app.get(
  "/user/tweets",
  verifyIdTokenMiddleware.verifyJwtToken,
  tweetController.getLoggedInUserTweets
);
app.get(
  "/tweet/:tweetId",
  verifyIdTokenMiddleware.verifyJwtToken,
  tweetController.getTweetByTweetId
);
app.get(
  "/user/:userId/tweets",
  verifyIdTokenMiddleware.verifyJwtToken,
  tweetController.getTweetByUserId
);
app.get(
  "/user/feed",
  verifyIdTokenMiddleware.verifyJwtToken,
  tweetController.getUserFeed
);
app.put(
  "/tweet/:tweetId",
  verifyIdTokenMiddleware.verifyJwtToken,
  tweetController.updateTweet
);
app.delete(
  "/tweet/:tweetId",
  verifyIdTokenMiddleware.verifyJwtToken,
  tweetController.deleteTweet
);

// Likes

app.post(
  "/tweets/:tweetId/like",
  verifyIdTokenMiddleware.verifyJwtToken,
  likesController.likeTweet
);
app.delete(
  "/tweets/:tweetId/unlike",
  verifyIdTokenMiddleware.verifyJwtToken,
  likesController.unlikeTweet
);
app.get(
  "/tweets/:tweetId/likes",
  verifyIdTokenMiddleware.verifyJwtToken,
  likesController.getLikesForTweet
);
app.get(
  "/tweets/:tweetId/likes/count",
  verifyIdTokenMiddleware.verifyJwtToken,
  likesController.getLikeCountForTweet
);

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
