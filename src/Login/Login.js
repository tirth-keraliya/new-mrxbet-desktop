import React, { useState, useCallback, useEffect } from "react";
import {
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
  const navigate = useNavigate();

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
    window.electronAPI.onDeepLink(handleDeepLink);
  }, [checkUserLogin]);

  const onPressLogin = useCallback(async () => {
    setError("");
    if (email.trim().length === 0) {
      setError("Email is required");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const response = await getPlayerByEmail(email);
      navigate("/home"); // Replace with your route
    } catch (error) {
      setError(error.message); // Set the error message from the thrown error
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
        <h1 className="title">Connect with MrxBet</h1>
        <p className="sub-title">
          Enter your email associated with Mrxbet to get exclusive real-time
          updates and promotions just for you!
        </p>
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
              <span className="button-text">Connect</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
