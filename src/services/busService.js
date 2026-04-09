import * as bmtcApi from './bmtcApi';

export async function searchRoutes(query) {
  if (!query || query.trim().length === 0) return [];
  try {
    return await bmtcApi.searchRoutes(query);
  } catch (err) {
    console.error('Failed to search routes:', err);
    return [];
  }
}

export async function searchStops(query) {
  if (!query || query.trim().length < 3) return [];
  try {
    return await bmtcApi.searchStops(query);
  } catch (err) {
    console.error('Failed to search stops:', err);
    return [];
  }
}

export async function getRouteDetails(routeParentId) {
  try {
    return await bmtcApi.getRouteDetails(routeParentId);
  } catch (err) {
    console.error('Failed to get route details:', err);
    return { up: { stops: [], vehicles: [] }, down: { stops: [], vehicles: [] } };
  }
}

export async function getVehicleTrip(vehicleId) {
  try {
    return await bmtcApi.getVehicleTrip(vehicleId);
  } catch (err) {
    console.error('Failed to get vehicle trip:', err);
    return { routeDetails: [], liveLocation: null };
  }
}

export function parseETA(etaString) {
  if (!etaString || etaString.trim() === '') return null;
  try {
    const etaDate = new Date(etaString);
    const now = new Date();
    const diffMs = etaDate.getTime() - now.getTime();
    const diffMin = Math.round(diffMs / 60000);
    return diffMin > 0 ? diffMin : null;
  } catch {
    return null;
  }
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr || timeStr.trim() === '') return null;
  const parts = timeStr.split(':');
  if (parts.length < 2) return null;
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

export function getETAMinutes(vehicle, stationId) {
  if (vehicle.eta && vehicle.eta.trim() !== '') {
    const parsed = parseETA(vehicle.eta);
    if (parsed !== null) return parsed;
  }
  if (vehicle.scheduledArrival) {
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const schMin = parseTimeToMinutes(vehicle.scheduledArrival);
    if (schMin !== null) {
      const diff = schMin - currentMin;
      return diff > 0 ? diff : null;
    }
  }
  return null;
}

export function formatVehicleForDisplay(vehicle, stop) {
  const etaMin = getETAMinutes(vehicle, stop?.stationId);
  return {
    vehicleId: vehicle.vehicleId,
    vehicleNumber: vehicle.vehicleNumber,
    serviceType: vehicle.serviceType,
    eta: etaMin,
    scheduledArrival: vehicle.scheduledArrival,
    actualArrival: vehicle.actualArrival,
    lat: vehicle.lat,
    lng: vehicle.lng,
    heading: vehicle.heading,
    lastRefresh: vehicle.lastRefresh,
    hasPassed: vehicle.stopCoveredStatus === 1 && (!vehicle.eta || vehicle.eta.trim() === ''),
  };
}

export function getActiveVehiclesForStop(stop) {
  if (!stop || !stop.vehicleDetails) return [];
  return stop.vehicleDetails
    .map((v) => formatVehicleForDisplay(v, stop))
    .filter((v) => v.eta !== null && !v.hasPassed)
    .sort((a, b) => a.eta - b.eta);
}
