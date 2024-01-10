import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

import "./index.css";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const handleGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userData = await signInWithPopup(auth, provider);
      const idToken = await userData.user.getIdToken();
      console.log(idToken);
    } catch (error) {
      console.log(error);
    }
  };

  const getUserFeed = async () => {
    navigate("/user-feed");
  };

  return (
    <div className="bg-container">
      <button className="button" onClick={handleGoogle}>
        Sign in With Google
      </button>
      <button className="button" onClick={getUserFeed}>
        User Feed
      </button>
    </div>
  );
};

export default Home;
