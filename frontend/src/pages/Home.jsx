import React, { useState, useEffect } from "react";
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

const Home = ({ currentPosition }) => {
  const sampleLocations = [
    { id: 1, latitude: 6.9271, longitude: 79.8612, name: "Colombo", rating: 4 },
    { id: 2, latitude: 7.2906, longitude: 80.6337, name: "Kandy", rating: 3 },
    { id: 3, latitude: 6.0214, longitude: 80.217, name: "Galle", rating: 5 },
    { id: 4, latitude: 8.4894, longitude: 80.4085, name: "Jaffna", rating: 4 },
  ];

  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [rating, setRating] = useState(0);
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Replace with your actual API call
        // const response = await fetch("/api/locations");
        // const data = await response.json();
        setLocations(sampleLocations);
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

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
      console.log("Recommended venues:", data);
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
