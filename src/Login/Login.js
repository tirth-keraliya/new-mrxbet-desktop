import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // For navigation
import { AppScreens } from "../AppNavigation/AppScreens";
import {
  getContentfulLocation,
  getContentfulTranslation,
  getPlayerByEmail,
  getPlayerByPlayerID,
} from "../services/UserServices";
import { isValidEmail } from "../utils/helper";
import { getCurrentPlayer, getTranslations } from "../utils/localStorage";
import "./login.css"; // Import the CSS file

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [translations, setTranslations] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const setTranslation =  () => {
      const translationss = getTranslations();
      setTranslations(translationss);
    };
    setTranslation();
  }, []);

  const translationsToDisplay = {
    buttonText: translations?.buttonText || "Login",
    emailPlaceholder: translations?.emailPlaceholder || "Enter your email",
    emailRequired: translations?.emailRequired || "Email is required",
    validEmail: translations?.validEmail || "Please enter a valid email",
    loginTitle: translations?.loginTitle || "Login",
    loginDescription:
      translations?.loginDescription || "Please log in to continue",
    loginError:
      translations?.loginError || "Failed to log in. Please try again.",
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

  return (
    <div className="container">
      <div className="content-container">
        <h1 className="title">{translationsToDisplay.loginTitle}</h1>
        <p className="sub-title">{translationsToDisplay.loginDescription}</p>
        <div className="input-view">
          <input
            type="email"
            placeholder={translationsToDisplay.emailPlaceholder}
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
