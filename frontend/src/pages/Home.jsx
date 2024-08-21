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

  // handle location click
  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    setRating(location.rating);
  };

  // rate location
  const handleRateLocation = async () => {
    const userId = localStorage.getItem("user_id");

    if (!userId || !selectedLocation) {
      console.error("User ID or selected location is missing");
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
      console.log("Rating submitted successfully:", data);
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  // handle near by venue
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

      // re structure json format
      const venue = data.recommended_venues[0];
      const newLocation = {
        id: 1,
        latitude: venue.coordinates.latitude,
        longitude: venue.coordinates.longitude,
        name: venue.location.split(",")[0],
        venue_id: venue.venue_id,
        rating: 0,
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

    // handle next destination
  const handleNextDestination = async () => {
    const userId = localStorage.getItem("user_id");

    if (!userId) {
      console.error("User ID not found in local storage");
      return;
    }

    try {
      // get the venue history 
      const userResponse = await fetch(
        `http://127.0.0.1:5000/getUserById/${userId}`
      );
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user data");
      }
      const userData = await userResponse.json();
      const { venue_history } = userData;

      const nextVenueResponse = await fetch(
        "http://127.0.0.1:5000/predict_next_venue",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            venue_history: venue_history,
          }),
        }
      );

      if (!nextVenueResponse.ok) {
        throw new Error("Failed to predict next venue");
      }

      const nextVenueData = await nextVenueResponse.json();
      const { coordinates, exact_location, predicted_venue_id } = nextVenueData;

      // re structure json format
      const newLocation = {
        id: locations.length + 1,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        name: exact_location.split(",")[0],
        venue_id: predicted_venue_id,
        rating: 0,
      };

      setSelectedLocation(null);
      setLocations([newLocation]);

      console.log("Next Destination:", newLocation);
    } catch (error) {
      console.error("Error predicting next destination:", error);
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
            <Button
              variant="contained"
              color="primary"
              onClick={handleNextDestination}
              sx={{ marginTop: 2 }}
            >
              Next Destination
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
