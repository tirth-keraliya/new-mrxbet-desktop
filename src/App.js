import { useEffect, useState } from "react";
import "./App.css";
import { fetchActiveURL } from "./utils/api";
import Background from "./images/homebg.png";
import RightArrow from "./images/rightarrow.svg";
import { ClipLoader } from "react-spinners";
import AppNavigator from "./AppNavigation/AppNavigator"; // Import AppNavigator

function App() {
  const [loading, setLoading] = useState(true);
  const [activeURLs, setActiveURLs] = useState([]);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [splashBackgroundImage, setSplashBackgroundImage] =
    useState(Background);
  const [fcmToken, setFcmToken] = useState("");

  const fcm_server_key =
    "AAAAwIHSyzk:APA91bH03vYWfNP78ZLB2NCPkw5lrPF9791k-uQFxYrfqjMqDkmq1yLuUzaXfJBAo0AtmFJEtLbMCwrsDmNoQGZORMrRebUG2ePwFJ8acwFTtW-vjlxyj7FxbcqtxO7oSpmzBoWVK7Lf";

  function subscribeTokenToTopic(token, topic) {
    fetch(
      "https://iid.googleapis.com/iid/v1/" + token + "/rel/topics/" + topic,
      {
        method: "POST",
        headers: new Headers({
          Authorization: "key=" + fcm_server_key,
        }),
      }
    )
      .then((response) => {
        if (response.status < 200 || response.status >= 400) {
          throw (
            "Error subscribing to topic: " +
            response.status +
            " - " +
            response.text()
          );
        }
        console.log('Subscribed to "' + topic + '"');
      })
      .catch((error) => {
        console.error(error);
      });
  }

  useEffect(() => {
    window.electron?.getFCMToken("getFCMToken", (_, token) => {
      setFcmToken(token);
      subscribeTokenToTopic(token, "Users");
    });
  }, []);

  // Conditional rendering based on loading state
  return (
    <>
      {!loading ? (
        <div className="center-wrap">
          <ClipLoader size={35} color={"#123abc"} />
          <p>Hang tight, we're getting things ready for you.</p>
        </div>
      ) : (
        <AppNavigator /> // Render the AppNavigator for routing
      )}
    </>
  );
}

export default App;
