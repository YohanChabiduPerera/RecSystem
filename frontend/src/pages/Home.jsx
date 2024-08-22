import React, { useState } from "react";
import {
  Grid,
  Box,
  Typography,
  Rating,
  Button,
  TextField,
  Divider,
} from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MapComponent from "../components/MapComponent";

const Home = () => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [rating, setRating] = useState(0);
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");
  const [currentPosition, setCurrentPosition] = useState({
    latitude: 0,
    longitude: 0,
  });

  // handle location click
  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    setRating(location.rating);
  };

  // rate location
  const handleRateLocation = async () => {
    const userId = localStorage.getItem("user_id");

    if (!userId || !selectedLocation) {
      toast.error("User ID or selected location is missing");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/submit_rating", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          venue_id: selectedLocation.venue_id,
          user_longitude: selectedLocation.longitude,
          user_latitude: selectedLocation.latitude,
          rating: rating,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      toast.success("Rating submitted successfully");
      console.log("Rating submitted successfully:", data);
    } catch (error) {
      toast.error("Error submitting rating");
      console.error("Error submitting rating:", error);
    }
  };

  // handle near by venue
  const handleRecommendNearbyVenues = async () => {
    const userId = localStorage.getItem("user_id");
  
    if (!userId) {
      toast.error("User ID not found in local storage");
      return;
    }
  
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/recommend_destination",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_longitude: parseFloat(longitude),
            user_latitude: parseFloat(latitude),
            user_id: userId,
          }),
        }
      );
  
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
  
      const data = await response.json();
  
      if (!data || !data.coordinates || !data.location || !data.venue_id) {
        toast.info("No venues found.");
        setLocations([]);
        return;
      }
      // re structure format
      const newLocation = {
        id: 1,
        latitude: data.coordinates.latitude,
        longitude: data.coordinates.longitude,
        name: data.location.split(",")[0],
        venue_id: data.venue_id,
        rating: 0,
      };
  
      setLocations([newLocation]);
      setCurrentPosition({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });
  
      toast.success("Recommended venue fetched successfully");
      console.log("Recommended venue:", newLocation);
    } catch (error) {
      toast.error("Error recommending nearby venues");
      console.error("Error recommending nearby venues:", error);
    }
  };
  
  return (
    <Grid container spacing={4}>
      <ToastContainer />
      <Grid item xs={9}>
        <MapComponent
          locations={locations}
          currentPosition={currentPosition}
          onLocationClick={handleLocationClick}
        />
      </Grid>
      <Grid item xs={3}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            padding: 2,
            boxSizing: "border-box",
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 2,
            }}
          >
            <TextField
              label="Longitude"
              variant="outlined"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              sx={{ marginBottom: 2, width: "80%" }}
            />
            <TextField
              label="Latitude"
              variant="outlined"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              sx={{ marginBottom: 2, width: "80%" }}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleRecommendNearbyVenues}
            >
              Recommend Nearby Venues
            </Button>
          </Box>
          <Divider sx={{ margin: "16px 0" }} />
          {selectedLocation && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Typography variant="h5" sx={{ marginBottom: 2 }}>
                {selectedLocation.name}
              </Typography>
              <Rating
                name="location-rating"
                value={rating}
                onChange={(event, newValue) => setRating(newValue)}
                size="large"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleRateLocation}
                sx={{ marginTop: 2 }}
              >
                Rate Location
              </Button>
            </Box>
          )}
          {!selectedLocation && (
            <Typography variant="h6" sx={{ marginTop: 2 }}>
              Click on a marker to see details
            </Typography>
          )}
        </Box>
      </Grid>
    </Grid>
  );
};

export default Home;
