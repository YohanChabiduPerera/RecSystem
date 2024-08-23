import React, { useState, useEffect } from "react";
import { Grid, Box, Typography, Rating, Button, Divider } from "@mui/material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import MapComponent from "../components/MapComponent";

const Home = ({ currentPosition }) => {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [rating, setRating] = useState(0);
  const [distance, setDistance] = useState(null);
  const [placeName, setPlaceName] = useState("");

  const [position, setPosition] = useState({
    latitude: currentPosition?.latitude || 0,
    longitude: currentPosition?.longitude || 0,
  });

  // calculate the distance between two latitude and longitude points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance.toFixed(2);
  };

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
  useEffect(() => {
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
              user_longitude: position.longitude,
              user_latitude: position.latitude,
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
  
        let name;
        const locationParts = data.location.split(",");
        
        // check if the first part is numeric
        if (!isNaN(locationParts[0].trim())) {
          // Extract only the next part
          name = locationParts.length > 1 ? locationParts[1].trim() : ""; 
        } else {
          name = locationParts[0].trim(); // use the first part as name
        }
  
        // re-structure format
        const newLocation = {
          id: 1,
          latitude: data.coordinates.latitude,
          longitude: data.coordinates.longitude,
          name: name,
          venue_id: data.venue_id,
          rating: 0,
        };
  
        //cCalculate the distance between the current location and the fetched place
        const calculatedDistance = calculateDistance(
          position.latitude,
          position.longitude,
          data.coordinates.latitude,
          data.coordinates.longitude
        );
  
        setDistance(calculatedDistance);
        setPlaceName(newLocation.name);
        setLocations([newLocation]);
  
        toast.success("Recommended venue fetched successfully");
        console.log("Recommended venue:", newLocation);
      } catch (error) {
        toast.error("Error recommending nearby venues");
        console.error("Error recommending nearby venues:", error);
      }
    };
  
    if (position.latitude && position.longitude) {
      handleRecommendNearbyVenues();
    }
  }, [position]);
  

  // update position when currentPosition changes
  useEffect(() => {
    if (currentPosition && currentPosition.latitude && currentPosition.longitude) {
      setPosition({
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
      });
    }
  }, [currentPosition]);

  return (
    <Grid container spacing={4}>
      <ToastContainer />
      <Grid item xs={9}>
        <MapComponent
          locations={locations}
          currentPosition={position} 
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
          <Divider sx={{ margin: "16px 0" }} />
          {placeName && (
            <Typography variant="h5" sx={{ marginBottom: 2 }}>
              Name: {placeName}
            </Typography>
          )}
          {distance && (
            <Typography variant="h6" sx={{ marginBottom: 2 }}>
              Distance: {distance} km
            </Typography>
          )}
          {selectedLocation && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}
            >
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
