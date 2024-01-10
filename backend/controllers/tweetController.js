const client = require("../connectDb");
const { storage } = require("../config/firbaseConfig");
const redis = require("redis");
env.config();

let redisClient;
(async () => {
  redisClient = redis.createClient();

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
})();

const postTweet = async (req, res) => {
  const { userId } = req.user;
  const tweetPictureFile = req.file;
  const tweetContent = req.body.tweet_content;

  let tweetPictureUrl = null;
  if (tweetPictureFile) {
    const timestamp = new Date().toISOString();
    const fileName = `user_${userId}_tweet_picture_${timestamp}.jpg`;
    const bucket = storage.bucket(process.env.TWEET_PICS_BUCKET_NAME);
    const file = bucket.file(fileName);
    try {
      await file.save(tweetPictureFile.buffer);
      [tweetPictureUrl] = await file.getSignedUrl({
        action: "read",
        expires: "2030-01-01",
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }

  try {
    const postTweetQuery = `
    INSERT INTO tweets (tweet_content,tweet_picture,user_id,created_at)
    VALUES ($1,$2,$3,CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata') 
    returning *
    `;
    const values = [tweetContent, tweetPictureUrl, userId];
    const data = await client.query(postTweetQuery, values);
    res
      .status(200)
      .json({ message: "Posted Successfully", content: data.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const getLoggedInUserTweets = async (req, res) => {
  const { userId } = req.user;
  const userTweets = await client.query(
    `SELECT * FROM tweets WHERE user_id = '${userId}'`
  );
  res.status(200).send(userTweets.rows);
};

const getTweetByTweetId = async (req, res) => {
  const { tweetId } = req.params;

  const tweetDetails = await client.query(`
    SELECT
      tweets.*, users.name username, users.profile_picture user_profile_pic
    FROM 
      tweets JOIN users ON tweets.user_id = users.user_id 
    WHERE 
      tweet_id = ${tweetId}`);

  const [tweet] = tweetDetails.rows;

  res.status(200).send(tweet);
};

const getTweetByUserId = async (req, res) => {
  const { userId } = req.params;
  const userTweets = await client.query(`
  SELECT
    tweets.*, users.name username, users.profile_picture user_profile_pic
  FROM 
    tweets JOIN users ON tweets.user_id = users.user_id  
  WHERE 
  tweets.user_id = '${userId}'`);
  res.status(200).send(userTweets.rows);
};

const getUserFeed = async (req, res) => {
  let userFeed;
  let isCache = false;
  try {
    const cacheKey = req.headers.authorization
      ? `userFeed_${req.user.userId}`
      : "publicFeed";

    await redisClient.del(cacheKey);
    console.log(cacheKey);

    const cacheResults = await redisClient.get(cacheKey);
    if (cacheResults) {
      userFeed = JSON.parse(cacheResults);
      isCache = true;
    } else {
      let getUserFeedQuery;

      if (req.headers.authorization) {
        getUserFeedQuery = `
        SELECT
        tweets.*, 
        users.name username, 
        users.profile_picture user_profile_pic,
        COUNT(likes.tweet_id) likes_count
      FROM 
        tweets 
        JOIN users ON tweets.user_id = users.user_id 
        LEFT JOIN likes ON tweets.tweet_id = likes.tweet_id
      GROUP BY
        tweets.tweet_id, users.name, users.profile_picture
      ORDER BY 
        RANDOM() 
      LIMIT 5
          `;

        const feed = await client.query(getUserFeedQuery);
        userFeed = feed.rows;
      } else {
        const getPublicFeedQuery = `
          SELECT
            tweets.*, users.name username, users.profile_picture user_profile_pic
          FROM 
            tweets JOIN users ON tweets.user_id = users.user_id 
          ORDER BY 
            RANDOM() 
          LIMIT 5
        `;

        const feed = await client.query(getPublicFeedQuery);
        userFeed = feed.rows;
      }

      await redisClient.set(cacheKey, JSON.stringify(userFeed));
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Error");
  }
  shuffleArray(userFeed);
  res.status(200).send({ isCache: isCache, userFeed: userFeed });
};

const updateTweet = async (req, res) => {
  const { tweetId } = req.params;
  const { userId } = req.user;
  const tweetContent = req.body.tweet_content;
  try {
    const userResult = await client.query(
      `SELECT user_id FROM tweets WHERE tweet_id = $1`,
      [tweetId]
    );
    if (userResult.rowCount === 0 || userResult.rows[0].user_id !== userId) {
      return res
        .status(403)
        .send("Unauthorized: You are not the author of this tweet");
    }
    const updateQuery = `UPDATE tweets SET tweet_content = $1 WHERE tweet_id = $2 RETURNING *`;
    const updateQueryValues = [tweetContent, tweetId];
    const updatedTweet = await client.query(updateQuery, updateQueryValues);
    const tweet = updatedTweet.rows[0];
    res.status(200).json({
      message: "Tweet Updated Successfully",
      tweet: tweet,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const deleteTweet = async (req, res) => {
  const { tweetId } = req.params;
  const { userId } = req.user;
  try {
    const userResult = await client.query(
      `SELECT * FROM tweets WHERE tweet_id = $1`,
      [tweetId]
    );
    if (userResult.rowCount === 0 || userResult.rows[0].user_id !== userId) {
      return res
        .status(403)
        .send("Unauthorized: You are not the author of this tweet");
    }

    await client.query(`DELETE FROM tweets WHERE tweet_id = $1`, [tweetId]);

    const tweetPictureUrl = userResult.rows[0].tweet_picture;
    if (tweetPictureUrl) {
      const fileName = tweetPictureUrl.split("/").pop().split("?")[0];
      const decodedFileName = decodeURIComponent(fileName);
      const bucket = storage.bucket(process.env.TWEET_PICS_BUCKET_NAME);
      const file = bucket.file(decodedFileName);
      await file.delete();
      console.log("file deleted");
    }

    res.status(200).json({
      message: "Tweet Deleted Successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

module.exports = {
  postTweet,
  getLoggedInUserTweets,
  getTweetByTweetId,
  getTweetByUserId,
  getUserFeed,
  updateTweet,
  deleteTweet,
};
