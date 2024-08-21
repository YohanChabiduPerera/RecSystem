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

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    setRating(location.rating);
  };

  const handleRateLocation = async () => {
    try {
      // Send the rating to the backend API
      // await fetch(`/api/locations/${selectedLocation.id}/rate`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ rating }),
      // });
      console.log(
        "Rated location:",
        selectedLocation.name,
        "with rating:",
        rating
      );
    } catch (error) {
      console.error("Error rating location:", error);
    }
  };

  const handleRecommendNearbyVenues = async () => {
    const userId = localStorage.getItem("user_id");
  
    if (!userId) {
      console.error("User ID not found in local storage");
      return;
    }
  
    try {
      const response = await fetch(
        "http://127.0.0.1:5000/recommend_nearby_venues",
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
  
      if (data.recommended_venues.length === 0) {
        console.log("No venues found.");
        setLocations([]);
        return;
      }
  
      // Set only the first venue from the received data
      const venue = data.recommended_venues[0];
      const newLocation = {
        id: 1, // You can use a fixed ID or modify as needed
        latitude: venue.coordinates.latitude,
        longitude: venue.coordinates.longitude,
        name: venue.location.split(",")[0], // Extract text before the first comma
        rating: 0, // Default rating
      };
  
      setLocations([newLocation]);
      setCurrentPosition({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });
  
      console.log("Recommended venue:", newLocation);
    } catch (error) {
      console.error("Error recommending nearby venues:", error);
    }
  };
  

  return (
    <Grid container spacing={4}>
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
