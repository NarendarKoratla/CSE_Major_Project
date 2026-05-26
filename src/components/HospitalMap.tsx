import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';

interface Hospital {
    name: string;
    lat: number;
    lng: number;
    address: string;
    distance_km: number;
    timings?: string;
    phone?: string;
}

interface HospitalMapProps {
    userLat: number;
    userLng: number;
    hospitals: Hospital[];
    selectedHospital?: Hospital | null;
}

export default function HospitalMap({ userLat, userLng, hospitals, selectedHospital }: HospitalMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);
    const routeLayerRef = useRef<L.Polyline | null>(null);

    // Initial Coordinates Check
    if (!userLat || !userLng || isNaN(userLat) || isNaN(userLng)) {
        return (
            <div className="h-[400px] w-full bg-muted flex flex-col items-center justify-center rounded-xl text-muted-foreground border-2 border-dashed">
                <p>Invalid location coordinates. Please try detecting location again.</p>
            </div>
        );
    }

    useEffect(() => {
        if (!mapContainerRef.current) return;

        // Initialize Map
        if (!mapRef.current) {
            mapRef.current = L.map(mapContainerRef.current, {
                center: [userLat, userLng],
                zoom: 13,
                scrollWheelZoom: false
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapRef.current);

            markersRef.current = L.layerGroup().addTo(mapRef.current);
        }

        // Cleanup function
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []); // Only once on mount

    useEffect(() => {
        if (!mapRef.current || !markersRef.current) return;

        // Update Center if no hospital is selected, or if coordinates changed
        if (!selectedHospital) {
            mapRef.current.setView([userLat, userLng], 13);
        }

        // Clear existing markers
        markersRef.current.clearLayers();

        // User Icon
        const userIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // Default Blue Icon for Hospitals
        const hospitalIcon = new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // Add User Marker
        L.marker([userLat, userLng], { icon: userIcon })
            .bindPopup('<div class="font-bold">You are here</div>')
            .addTo(markersRef.current);

        // Add Hospital Markers
        (hospitals || []).forEach(hospital => {
            if (!hospital || typeof hospital.lat !== 'number' || typeof hospital.lng !== 'number') return;

            const isSelected = selectedHospital?.lat === hospital.lat && selectedHospital?.lng === hospital.lng;

            const popupContent = `
                <div class="space-y-1">
                    <div class="font-bold text-[#2a9d8f]">${hospital.name || "Medical Facility"}</div>
                    <div class="text-xs text-gray-500 line-clamp-2">${hospital.address || "Nearby location"}</div>
                    <div class="text-xs font-medium text-blue-600 mt-2">Use "SHOW DIRECTIONS" below the map for in-app routing</div>
                </div>
            `;

            L.marker([hospital.lat, hospital.lng], { icon: hospitalIcon })
                .bindPopup(popupContent)
                .addTo(markersRef.current);
        });

    }, [userLat, userLng, hospitals, selectedHospital]);

    // Routing Logic
    useEffect(() => {
        if (!mapRef.current || !selectedHospital) {
            if (routeLayerRef.current) {
                routeLayerRef.current.remove();
                routeLayerRef.current = null;
            }
            return;
        }

        const fetchRoute = async () => {
            try {
                const response = await fetch(
                    `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${selectedHospital.lng},${selectedHospital.lat}?overview=full&geometries=geojson`
                );
                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                    const coordinates = data.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

                    if (routeLayerRef.current) {
                        routeLayerRef.current.remove();
                    }

                    routeLayerRef.current = L.polyline(coordinates, {
                        color: '#3b82f6',
                        weight: 5,
                        opacity: 0.7,
                        lineJoin: 'round'
                    }).addTo(mapRef.current!);

                    // Fit bounds to show both user and hospital
                    const bounds = L.latLngBounds([
                        [userLat, userLng],
                        [selectedHospital.lat, selectedHospital.lng]
                    ]);
                    mapRef.current!.fitBounds(bounds, { padding: [50, 50] });
                }
            } catch (error) {
                console.error("Routing failed", error);
            }
        };

        fetchRoute();

        return () => {
            if (routeLayerRef.current) {
                routeLayerRef.current.remove();
                routeLayerRef.current = null;
            }
        };
    }, [userLat, userLng, selectedHospital]);

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-inner border relative z-0">
            <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />
            {selectedHospital && (
                <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-blue-100 max-w-[200px]">
                    <div className="text-[10px] uppercase font-bold text-blue-500 mb-1">Direct Routing</div>
                    <div className="text-xs font-bold text-gray-800 line-clamp-1">{selectedHospital.name}</div>
                    <div className="text-[10px] text-gray-500 mt-1 flex justify-between">
                        <span>Distance: {(selectedHospital.distance_km || 0).toFixed(1)} km</span>
                    </div>
                </div>
            )}
        </div>
    );
}
