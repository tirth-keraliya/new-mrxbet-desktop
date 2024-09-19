import { useEffect, useState } from "react";
import "./App.css";
import { fetchActiveURL } from "./utils/api";
import Background from "./images/homebg.png";
import RightArrow from "./images/rightarrow.svg";
import { ClipLoader } from "react-spinners";

function App() {
  const [loading, setLoading] = useState(true);
  const [activeURLs, setActiveURLs] = useState([]);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [splashBackgroundImage, setSplashBackgroundImage] =
    useState(Background);
  const [fcmToken, setFcmToken] = useState("");

  const fcm_server_key =
    "AAAARRpU3oE:APA91bHQvhTMwJUBl6KSjNrXeFCYkowkqHIgLQTcAfg6ZZWPFQWf657Bj8Wg1-0SVjVyCvsVRL08ou3JH8Te8IOv2jbYSwLdTtTh1713Jb0co44uUxF7W2sWG5ewPbN7d0x_-ojfa4WV";

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

  const fetchData = async () => {
    try {
      console.log("heyyyyyyy");
      const data = await fetchActiveURL();
      setActiveURLs(data.items);
      const splashImage = data.splashImage;
      console.log(splashImage, "splashImageeeee");
      if (splashImage) {
        setSplashBackgroundImage(`https:${splashImage}`);
      }

      const activeURL = data.items.find((item) => item.isActive);

      if (activeURL && !hasRedirected.current) {
        window.open(activeURL.url, "_blank");
        hasRedirected.current = true;
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <>
      {loading ? (
        <div className="center-wrap">
          <ClipLoader size={35} color={"#123abc"} />
          <p>Hang tight, we're getting things ready for you.</p>
        </div>
      ) : (
        <div
          className="main-wrap"
          style={{
            backgroundImage: `url(${
              splashBackgroundImage ? splashBackgroundImage : Background
            })`,
          }}
        >
          <div className="bottom-wrap">
            <button className="btn-wrap" onClick={fetchData}>
              Click here to visit the casino
              <img src={RightArrow} alt="right-arrow" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
