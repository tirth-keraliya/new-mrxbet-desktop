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
  const [accessToken, setAccessToken] = useState(""); // New state for OAuth 2.0 token

  // https://fcm.googleapis.com/v1/projects/mrxbetdesktop:subscribeToTopic
  function subscribeTokenToTopic(token, topic, bearerToken) {
    fetch(
      "https://iid.googleapis.com/iid/v1/" + token + "/rel/topics/" + topic,
      {
        method: "POST",
        headers: new Headers({
          Authorization: "Bearer " + bearerToken,
          "Content-Type": "application/json; UTF-8",
          access_token_auth: true,
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

  // function subscribeTokenToTopic(token, topic) {
  //   fetch(
  //     "https://iid.googleapis.com/iid/v1/" + token + "/rel/topics/" + topic,
  //     {
  //       method: "POST",
  //       headers: new Headers({
  //         Authorization: "key=" + fcm_server_key,
  //       }),
  //     }
  //   )
  //     .then((response) => {
  //       if (response.status < 200 || response.status >= 400) {
  //         throw (
  //           "Error subscribing to topic: " +
  //           response.status +
  //           " - " +
  //           response.text()
  //         );
  //       }
  //       console.log('Subscribed to "' + topic + '"');
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //     });
  // }

  useEffect(() => {
    window.electron?.getFCMToken("getFCMToken", (_, token) => {
      console.log("yesyyeyeyeyeyeyyeye", token);
      setFcmToken(token);
    });

    // Fetch the OAuth 2.0 access token from the backend (main.js)
    window.electron?.getOAuthToken((token) => {
      setAccessToken(token);
    });
  }, []);

  console.log("fcmToken", fcmToken);
  console.log("accessToken", accessToken);

  useEffect(() => {
    if (accessToken && fcmToken) {
      // Subscribe to topic after both token and OAuth access token are available
      // subscribeTokenToTopic(fcmToken, "Users", accessToken);
    }
  }, [fcmToken, accessToken]);

  return (
    <>
      <AppNavigator />
    </>
  );
}

export default App;
