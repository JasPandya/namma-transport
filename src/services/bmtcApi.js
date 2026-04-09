const BASE_URL = '/api/bmtc';

const defaultHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/plain, */*',
  'lan': 'en',
};

async function bmtcFetch(endpoint, body = {}, extraHeaders = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { ...defaultHeaders, ...extraHeaders },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`BMTC API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.Issuccess && !data.issuccess) {
    throw new Error(data.Message || data.message || 'BMTC API request failed');
  }
  return data;
}

export async function searchRoutes(routeText) {
  if (!routeText || routeText.trim().length === 0) return [];
  const result = await bmtcFetch('/SearchRoute_v2', { routetext: routeText.trim() });
  return (result.data || []).map((r) => ({
    routeNo: r.routeno,
    routeParentId: r.routeparentid,
    row: r.row,
  }));
}

export async function searchStops(stationName) {
  if (!stationName || stationName.trim().length < 3) return [];
  const result = await bmtcFetch('/FindNearByBusStop_v2', { stationName: stationName.trim() });
  return (result.data || []).map((s) => ({
    stationId: s.routeid,
    stationName: s.routename,
  }));
}

export async function getRouteDetails(routeParentId) {
  const result = await bmtcFetch(
    '/SearchByRouteDetails_v4',
    { routeid: routeParentId, servicetypeid: 0 },
    { deviceType: 'WEB' }
  );

  const processDirection = (dir) => {
    if (!dir || !dir.data) return { stops: [], vehicles: [] };

    const stops = dir.data.map((s) => ({
      stationId: s.stationid,
      stationName: s.stationname,
      routeId: s.routeid,
      routeNo: s.routeno,
      from: s.from,
      to: s.to,
      lat: s.centerlat,
      lng: s.centerlong,
      distanceOnStation: s.distance_on_station,
      vehicleDetails: (s.vehicleDetails || []).map((v) => ({
        vehicleId: v.vehicleid,
        vehicleNumber: v.vehiclenumber,
        serviceType: v.servicetype,
        serviceTypeId: v.servicetypeid,
        lat: v.centerlat,
        lng: v.centerlong,
        eta: v.eta,
        scheduledArrival: v.sch_arrivaltime,
        scheduledDeparture: v.sch_departuretime,
        actualArrival: v.actual_arrivaltime,
        actualDeparture: v.actual_departuretime,
        heading: v.heading,
        lastRefresh: v.lastrefreshon,
        currentLocationId: v.currentlocationid,
        stopCoveredStatus: v.stopCoveredStatus,
      })),
    }));

    const vehicles = (dir.mapData || []).map((v) => ({
      vehicleId: v.vehicleid,
      vehicleNumber: v.vehiclenumber,
      serviceType: v.servicetype,
      lat: v.centerlat,
      lng: v.centerlong,
      heading: v.heading,
      lastRefresh: v.lastrefreshon,
    }));

    return { stops, vehicles };
  };

  return {
    up: processDirection(result.up),
    down: processDirection(result.down),
  };
}

export async function getVehicleTrip(vehicleId) {
  const result = await bmtcFetch('/VehicleTripDetails_v2', { vehicleId });
  const routeDetails = (result.RouteDetails || []).map((r) => ({
    stationName: r.stationname,
    stationId: r.stationid,
    routeNo: r.routeno,
    routeName: r.routename,
    busNumber: r.busno,
    tripStatus: r.tripstatus,
    serviceType: r.servicetype,
    scheduledArrival: r.sch_arrivaltime,
    scheduledDeparture: r.sch_departuretime,
    actualArrival: r.actual_arrivaltime,
    eta: r.eta || r.etastatus,
    etaDisplay: r.etastatusmapview,
    lat: r.latitude,
    lng: r.longitude,
    currentStop: r.currentstop,
    nextStop: r.nextstop,
    lastStop: r.laststop || r.weblaststop,
  }));

  const liveLocation = (result.LiveLocation || [])[0] || null;

  return { routeDetails, liveLocation };
}

export async function getAllRoutes() {
  const result = await bmtcFetch('/GetAllRouteList');
  return (result.data || []).map((r) => ({
    routeId: r.routeid,
    routeNo: r.routeno,
    routeName: r.routename,
    fromStationId: r.fromstationid,
    fromStation: r.fromstation,
    toStationId: r.tostationid,
    toStation: r.tostation,
  }));
}

export async function getTimetableByStation(fromStationId, toStationId, startDate, endDate) {
  const result = await bmtcFetch('/GetTimetableByStation_v4', {
    fromStationId,
    toStationId,
    p_startdate: startDate,
    p_enddate: endDate,
    p_isshortesttime: 2,
    p_routeid: '',
    p_date: startDate,
  });

  return (result.data || []).map((t) => ({
    routeId: t.routeid,
    routeNo: t.routeno,
    routeName: t.routename,
    fromStation: t.fromstationname,
    toStation: t.tostationname,
    travelTime: t.traveltime,
    distance: t.distance,
    startTime: t.starttime,
  }));
}

export async function getTimetableByRoute(routeId, fromStationId, toStationId, startTime, endTime) {
  const now = new Date().toISOString();
  const result = await bmtcFetch('/GetTimetableByRouteid_v3', {
    current_date: now,
    routeid: routeId,
    fromStationId,
    toStationId,
    starttime: startTime,
    endtime: endTime,
  });

  return (result.data || []).map((t) => ({
    fromStation: t.fromstationname,
    toStation: t.tostationname,
    travelTime: t.apptime,
    distance: t.distance,
    trips: (t.tripdetails || []).map((trip) => ({
      startTime: trip.starttime,
      endTime: trip.endtime,
    })),
  }));
}

export async function listVehicles(vehicleRegNo) {
  if (!vehicleRegNo || vehicleRegNo.trim().length === 0) return [];
  const result = await bmtcFetch(
    '/ListVehicles',
    { vehicleRegNo: vehicleRegNo.trim(), deviceType: 'WEB' },
    { deviceType: 'WEB' }
  );
  return (result.data || []).map((v) => ({
    vehicleId: v.vehicleid,
    vehicleRegNo: v.vehicleregno,
  }));
}
