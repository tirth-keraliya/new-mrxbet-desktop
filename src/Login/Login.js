import React, { useState, useCallback } from "react";
import { getPlayerByEmail } from "../services/UserServices";
import { isValidEmail } from "../utils/helper";
import { useNavigate } from "react-router-dom"; // For navigation
import "./login.css"; // Import the CSS file

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // React Router for navigation

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
