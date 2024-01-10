import { FaRegHeart } from "react-icons/fa6";

import "./index.css";

const UserTweet = ({ tweetDetails, likeTweet }) => {
  const {
    tweet_id,
    username,
    user_profile_pic,
    tweet_picture,
    tweet_content,
    created_at,
    likes_count,
  } = tweetDetails;

  const postALike = () => {
    likeTweet(tweet_id);
  };

  const createdAt = created_at.split("T")[0];
  return (
    <li className="tweet-list-item">
      <div className="user-profile-pic-container">
        <img className="user-profile-pic" src={user_profile_pic} alt="" />
      </div>
      <div className="tweet-container">
        <div className="tweet-username-time-container">
          <h1 className="tweet-username">{username}</h1>
          <p className="tweet-time">{createdAt}</p>
        </div>
        <p className="tweet-content">{tweet_content}</p>
        {tweet_picture && (
          <img className="tweet-picture" src={tweet_picture} alt="" />
        )}
        <div className="tweet-bottom-container">
          <FaRegHeart className="like-icon" size={"24px"} onClick={postALike} />
          {likes_count ? (
            <span style={{ marginLeft: "10px" }}>{likes_count}</span>
          ) : (
            ""
          )}
        </div>
      </div>
    </li>
  );
};

export default UserTweet;
