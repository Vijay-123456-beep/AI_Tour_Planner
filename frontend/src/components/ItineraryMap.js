import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Box, Typography, CircularProgress } from '@mui/material';

// Fix for default marker icon in React Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper to update map view when coordinates change
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 13);
    }, [center, map]);
    return null;
};

const ItineraryMap = ({ destination, activities = [] }) => {
    const [coordinates, setCoordinates] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Geocode destination
    useEffect(() => {
        if (!destination) return;

        const fetchCoordinates = async () => {
            setLoading(true);
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}`);
                const data = await response.json();

                if (data && data.length > 0) {
                    setCoordinates([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
                } else {
                    setError('Location not found');
                }
            } catch (err) {
                console.error("Geocoding error:", err);
                setError('Failed to load map');
            } finally {
                setLoading(false);
            }
        };

        fetchCoordinates();
    }, [destination]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error || !coordinates) return <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}><Typography color="error">Map unavailable for this location.</Typography></Box>;

    return (
        <Box sx={{ height: 400, width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
            <MapContainer center={coordinates} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={coordinates}>
                    <Popup>
                        {destination}
                    </Popup>
                </Marker>
                <MapUpdater center={coordinates} />
            </MapContainer>
        </Box>
    );
};

export default ItineraryMap;
