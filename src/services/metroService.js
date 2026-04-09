import { metroLines, metroSchedule, travelTimeBetweenStations } from '../data/metroData';

export function getLine(lineId) {
  return metroLines[lineId] || null;
}

export function getAllStations(lineId) {
  const line = metroLines[lineId];
  return line ? line.stations : [];
}

export function getStation(stationId) {
  for (const line of Object.values(metroLines)) {
    const station = line.stations.find((s) => s.id === stationId);
    if (station) return { ...station, line: line.id, lineName: line.name, lineColor: line.color };
  }
  return null;
}

function getScheduleForToday() {
  const day = new Date().getDay();
  return day === 0 || day === 6 ? metroSchedule.weekend : metroSchedule.weekday;
}

function parseTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function getFrequencyAtTime(minutesSinceMidnight) {
  const schedule = getScheduleForToday();
  for (const peak of schedule.peakHours) {
    const start = parseTime(peak.start);
    const end = parseTime(peak.end);
    if (minutesSinceMidnight >= start && minutesSinceMidnight <= end) {
      return peak.frequency;
    }
  }
  return schedule.offPeakFrequency;
}

export function getTrainETAs(stationId, direction = 'both') {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const schedule = getScheduleForToday();
  const firstTrain = parseTime(schedule.firstTrain);
  const lastTrain = parseTime(schedule.lastTrain);

  if (currentMinutes < firstTrain || currentMinutes > lastTrain) {
    return { towards_end: [], towards_start: [] };
  }

  let lineId = null;
  let stationIndex = -1;
  for (const [lid, line] of Object.entries(metroLines)) {
    const idx = line.stations.findIndex((s) => s.id === stationId);
    if (idx !== -1) {
      lineId = lid;
      stationIndex = idx;
      break;
    }
  }
  if (!lineId) return { towards_end: [], towards_start: [] };

  const line = metroLines[lineId];
  const totalStations = line.stations.length;
  const frequency = getFrequencyAtTime(currentMinutes);

  const generateForDirection = (dirLabel, stIdx) => {
    const offset = stIdx * travelTimeBetweenStations;
    const trains = [];
    for (let i = 0; i < 6; i++) {
      const baseEta = (frequency * i) - (currentMinutes % frequency) + (offset % frequency);
      const eta = Math.max(1, Math.round(baseEta + (Math.random() * 2 - 1)));
      if (eta < 90) {
        const destination = dirLabel === 'towards_end'
          ? line.stations[totalStations - 1].name
          : line.stations[0].name;
        trains.push({
          id: `${lineId}-${dirLabel}-${i}`,
          line: lineId,
          lineName: line.name,
          lineColor: line.color,
          direction: dirLabel,
          destination,
          eta,
          scheduledTime: formatTime(currentMinutes + eta),
          platform: dirLabel === 'towards_end' ? 1 : 2,
          coaches: lineId === 'purple' ? 6 : 6,
        });
      }
    }
    return trains.sort((a, b) => a.eta - b.eta);
  };

  const result = {};
  if (direction === 'both' || direction === 'towards_end') {
    result.towards_end = generateForDirection('towards_end', stationIndex);
  }
  if (direction === 'both' || direction === 'towards_start') {
    result.towards_start = generateForDirection('towards_start', totalStations - 1 - stationIndex);
  }
  return result;
}

function formatTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(Math.round(m)).padStart(2, '0')} ${period}`;
}

export function getTravelTime(fromStationId, toStationId) {
  for (const line of Object.values(metroLines)) {
    const fromIdx = line.stations.findIndex((s) => s.id === fromStationId);
    const toIdx = line.stations.findIndex((s) => s.id === toStationId);
    if (fromIdx !== -1 && toIdx !== -1) {
      return Math.abs(toIdx - fromIdx) * travelTimeBetweenStations;
    }
  }
  return null;
}

export function searchStations(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.toLowerCase().trim();
  const results = [];
  for (const line of Object.values(metroLines)) {
    for (const station of line.stations) {
      if (
        station.name.toLowerCase().includes(q) ||
        station.code.toLowerCase().includes(q)
      ) {
        results.push({ ...station, line: line.id, lineName: line.name, lineColor: line.color });
      }
    }
  }
  return results;
}
