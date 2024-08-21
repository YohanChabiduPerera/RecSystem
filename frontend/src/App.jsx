import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import SignUp from "../src/auth/SignUp";
import SignIn from "../src/auth/SignIn";
import Home from "./pages/Home";
import NavBar from "./components/NavBar";
import PrivateRoute from "./components/PrivateRoute";
// import { VenueHistoryProvider } from "./context/VenueHistoryContext";

function App() {
  const [currentPosition, setCurrentPosition] = useState(null);

  useEffect(() => {
    // Get the user's current position
    const getCurrentPosition = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting current position:", error);
        }
      );
    };
    getCurrentPosition();
  }, []);

  return (
    // <VenueHistoryProvider>
      <Router>
        <NavBar />
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Home currentPosition={currentPosition} />
              </PrivateRoute>
            }
          />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </Router>
    // </VenueHistoryProvider>
  );
}

export default App;
