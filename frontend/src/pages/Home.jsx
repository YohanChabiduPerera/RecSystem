import React, { useState, useEffect } from "react";
import { Grid, Box, Typography, Rating, Button } from "@mui/material";
import MapComponent from "../components/MapComponent";

const Home = ({ currentPosition }) => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [rating, setRating] = useState(0);

  const sampleLocations = [
    { id: 1, latitude: 6.9271, longitude: 79.8612, name: "Colombo", rating: 4 },
    { id: 2, latitude: 7.2906, longitude: 80.6337, name: "Kandy", rating: 3 },
    { id: 3, latitude: 6.0214, longitude: 80.217, name: "Galle", rating: 5 },
    { id: 4, latitude: 8.4894, longitude: 80.4085, name: "Jaffna", rating: 4 },
  ];

  useEffect(() => {
    const fetchLocations = async () => {
      try {
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
      console.log('Rated location:', selectedLocation.name, 'with rating:', rating);
    } catch (error) {
      console.error('Error rating location:', error);
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
        {selectedLocation && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Typography variant="h5">{selectedLocation.name}</Typography>
            <Rating
              name="location-rating"
              value={rating}
              onChange={(event, newValue) => setRating(newValue)}
              size="large"
            />
            <Button variant="contained" color="primary" onClick={handleRateLocation}>
              Rate Location
            </Button>
          </Box>
        )}
      </Grid>
    </Grid>
  );
};

export default Home;