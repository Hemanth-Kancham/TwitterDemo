const client = require("../connectDb");

const likeTweet = async (req, res) => {
  const { userId } = req.user;
  const { tweetId } = req.params;

  const checkTweetExistsQuery = `
    SELECT COUNT(*) as tweet_count FROM tweets
    WHERE tweet_id = ${tweetId}
  `;

  try {
    const tweetExistsResult = await client.query(checkTweetExistsQuery);
    const tweetExists = tweetExistsResult.rows[0].tweet_count > 0;

    if (!tweetExists) {
      res.status(404).json({ message: "Tweet not found." });
      return;
    }

    const checkLikeQuery = `
    SELECT * FROM likes
    WHERE tweet_id = $1 AND user_id = $2
    `;
    const checkLikeValues = [tweetId, userId];

    const existingLike = await client.query(checkLikeQuery, checkLikeValues);

    if (existingLike.rows.length > 0) {
      res.status(400).json({ message: "You've already liked this tweet." });
    } else {
      const likeTweetQuery = `
        INSERT INTO 
            likes (tweet_id,user_id,created_at)
        VALUES 
            ($1,$2,CURRENT_TIMESTAMP) RETURNING *
        `;
      const values = [tweetId, userId];

      const likeDetails = await client.query(likeTweetQuery, values);
      res.send;
      res.status(200).json({
        message: "Liked this Tweet Successfully",
        Like: likeDetails.rows[0],
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const unlikeTweet = async (req, res) => {
  const { userId } = req.user;
  const { tweetId } = req.params;

  const unlikeTweetQuery = `
    DELETE FROM likes WHERE tweet_id = $1 AND user_id = $2 RETURNING *
    `;
  const values = [tweetId, userId];
  try {
    const unlikeDetails = await client.query(unlikeTweetQuery, values);

    if (unlikeDetails.rowCount === 0) {
      res.status(400).json({ message: "You haven't liked this tweet." });
    } else {
      res.status(200).json({
        message: "Unlike a Tweet Successfully",
        like: unlikeDetails.rows[0],
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const getLikesForTweet = async (req, res) => {
  const { tweetId } = req.params;
  try {
    const getLikes = await client.query(
      `SELECT * FROM likes WHERE tweet_id = ${tweetId}`
    );
    res.status(200).send(getLikes.rows);
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const getLikeCountForTweet = async (req, res) => {
  const { tweetId } = req.params;

  const getLikeCountQuery = `
      SELECT COUNT(*) as like_count FROM likes
      WHERE tweet_id = ${tweetId}
    `;

  try {
    const result = await client.query(getLikeCountQuery);
    const likeCount = result.rows[0].like_count;
    res.status(200).json({ like_count: likeCount });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  likeTweet,
  unlikeTweet,
  getLikesForTweet,
  getLikeCountForTweet,
};
