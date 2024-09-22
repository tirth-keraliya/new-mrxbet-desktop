import React, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppScreens } from "../AppNavigation/AppScreens";
import { getCurrentPlayer } from "../utils/localStorage";
import { getPlayerByPlayerID } from "../services/UserServices";
import "./SplashScreen.css";

const SplashScreen = () => {
  const navigate = useNavigate();

  const checkUserLogin = useCallback(async () => {
    let screen = AppScreens.LoginScreen;
    let PlayerId = await getCurrentPlayer(); // Use web storage logic
    if (!PlayerId) {
      const urlParams = new URLSearchParams(window.location.search);
      const playerId = urlParams.get("playerId");
      if (playerId) {
        const response = await getPlayerByPlayerID(playerId);
        if (response) {
          screen = AppScreens.HomeScreen;
        }
        navigate(screen, { replace: true });
      } else {
        navigate(screen, { replace: true });
      }
    } else {
      screen = AppScreens.HomeScreen;
      navigate(screen, { replace: true });
    }
  }, [navigate]);

  const loadData = useCallback(() => {
    let isDeepLink = false;
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get("playerId");

    if (playerId) {
      isDeepLink = true;
      checkUserLogin();
    }

    setTimeout(() => {
      if (!isDeepLink) {
        checkUserLogin();
      }
    }, 600);
  }, [checkUserLogin]);

  useEffect(() => {
    loadData();

    // Listen for deep link events from Electron
    window.electronAPI.onDeepLink((deepLink) => {
      const url = new URL(deepLink);
      const playerId = url.searchParams.get("playerId");
      console.log(playerId, "playerrrriD");

      if (playerId) {
        navigate(`/home?playerId=${playerId}`, { replace: true });
      }
    });
  }, [loadData, navigate]);

  return (
    <div className="splash-background">
      <div className="splash-container"></div>
    </div>
  );
};

export default SplashScreen;
