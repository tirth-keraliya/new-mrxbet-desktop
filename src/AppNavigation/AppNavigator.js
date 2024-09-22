import React from "react";
import {
  HashRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import LoginScreen from "../Login/Login";
import HomeScreen from "../Home/Home";
import SplashScreen from "../SplashScreen/SplashScreen";
import { AppScreens } from "./AppScreens"; // Assuming this contains route paths

const AppNavigator = () => {
  return (
    <Router>
      <Routes>
        {/* Redirect to SplashScreen initially */}
        <Route path="/" element={<Navigate to={AppScreens.SplashScreen} />} />

        {/* Splash Screen Route */}
        <Route path={AppScreens.SplashScreen} element={<SplashScreen />} />

        {/* Login Screen Route */}
        <Route path={AppScreens.LoginScreen} element={<LoginScreen />} />

        {/* Home Screen Route */}
        <Route path={AppScreens.HomeScreen} element={<HomeScreen />} />
      </Routes>
    </Router>
  );
};

export default AppNavigator;
