import { useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with Vite bundler
delete L.Icon.Default.prototype._getIconUrl;

/**
 * Returns true if the coordinate pair is valid (non-null, non-zero).
 */
function isValidCoord(lat, lng) {
  return (
    lat != null &&
    lng != null &&
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat !== 0 &&
    lng !== 0
  );
}

/**
 * Creates a Leaflet divIcon for a bus marker rotated by heading degrees.
 */
function createBusIcon(heading = 0) {
  return L.divIcon({
    className: '',
    html: `<div style="transform:rotate(${heading}deg);font-size:20px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5))">🚌</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

/**
 * Helper component that auto-fits the map bounds once on mount.
 * Subsequent data refreshes (e.g. vehicle position updates) do NOT
 * re-zoom, so the user's manual zoom/pan is preserved.
 */
function FitBounds({ coords }) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (coords.length === 0 || hasFitted.current) return;

    const bounds = L.latLngBounds(coords.map(([lat, lng]) => [lat, lng]));
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 16 });
    hasFitted.current = true;
  }, [coords, map]);

  return null;
}

/**
 * RouteMap – renders an interactive Leaflet map showing bus stops along
 * a route (connected by a polyline) and live vehicle positions.
 *
 * Props:
 *   stops           – ordered array of stops on the route
 *   vehicles        – live bus positions
 *   selectedStopId  – id of the currently-selected stop
 *   routeNo         – display route number (e.g. "500-A")
 */
export default function RouteMap({ stops = [], vehicles = [], selectedStopId, routeNo }) {
  const mapRef = useRef(null);

  // ── Filter to only valid-coordinate items ─────────────────────────
  const validStops = useMemo(
    () => stops.filter((s) => isValidCoord(s.lat, s.lng)),
    [stops],
  );

  const validVehicles = useMemo(
    () => vehicles.filter((v) => isValidCoord(v.lat, v.lng)),
    [vehicles],
  );

  // ── Bail out if there's nothing to display ────────────────────────
  if (validStops.length === 0 && validVehicles.length === 0) {
    return null;
  }

  // ── Collect all coordinates for auto-fit ──────────────────────────
  const allCoords = useMemo(
    () => [
      ...validStops.map((s) => [s.lat, s.lng]),
      ...validVehicles.map((v) => [v.lat, v.lng]),
    ],
    [validStops, validVehicles],
  );

  // ── Polyline positions (stops in order) ───────────────────────────
  const polylinePositions = useMemo(
    () => validStops.map((s) => [s.lat, s.lng]),
    [validStops],
  );

  // ── Map centre fallback (first valid coordinate) ──────────────────
  const defaultCenter = allCoords[0] || [12.9716, 77.5946]; // Bangalore centre

  return (
    <div
      style={{
        height: 250,
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #334155',
      }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
        ref={mapRef}
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
      >
        {/* ── Dark-theme tile layer ──────────────────────────────── */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* ── Auto-fit bounds ────────────────────────────────────── */}
        <FitBounds coords={allCoords} />

        {/* ── Route polyline ─────────────────────────────────────── */}
        {polylinePositions.length >= 2 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{ color: '#f97316', weight: 3, opacity: 0.6 }}
          />
        )}

        {/* ── Stop markers ───────────────────────────────────────── */}
        {validStops.map((stop) => {
          const isSelected =
            selectedStopId != null && String(stop.stationId) === String(selectedStopId);

          return (
            <CircleMarker
              key={`stop-${stop.stationId}`}
              center={[stop.lat, stop.lng]}
              radius={6}
              pathOptions={{
                fillColor: isSelected ? '#f97316' : '#64748b',
                color: isSelected ? '#f97316' : '#64748b',
                fillOpacity: 1,
                weight: isSelected ? 2 : 1,
                opacity: isSelected ? 1 : 0.8,
              }}
            >
              <Popup>
                <div
                  style={{
                    fontFamily: 'system-ui, sans-serif',
                    padding: '2px 0',
                    minWidth: 120,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: '#1e293b',
                      marginBottom: 2,
                    }}
                  >
                    {stop.stationName}
                  </div>
                  {routeNo && (
                    <span
                      style={{
                        display: 'inline-block',
                        background: '#f97316',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 4,
                      }}
                    >
                      {routeNo}
                    </span>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* ── Vehicle / bus markers ──────────────────────────────── */}
        {validVehicles.map((vehicle) => (
          <Marker
            key={`bus-${vehicle.vehicleId}`}
            position={[vehicle.lat, vehicle.lng]}
            icon={createBusIcon(vehicle.heading || 0)}
          >
            <Popup>
              <div
                style={{
                  fontFamily: 'system-ui, sans-serif',
                  padding: '2px 0',
                  minWidth: 130,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#1e293b',
                    marginBottom: 4,
                  }}
                >
                  🚌 {vehicle.vehicleNumber}
                </div>
                {vehicle.serviceType && (
                  <div
                    style={{
                      fontSize: 10,
                      color: '#64748b',
                      marginBottom: 4,
                    }}
                  >
                    {vehicle.serviceType}
                  </div>
                )}
                {vehicle.eta != null && (
                  <span
                    style={{
                      display: 'inline-block',
                      background: vehicle.eta <= 5 ? '#16a34a' : '#f97316',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {vehicle.eta} min
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
