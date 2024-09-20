import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-dom/client"; // Use React Router for navigation
import "./HomeScreen.css"; // Import the CSS file
import {
  getContentfulActiveURLS,
  getPlayerByEmail,
  getPlayerByPlayerID,
} from "../services/UserServices";
import { getCurrentPlayer } from "../utils/localStorage";

const HomeScreen = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const player = await getCurrentPlayer();
      setCurrentPlayer(player);
      if (player?.email) {
        await getPlayerByEmail(player?.email);
      } else {
        await getPlayerByPlayerID(player?.playerID);
      }
      const response = await getContentfulActiveURLS();
      setLoading(false);
      if (response) {
        setData(response);
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="container">
      <div className="listWrap">
        {loading && (
          <div className="loading">
            <p>Loading...</p> {/* Simple loading text */}
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
