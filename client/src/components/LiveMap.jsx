import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useAppStore from '../store/useAppStore';

const defaultCenter = {
    lat: 28.6139,
    lng: 77.2090
}; // Defaulting to New Delhi

// Haversine formula to calculate distance between two points in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const toRadians = angle => angle * (Math.PI / 180);
    const phi1 = toRadians(lat1);
    const phi2 = toRadians(lat2);
    const deltaPhi = toRadians(lat2 - lat1);
    const deltaLambda = toRadians(lon2 - lon1);
    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const formatDistance = (meters) => {
    if (meters < 1000) {
        return `${Math.round(meters)} m away`;
    }
    return `${(meters / 1000).toFixed(1)} km away`;
};

// Array of vibrant colors for markers
const markerColors = [
    '#e11d48', // rose-600
    '#d97706', // amber-600
    '#65a30d', // lime-600
    '#059669', // emerald-600
    '#0891b2', // cyan-600
    '#2563eb', // blue-600
    '#4f46e5', // indigo-600
    '#7c3aed', // violet-600
    '#c026d3', // fuchsia-600
    '#db2777', // pink-600
];

// Helper to get a consistent color based on a string (like a username or user ID)
const getColorForString = (str) => {
    if (!str) return markerColors[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % markerColors.length;
    return markerColors[index];
};

// Component to dynamically re-center map if needed
const MapController = ({ center, shouldRecenter }) => {
    const map = useMap();
    useEffect(() => {
        if (center && shouldRecenter) {
            map.flyTo([center.lat, center.lng], map.getZoom(), { animate: true, duration: 1 });
        }
    }, [center.lat, center.lng, shouldRecenter, map]);
    return null;
};

const LiveMap = ({ isVisible }) => {
    const { onlineUsers, userInfo } = useAppStore();
    const [shouldRecenter, setShouldRecenter] = useState(true);

    // Calculate center based on current user or default
    // We prioritize the logged-in user's location, otherwise any other user, otherwise default center
    const myLocation = userInfo ? onlineUsers[userInfo._id] : null;
    const anyLocation = Object.values(onlineUsers)[0];

    const center = myLocation
        ? { lat: myLocation.latitude, lng: myLocation.longitude }
        : anyLocation
            ? { lat: anyLocation.latitude, lng: anyLocation.longitude }
            : defaultCenter;

    // Turn off automatic re-centering after we've locked onto the user's location
    // This allows the user to pan around freely without snapping back at every GPS update.
    useEffect(() => {
        if (myLocation && shouldRecenter) {
            const timer = setTimeout(() => {
                setShouldRecenter(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [myLocation, shouldRecenter]);

    if (!isVisible) return null;

    // Custom creation of Leaflet icons to show user name and color
    const createCustomIcon = (user, isMe) => {
        const markerColor = getColorForString(user.userId);
        const displayName = user.userName + (isMe ? ' (You)' : '');

        return L.divIcon({
            className: 'custom-leaflet-marker bg-transparent',
            html: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; width: 100%; height: 100%;">
                <div style="
                    width: 16px; 
                    height: 16px; 
                    background-color: ${markerColor}; 
                    border-radius: 50%; 
                    border: 2px solid white;
                    box-shadow: 0 0 5px rgba(0,0,0,0.3);
                    z-index: 10;
                    flex-shrink: 0;
                "></div>
                <div style="
                    margin-top: 4px;
                    padding: 2px 8px;
                    background-color: rgba(255, 255, 255, 0.95);
                    border: 1px solid #e5e7eb;
                    border-radius: 9999px;
                    font-size: 11px;
                    font-weight: 600;
                    color: #1f2937;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    white-space: nowrap;
                    pointer-events: none;
                ">
                    ${displayName}
                </div>
            </div>`,
            iconSize: [150, 50],
            iconAnchor: [75, 8] // X: half of 150 to center it horizontally. Y: 8 to anchor the center of the 16px dot to the coordinate.
        });
    };

    return (
        <div className="w-full h-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
            {/* Recenter Button */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    setShouldRecenter(true);
                }}
                className="absolute bottom-6 right-6 z-[1000] bg-white text-brand-600 p-3 rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-all bg-opacity-90 backdrop-blur"
                title="Center on me"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="22" x2="18" y1="12" y2="12" /><line x1="6" x2="2" y1="12" y2="12" /><line x1="12" x2="12" y1="6" y2="2" /><line x1="12" x2="12" y1="22" y2="18" /></svg>
            </button>

            <MapContainer
                center={[center.lat, center.lng]}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
                attributionControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapController center={center} shouldRecenter={shouldRecenter} />

                {Object.values(onlineUsers).map((user) => (
                    <Marker
                        key={user.userId}
                        position={[user.latitude, user.longitude]}
                        icon={createCustomIcon(user, user.userId === userInfo?._id)}
                    >
                        <Popup>
                            <div className="p-1">
                                <p className="font-bold text-gray-800 m-0 leading-none">
                                    {user.userName} {user.userId === userInfo?._id ? '(You)' : ''}
                                </p>
                                {user.userId !== userInfo?._id && myLocation && (
                                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>
                                        📍 {formatDistance(calculateDistance(
                                            myLocation.latitude, myLocation.longitude,
                                            user.latitude, user.longitude
                                        ))}
                                    </p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default LiveMap;

