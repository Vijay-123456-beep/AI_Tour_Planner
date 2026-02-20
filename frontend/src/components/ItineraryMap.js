import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Box, Typography, CircularProgress, Chip } from '@mui/material';
import NavigationIcon from '@mui/icons-material/Navigation';

// Icons fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

// Custom icon for the tracker
const trackerIcon = L.divIcon({
    className: 'custom-tracker-icon',
    html: `<div style="background-color: #1976d2; border: 2px solid white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(0,0,0,0.3);">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <path d="M21 3L3 10.53v.98l7.51 2.22 2.22 7.51h.98L21 3z"/>
            </svg>
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapUpdater = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [bounds, map]);
    return null;
};

const ItineraryMap = ({ source, destination, startDate, endDate }) => {
    const [sourceCoords, setSourceCoords] = useState(null);
    const [destCoords, setDestCoords] = useState(null);
    const [trackerPos, setTrackerPos] = useState(null);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isTripActive, setIsTripActive] = useState(false);

    // Geocoding
    useEffect(() => {
        if (!destination) return;

        const geocode = async (query) => {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
                const data = await response.json();
                if (data && data.length > 0) {
                    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
                }
                return null;
            } catch (err) {
                console.error("Geocoding error:", err);
                return null;
            }
        };

        const fetchAllCoords = async () => {
            setLoading(true);
            const dCoords = await geocode(destination);
            setDestCoords(dCoords);

            if (source) {
                const sCoords = await geocode(source);
                setSourceCoords(sCoords);
            }

            if (!dCoords) setError('Destination location not found');
            setLoading(false);
        };

        fetchAllCoords();
    }, [source, destination]);

    // Tracking Simulation Logic
    useEffect(() => {
        if (!sourceCoords || !destCoords) return;

        // Determine if trip is active
        const now = new Date();
        const start = startDate ? new Date(startDate) : new Date();
        const end = endDate ? new Date(endDate) : new Date();

        // Ensure start is before end
        const effectiveStart = start < end ? start : end;
        const effectiveEnd = end > start ? end : start;

        const active = now >= effectiveStart && now <= effectiveEnd;
        setIsTripActive(active);

        // Calculate progress
        // For a better visual experience, if NOT active, we'll just show a static route
        // If active, we calculate progress. If just testing, we'll loop it.
        let interval;
        if (active) {
            const updateProgress = () => {
                const total = effectiveEnd - effectiveStart;
                const current = new Date() - effectiveStart;
                let p = current / total;
                p = Math.max(0, Math.min(1, p));

                // For demonstration, if trip is active but progress is static,
                // we'll add a small oscillating wiggle or just move slowly
                setProgress(p);

                // Interpolate
                const lat = sourceCoords[0] + (destCoords[0] - sourceCoords[0]) * p;
                const lon = sourceCoords[1] + (destCoords[1] - sourceCoords[1]) * p;
                setTrackerPos([lat, lon]);
            };

            updateProgress();
            interval = setInterval(updateProgress, 10000); // Update every 10s
        } else {
            // Set tracker at source if not started, or destination if ended
            const p = now < effectiveStart ? 0 : 1;
            setProgress(p);
            const base = now < effectiveStart ? sourceCoords : destCoords;
            setTrackerPos(base);
        }

        return () => clearInterval(interval);
    }, [sourceCoords, destCoords, startDate, endDate]);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
    if (error || !destCoords) return <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}><Typography color="error">{error || 'Map unavailable'}</Typography></Box>;

    const bounds = sourceCoords ? [sourceCoords, destCoords] : [destCoords, destCoords];

    return (
        <Box sx={{ height: 450, width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0', position: 'relative' }}>
            {source && (
                <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Chip
                        label={isTripActive ? "Live Tracking Active" : "Route Overview"}
                        color={isTripActive ? "success" : "default"}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                    />
                    <Typography variant="caption" sx={{ bgcolor: 'white', px: 1, borderRadius: 1, boxShadow: 1 }}>
                        Progress: {(progress * 100).toFixed(1)}%
                    </Typography>
                </Box>
            )}

            <MapContainer bounds={bounds} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {sourceCoords && (
                    <>
                        <Marker position={sourceCoords}>
                            <Popup>Starting From: {source}</Popup>
                        </Marker>
                        <Polyline
                            positions={[sourceCoords, destCoords]}
                            color="#1976d2"
                            dashArray="10, 10"
                            weight={3}
                            opacity={0.6}
                        />
                    </>
                )}

                <Marker position={destCoords}>
                    <Popup>Destination: {destination}</Popup>
                </Marker>

                {trackerPos && sourceCoords && (
                    <Marker position={trackerPos} icon={trackerIcon} zIndexOffset={1000}>
                        <Popup>
                            <strong>Your Trip Status</strong><br />
                            {isTripActive ? "En route!" : progress === 1 ? "Arrived at destination" : "Ready to start"}
                        </Popup>
                    </Marker>
                )}

                <MapUpdater bounds={bounds} />
            </MapContainer>
        </Box>
    );
};

export default ItineraryMap;
