import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Icon } from "leaflet";
import "./MapComponent.css";

const MapComponent = ({ locations, currentPosition }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);

  const redIcon = new Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

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
