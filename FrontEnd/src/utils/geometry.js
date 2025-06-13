/**
 * @param {number} lat1 
 * @param {number} lon1
 * @param {number} lat2 
 * @param {number} lon2
 * @returns {number | null} 
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(coord => typeof coord !== 'number' || isNaN(coord))) {
    return null;
  }

  const R = 6371.0; 

  const toRadians = (degree) => degree * (Math.PI / 180);

  const lat1Rad = toRadians(lat1);
  const lon1Rad = toRadians(lon1);
  const lat2Rad = toRadians(lat2);
  const lon2Rad = toRadians(lon2);

  const dlon = lon2Rad - lon1Rad;
  const dlat = lat2Rad - lat1Rad;

  const a = Math.sin(dlat / 2)**2 + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dlon / 2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance;
}