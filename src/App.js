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
    "AAAAf1JvBWQ:APA91bH2X1qgtuYr_jb4eRqRAMOPjpp-j-jKgeEaQyByYkjs7T_-6uXTbc8cS4JbYE2PIZHMnIbb9CyCxSStn1wqyGww_7RX0S0tXQBmnQJqgxGJUKBHjSc3UdmYdj6UKjInqBpXL4tb";

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
      <AppNavigator />
    </>
  );
}

export default App;
