import busRoutes from '../data/busRoutes';

export function searchRoutes(query) {
  if (!query || query.trim().length === 0) return [];
  const q = query.toLowerCase().trim();
  return busRoutes.filter(
    (r) =>
      r.number.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.stops.some((s) => s.toLowerCase().includes(q))
  );
}

export function getRouteById(routeId) {
  return busRoutes.find((r) => r.id === routeId) || null;
}

export function getRoutesAtStop(stopName) {
  return busRoutes.filter((r) =>
    r.stops.some((s) => s.toLowerCase() === stopName.toLowerCase())
  );
}

export function getAllStopNames() {
  const stops = new Set();
  busRoutes.forEach((r) => r.stops.forEach((s) => stops.add(s)));
  return Array.from(stops).sort();
}

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function generateBusETAs(route, stopName) {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const firstBus = parseTime(route.firstBus);
  const lastBus = parseTime(route.lastBus);

  if (currentMinutes < firstBus || currentMinutes > lastBus) {
    return [];
  }

  const stopIndex = route.stops.findIndex(
    (s) => s.toLowerCase() === stopName.toLowerCase()
  );
  if (stopIndex === -1) return [];

  const stopOffset = stopIndex * 4;
  const etas = [];
  const jitter = ((route.id.charCodeAt(0) + now.getMinutes()) % 5) - 2;

  for (let i = 0; i < 5; i++) {
    const eta = Math.max(
      1,
      (route.frequency * i) - (currentMinutes % route.frequency) + stopOffset + jitter + Math.floor(Math.random() * 3)
    );
    if (eta < 120) {
      etas.push({
        id: `${route.id}-bus-${i}`,
        routeNumber: route.number,
        routeName: route.name,
        routeType: route.type,
        eta: Math.round(eta),
        stopName,
        vehicleId: `KA-${51 + (i % 9)}F-${1000 + ((route.id.charCodeAt(0) * 100 + i * 37) % 9000)}`,
        occupancy: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      });
    }
  }

  return etas.sort((a, b) => a.eta - b.eta);
}

export function getBusETAsForRoute(routeId, stopName) {
  const route = getRouteById(routeId);
  if (!route) return [];
  return generateBusETAs(route, stopName);
}

export function getBusETAsAtStop(stopName) {
  const routes = getRoutesAtStop(stopName);
  const allETAs = routes.flatMap((r) => generateBusETAs(r, stopName));
  return allETAs.sort((a, b) => a.eta - b.eta);
}

export function getStopSuggestions(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const allStops = getAllStopNames();
  return allStops.filter((s) => s.toLowerCase().includes(q));
}
