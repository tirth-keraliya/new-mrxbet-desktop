import React, { useState, useCallback, useEffect } from "react";
import {
  getContentfulLocation,
  getContentfulTranslation,
  getPlayerByEmail,
  getPlayerByPlayerID,
} from "../services/UserServices";
import { isValidEmail } from "../utils/helper";
import { useNavigate } from "react-router-dom"; // For navigation
import "./login.css"; // Import the CSS file
import { AppScreens } from "../AppNavigation/AppScreens";
import { getCurrentPlayer } from "../utils/localStorage";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
        const locale = await window.electronAPI.getLocale();
        console.log(locale, "localll-localll");
        fetchTranslations(locale); // Fetch translations with the locale
      } catch (error) {
        console.error("Failed to fetch locale:", error);
      }
    };
    fetchLocale();
  }, []);

  const fetchTranslations = async (locale) => {
    try {
      const data = await getContentfulTranslation(locale);
      console.log(data, "Fetched Translations Data");
      setTranslations(data[0] || {}); // Set translations or an empty object if none
    } catch (error) {
      console.error("Failed to load translations:", error);
    }
  };
  const translationsToDisplay = {
    buttonText: translations?.buttonText,
    emailPlaceholder: translations?.emailPlaceholder,
    emailRequired: translations?.emailRequired,
    validEmail: translations?.validEmail,
    loginTitle: translations?.loginTitle,
    loginDescription: translations?.loginDescription,
    loginError: translations?.loginError,
  };

  const checkUserLogin = useCallback(
    async (fetchedPlayerId) => {
      setLoading(true);

      let screen = AppScreens.LoginScreen;
      let playerId = await getCurrentPlayer();

      if (!playerId && fetchedPlayerId) {
        const response = await getPlayerByPlayerID(fetchedPlayerId);
        if (response) {
          screen = AppScreens.HomeScreen;
        }
      } else if (playerId) {
        screen = AppScreens.HomeScreen;
      }
      setLoading(false);

      navigate(screen, { replace: true });
    },
    [navigate]
  );

  useEffect(() => {
    const handleDeepLink = (deepLink) => {
      if (deepLink.includes("playerid")) {
        const queryString = deepLink.split("?")[1];
        const params = new URLSearchParams(queryString);
        const fetchedPlayerId = params.get("playerid");

        checkUserLogin(fetchedPlayerId); // Validate and navigate
      } else {
        checkUserLogin(null); // Fallback to default login screen
      }
    };

    // Listen for deep link events from Electron
    window?.electronAPI?.onDeepLink(handleDeepLink);
  }, [checkUserLogin]);

  const onPressLogin = useCallback(async () => {
    setError("");
    if (email.trim().length === 0) {
      setError(translationsToDisplay.emailRequired);
      return;
    }
    if (!isValidEmail(email)) {
      setError(translationsToDisplay.validEmail);
      return;
    }

    setLoading(true);
    try {
      const response = await getPlayerByEmail(email);
      if (response.error) {
        throw new Error(response.error); // Assuming the API returns an error object
      }
      navigate("/home"); // Navigate on successful login
    } catch (error) {
      setError(error.message || translationsToDisplay.loginError); // Use specific error messages
    } finally {
      setLoading(false);
    }
  }, [email, navigate]);

  //   const changeIcon = (iconName) => {
  //     // Send the icon change request to Electron via the ipcRenderer
  //     window.electronAPI.changeIcon(iconName);
  //   };

  return (
    <div className="container">
      <div className="content-container">
        <h1 className="title">{translationsToDisplay.loginTitle}</h1>
        <p className="sub-title">{translationsToDisplay.loginDescription}</p>
        <div className="input-view">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
        {error && <p className="error-text">{error}</p>}
        <div className="button-view">
          <button className="button" onClick={onPressLogin} disabled={loading}>
            {loading ? (
              <div className="loader"></div>
            ) : (
              <span className="button-text">
                {translationsToDisplay.buttonText}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
