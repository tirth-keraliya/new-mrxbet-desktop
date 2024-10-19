import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppScreens } from "../AppNavigation/AppScreens";
import {
  getContentfulActiveURLS,
  getContentfulLocation,
  getPlayerByEmail,
  getPlayerByPlayerID,
} from "../services/UserServices";
import { getCurrentPlayer } from "../utils/localStorage";
import "./HomeScreen.css"; // Import the CSS file

const HomeScreen = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState();
  const [translations, setTranslations] = useState({});
  const [countryCodes, setCountryCodes] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCountryCodes = async () => {
      try {
        const data = await getContentfulLocation();
        if (data.length > 0) {
          setCountryCodes(data);
        }
      } catch (error) {
        console.error("Failed to load country code:", error);
      }
    };
    fetchCountryCodes();
  }, []);

  useEffect(() => {
    const fetchLocale = async () => {
      try {
        let locale = await window.electronAPI.getLocale();
        console.log(locale, "Fetched Locale");

        // Attempt to load translations for the given locale
        const translationsLoaded = await fetchTranslations(locale);

        // If translations aren't found, fallback to 'en-US'
        if (!translationsLoaded) {
          console.warn(
            `Locale "${locale}" not found. Falling back to 'en-US'.`
          );
          await fetchTranslations("en-US");
        }
        // Load the data for the determined locale
        loadData(locale); // Call loadData with the fetched locale
      } catch (error) {
        console.error("Failed to fetch locale:", error);
        // On error, fallback to 'en-US'
        await fetchTranslations("en-US");
        loadData("en-US"); // Call loadData with 'en-US'
      }
    };
    fetchLocale();
  }, []);

  const fetchTranslations = async (locale) => {
    try {
      const data = await getContentfulActiveURLS(locale);
      console.log(data, "Fetched translations for locale:", locale);
      if (data && data.length > 0) {
        setTranslations(data[0]); // Set the fetched translations
        return true; // Indicate that translations were successfully loaded
      }
      return false; // Indicate that translations were not found
    } catch (error) {
      console.error("Failed to load translations:", error);
      return false;
    }
  };

  const loadData = useCallback(
    async (locale) => {
      try {
        setLoading(true);
        const player = await getCurrentPlayer();
        setCurrentPlayer(player);
        if (player?.email) {
          await getPlayerByEmail(player?.email);
        } else if (player?.playerID) {
          await getPlayerByPlayerID(player?.playerID);
        } else if (!player) {
          let screen = AppScreens.LoginScreen;
          navigate(screen, { replace: true });
        }

        // Fetch contentful active URLs for the provided locale
        const response = await getContentfulActiveURLS(locale);
        console.log(response, "response-data");

        setLoading(false);
        if (response && response.length > 0) {
          console.log(response, "response-data");
          setData(response);
        } else {
          // Fallback to 'en-US' if no data for the provided locale
          const fallbackResponse = await getContentfulActiveURLS("en-US");
          if (fallbackResponse && fallbackResponse.length > 0) {
            setData(fallbackResponse);
          }
        }
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    },
    [navigate]
  );

  return (
    <div className="container">
      <div className="listWrap">
        {loading && (
          <div className="loading">
            <p>Loading...</p>
          </div>
        )}
        {!loading && data.length > 0 && (
          <ul className="flatListStyles">
            {data.map((item, index) => (
              <li key={index} className="item">
                <button
                  onClick={() => {
                    window.open(currentPlayer?.url || "", "_blank"); // Open in a new tab
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  <div className="imgWrapper">
                    <img
                      src={item?.image}
                      className="imgWrap"
                      alt={item?.title}
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
