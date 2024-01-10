import { Component } from "react";
import UserTweet from "../UserTweet";
import "./index.css";

class UserFeed extends Component {
  state = { userFeedData: null };

  componentDidMount() {
    this.fetchData();
  }

  fetchData = async () => {
    const url = "http://localhost:4000/user/feed";
    const options = {
      method: "GET",
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJBckUyNm1vSkVoUzBuVnRHZmdkNHFMbFUweXEyIiwibmFtZSI6IkhFTUFOVEggS0FOQ0hBTSIsImVtYWlsIjoiaGVtYW50aGthbmNoYW0xMjNAZ21haWwuY29tIiwiaWF0IjoxNzA0Nzc2NDA4LCJleHAiOjE3MDQ4NjI4MDh9.c7e82qAttml8cWrsCz_5BV6qmi_VqnOiTPR2yWD2xTg",
      },
    };
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        const data = await response.json();
        this.setState({ userFeedData: data });
      } else {
        console.error("Failed to fetch user feed");
      }
    } catch (error) {
      console.error("Error fetching user feed:", error);
    }
  };

  likeTweet = async (tweetId) => {
    let url = `http://localhost:4000/tweets/${tweetId}/like`;
    const options = {
      method: "POST",
      headers: {
        Authorization:
          "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJBckUyNm1vSkVoUzBuVnRHZmdkNHFMbFUweXEyIiwibmFtZSI6IkhFTUFOVEggS0FOQ0hBTSIsImVtYWlsIjoiaGVtYW50aGthbmNoYW0xMjNAZ21haWwuY29tIiwiaWF0IjoxNzA0Nzc2NDA4LCJleHAiOjE3MDQ4NjI4MDh9.c7e82qAttml8cWrsCz_5BV6qmi_VqnOiTPR2yWD2xTg",
      },
    };
    await fetch(url, options);
    this.fetchData();
  };

  render() {
    const { userFeedData } = this.state;
    let userFeed = null;
    if (userFeedData) {
      userFeed = userFeedData.userFeed;
    }

    return (
      <div className="user-feed-page-container">
        <div className="user-feed-page">
          <h1 className="user-feed-heading">Tweets</h1>
          {userFeed && (
            <ul className="tweets-list">
              {userFeed.map((tweetDetails) => (
                <UserTweet
                  key={tweetDetails.tweet_id}
                  likeTweet={this.likeTweet}
                  tweetDetails={tweetDetails}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
}

export default UserFeed;
