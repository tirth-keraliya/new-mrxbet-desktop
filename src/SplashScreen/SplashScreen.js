import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppScreens } from "../AppNavigation/AppScreens";
import { getCurrentPlayer, setTranslations } from "../utils/localStorage";
import {
  getContentfulTranslation,
  getPlayerByPlayerID,
} from "../services/UserServices";
import "./SplashScreen.css";

const SplashScreen = () => {
  const navigate = useNavigate();

  // useEffect(() => {
  //   const getData = async () => {
  //     const language = (await window.electronAPI.getLocale()) || "en-US";
  //     console.log("language--language--main", language);
  //     const data = await getContentfulTranslation(language);
  //     setTranslations(data);
  //   };
  //   getData();
  // }, []);

  const checkUserLogin = async (fetchedPlayerId) => {
    const language = (await window.electronAPI.getLocale()) || "en-US";
    console.log("language--language--main", language);
    const data = await getContentfulTranslation(language);
    setTranslations(data);

    let playerId = await getCurrentPlayer();
    if (playerId) {
      navigate(AppScreens.HomeScreen, { replace: true });
      return;
    }

    // If no player ID, check if a fetched player ID was provided
    if (fetchedPlayerId) {
      const response = await getPlayerByPlayerID(fetchedPlayerId);
      if (response) {
        navigate(AppScreens.HomeScreen, { replace: true });
      } else {
        navigate(AppScreens.LoginScreen, { replace: true });
      }
    } else {
      navigate(AppScreens.LoginScreen, { replace: true });
    }
  };

  useEffect(() => {
    const handleDeepLink = (deepLink) => {
      if (deepLink.includes("playerid")) {
        const queryString = deepLink.split("?")[1];
        const params = new URLSearchParams(queryString);
        const fetchedPlayerId = params.get("playerid");
        checkUserLogin(fetchedPlayerId); // Checking and navigating to the appropriate screen
      }
    };

    // Listen for deep link events from Electron
    window?.electronAPI?.onDeepLink(handleDeepLink);

    // Call checkUserLogin immediately on mount to check for an existing player
    checkUserLogin(null);
  }, [navigate]);

  return (
    <div className="splash-background">
      <div className="splash-container"></div>
    </div>
  );
};

export default SplashScreen;
