import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from 'leaflet';
import "./MapComponent.css"; // Import custom CSS file

const MapComponent = () => {
  // Sample coordinates for testing in Sri Lanka
  const sampleLocations = [
    { latitude: 6.9271, longitude: 79.8612 }, // Colombo
    { latitude: 7.2906, longitude: 80.6337 }, // Kandy
    { latitude: 6.0214, longitude: 80.217 }, // Galle
    { latitude: 8.4894, longitude: 80.4085 }, // Jaffna
  ];

  const [locations, setLocations] = useState([]);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Create a custom red icon for the current location marker
  const redIcon = new Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  useEffect(() => {
    // Fetch coordinates from the backend
    const fetchLocations = async () => {
      try {
        // const response = await fetch("/api/locations"); // Update with your backend endpoint
        // const data = await response.json();
        setLocations(sampleLocations);
        // setLocations(data); // Assuming data is an array of { latitude: number, longitude: number }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, []);

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

  if (!currentPosition || locations.length === 0) return <div>Loading...</div>;

  const handleMarkerClick = (location) => {
    setSelectedLocation(location);
  };

  const defaultLatLng = [currentPosition.latitude, currentPosition.longitude];
  const polylineLatLngs = selectedLocation
    ? [defaultLatLng, [selectedLocation.latitude, selectedLocation.longitude]]
    : [];

  return (
    <MapContainer
      center={defaultLatLng}
      zoom={13}
      style={{ height: "100vh", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={defaultLatLng}>
        <Popup>Current Location</Popup>
      </Marker>
      {locations.map((location, index) => (
        <Marker
          key={index}
          position={[location.latitude, location.longitude]}
          icon={redIcon}
          eventHandlers={{
            click: () => handleMarkerClick(location),
          }}
        >
          <Popup>Location {index + 1}</Popup>
        </Marker>
      ))}
      {selectedLocation && (
        <Polyline positions={polylineLatLngs} color="blue" />
      )}
    </MapContainer>
  );
};

export default MapComponent;