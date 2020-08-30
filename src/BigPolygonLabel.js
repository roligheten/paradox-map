import linearRegression from '@elstats/linear-regression';

const RASTER_STEPS = 50;
const LINE_FIND_STEPS = 20;

export default function(polygon) {
    const points = rasterizePolygon(polygon);

    const candidateLng = linReg(points);

    const candidateLat = linRegInverse(flipCoords(points));

    return [candidateLng != null && getLongestLine(candidateLng, polygon), candidateLat != null && getLongestLine(candidateLat, polygon)]
}

function getLongestLine(line, polygon) {
    const bounds = polygon.getBounds();
    const polyPointsArray = polygon.getLatLngs();

    const intersects = polygonsLineIntersects(line, polyPointsArray);

    let lowestX = Infinity, highestX = -Infinity
    let lowestY = Infinity, highestY = -Infinity

    for (let i = 0; i < intersects.length; i++) {
        if (intersects[i][0] < lowestX) {
            lowestX = intersects[i][0];
            lowestY = intersects[i][1];
        }
        if (intersects[i][0] > highestX) {
            highestX = intersects[i][0];
            highestY = intersects[i][1];
        }
    }

    return [[lowestX, lowestY],[highestX,highestY]]
}

function lineToLineSegmentIntersection(l1p1, l1p2, l2) {
    const l1 = lineSegmentToLine(l1p1, l1p2);
    const intersect = lineIntersection(l1, l2);

    if (intersect != null && intersect[0] > l1p1[0] && intersect[0] < l1p2[0]) {
        return intersect;
    }

    return null;
}

function lineIntersection(l1, l2) {
    if (l1[0]==l2[0]) {
        return null;
    }

    const x = (l2[1]-l1[1])/(l1[0]-l2[0])
    const y = l1[0]*x+l1[1]

    return [x,y]
}

function lineSegmentToLine(p1, p2) {
    const x1 = p1[0], x2 = p2[0], y1 = p1[1], y2 = p2[1];
    const a = (y2-y1)/(x2-x1)
    const b = (x2*y1-x1*y2)/(x2-x1)

    return [a, b]
}

function linReg(points) {
    const regRes = linearRegression(points);
    if (!isNaN(regRes.a) && !isNaN(regRes.b)) {
        return [regRes.a, regRes.b]
    }
    return null;
}

function linRegInverse(points) {
    const regRes = linearRegression(points);
    if (!isNaN(regRes.a) && !isNaN(regRes.b)) {
        return [1/regRes.a, -(regRes.b /regRes.a)];
    }
    return null;
}

function rasterizePolygon(polygon) {
    const polyPointsArray = polygon.getLatLngs();
    const bounds = polygon.getBounds();

    const rasterPoints = []
    for (let lng = bounds.getWest(); lng <= bounds.getEast(); lng += (bounds.getEast()-bounds.getWest())/RASTER_STEPS) {
        for (let lat = bounds.getSouth(); lat <= bounds.getNorth(); lat += (bounds.getNorth()-bounds.getSouth())/RASTER_STEPS) {
            if (isInsidePolygons(lat, lng, polyPointsArray)) {
                rasterPoints.push([lat,lng])
            }
        }
    }
    
    return rasterPoints;
}

function isInsidePolygons(lat, lng, polygons) {
    if (!Array.isArray(polygons[0])) {
        if (isInsidePolygon(lat, lng, polygons)) {
            return true;
        }
    } else {
        for (let i = 0; i < polygons.length; i++) {
            if (isInsidePolygons(lat, lng, polygons[i])) {
                return true;
            }
        }
    }

    return false;
}

function isInsidePolygon(x, y, polyPoints) {

    var inside = false;
    for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
        var xi = polyPoints[i].lat, yi = polyPoints[i].lng;
        var xj = polyPoints[j].lat, yj = polyPoints[j].lng;

        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }

    return inside;
};

function polygonsLineIntersects(line, polygons) {
    let intersects = []
    if (!Array.isArray(polygons[0])) {
        return polygonLineIntersects(line, polygons)
    } else {
        for (let i = 0; i < polygons.length; i++) {
            intersects = intersects.concat(polygonsLineIntersects(line, polygons[i]))
        }
    }

    return intersects;
}

function polygonLineIntersects(line, polyPoints) {
    const intersects = [];

    for (var i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
        var x1 = polyPoints[i].lat, y1 = polyPoints[i].lng;
        var x2 = polyPoints[j].lat, y2 = polyPoints[j].lng;

        const intersect = lineToLineSegmentIntersection([x1,y1], [x2,y2], line)

        if (intersect != null) {
            intersects.push(intersect);
        }
    }

    return intersects;
}

function flipCoords(coords) {
    const flipped = []
    for (let i = 0; i < coords.length; i++) {
        const p = coords[i]
        flipped.push([p[1], p[0]])
    }

    return flipped;
}