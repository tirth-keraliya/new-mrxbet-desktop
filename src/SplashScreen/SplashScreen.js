import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppScreens } from "../AppNavigation/AppScreens";
import { getCurrentPlayer } from "../utils/localStorage";
import { getPlayerByPlayerID } from "../services/UserServices";
import "./SplashScreen.css";

const SplashScreen = () => {
  const navigate = useNavigate();

  const checkUserLogin = useCallback(
    async (fetchedPlayerId) => {
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

        checkUserLogin(fetchedPlayerId);
      } else {
        checkUserLogin(null);
      }
    };

    // Listen for deep link events from Electron
    window.electronAPI.onDeepLink(handleDeepLink);
  }, [checkUserLogin]);

  return (
    <div className="splash-background">
      <div className="splash-container"></div>
    </div>
  );
};

export default SplashScreen;
