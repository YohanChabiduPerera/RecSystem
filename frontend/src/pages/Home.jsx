// Home.jsx
import React, { useState, useEffect } from "react";
import MapComponent from "../components/MapComponent";
import {Box, Typography } from "@mui/material";

const Home = ({ currentPosition }) => {
  const [locations, setLocations] = useState([]);
  const sampleLocations = [
    { latitude: 6.9271, longitude: 79.8612 }, // Colombo
    { latitude: 7.2906, longitude: 80.6337 }, // Kandy
    { latitude: 6.0214, longitude: 80.217 }, // Galle
    { latitude: 8.4894, longitude: 80.4085 }, // Jaffna
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

  return (
    <>
      <MapComponent locations={locations} currentPosition={currentPosition}/>
    </>
  );
};

export default Home
