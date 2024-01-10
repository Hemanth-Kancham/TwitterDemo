const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const client = require("../connectDb");
const { storage, admin } = require("../config/firbaseConfig");
const jwt = require("jsonwebtoken");
const env = require("dotenv");

env.config();

const signInUser = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  try {
    const user = await admin.auth().verifyIdToken(token);
    if (user) {
      const userId = user.uid;
      const name = user.name;
      const emailId = user.email;
      const picture = user.picture || null;

      const existingUser = await client.query(
        "SELECT * FROM users WHERE user_id = $1",
        [userId]
      );

      if (existingUser.rows.length === 0) {
        const pictureFileName = `user_${userId}_picture.jpg`;
        const pictureUrl = await uploadPictureToGcp(pictureFileName, picture);

        await client.query(
          `INSERT INTO users (user_id, name, email,profile_picture, created_at, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
        ;`,
          [userId, name, emailId, pictureUrl || null]
        );
      }

      const payload = {
        userId: userId,
        name: name,
        email: emailId,
      };
      const secretKey = process.env.JWT_TOKEN_SECRET_KEY;
      const jwtToken = jwt.sign(payload, secretKey, { expiresIn: "1 day" });

      res.status(200).send({ jwtToken });
    } else {
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    console.error(error);
    res.status(401).send("Unauthorized");
  }
};

const getUserInfo = async (req, res) => {
  const { userId } = req.user;
  const users = await client.query(
    `SELECT * FROM users WHERE user_id = '${userId}'`
  );
  res.send(users.rows[0]);
};

const updateProfilePicture = async (req, res) => {
  const { userId } = req.user;
  const pictureFile = req.file;

  if (!pictureFile) {
    res.status(400).send("No profile picture provided");
  }

  const pictureFileName = `user_${userId}_picture.jpg`;
  const bucket = storage.bucket(process.env.PROFILE_PICS_BUCKET_NAME);
  const file = bucket.file(pictureFileName);
  try {
    await file.save(pictureFile.buffer);
    const [gcsPictureUrl] = await file.getSignedUrl({
      action: "read",
      expires: "2030-01-01",
    });

    await client.query(
      `UPDATE users SET profile_picture = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
      [gcsPictureUrl, userId]
    );

    res.status(200).send("Profile Picture Updated Successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

const deleteUser = async (req, res) => {
  const { userId } = req.user;
  const currentUser = await client.query(
    `SELECT * FROM users WHERE user_id = '${userId}'`
  );

  const profilePicUrl = currentUser.rows[0].profile_picture;

  const profilePicName = profilePicUrl.split("/").pop().split("?")[0];

  const bucket = storage.bucket(process.env.PROFILE_PICS_BUCKET_NAME);
  const file = bucket.file(profilePicName);

  try {
    await file.delete();
    console.log(`Profile picture deleted from GCP`);
  } catch (error) {
    console.error(`Error deleting profile picture from GCP:`, error);
  }
  await client.query(
    `DELETE FROM users WHERE user_id = '${userId}' returning *`
  );
  res
    .status(200)
    .json({ message: "User Deleted", deletedUser: currentUser.rows[0] });
};

const uploadPictureToGcp = async (fileName, pictureUrl) => {
  const bucket = storage.bucket(process.env.PROFILE_PICS_BUCKET_NAME);

  const file = bucket.file(fileName);
  const response = await fetch(pictureUrl);
  const pictureBuffer = await response.buffer();
  await file.save(pictureBuffer);

  const [gcsPictureUrl] = await file.getSignedUrl({
    action: "read",
    expires: "2030-01-01",
  });

  return gcsPictureUrl;
};

module.exports = { signInUser, getUserInfo, updateProfilePicture, deleteUser };
