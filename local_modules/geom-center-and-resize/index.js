var AABB = require('pex-geom/AABB');
var Vec3 = require('pex-math/Vec3');

function centerAndResize(positions, size) {
    size = size || 1;
    var aabb = AABB.fromPoints(positions);
    var center = AABB.center(aabb);
    var currentSize = AABB.size(aabb);
    var scale = Math.max(currentSize[0], Math.max(currentSize[1], currentSize[2]));

    var newPositions = [];
    for(var i=0; i<positions.length; i++) {
        var p = Vec3.copy(positions[i]);
        Vec3.sub(p, center);
        Vec3.scale(p, size/scale);
        newPositions.push(p);
    }
    return newPositions;
}

module.exports = centerAndResize;
