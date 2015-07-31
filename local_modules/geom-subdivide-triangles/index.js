var clone = require('clone');
var copy  = require('pex-math/Vec3').copy;
var add   = require('pex-math/Vec3').add;
var scale = require('pex-math/Vec3').scale;

function subdivideTriangles(geometry) {
    var newPositions = clone(geometry.positions);
    var newCells = [];

    var cells = geometry.cells;
    var positions = geometry.positions;

    var cache = [];

    function edgeCenter(a, b) {
        //this can fail if the cached index would be 0 but if we had vertices before this will neve happen
        if (cache[a] && cache[a][b]) {
            return cache[a][b];
        }
        if (cache[b] && cache[b][a]) {
            return cache[b][a];
        }
        var center = copy(positions[a]);
        add(center, positions[b]);
        scale(center, 0.5);

        //console.log(a, b, positions[a], positions[b], center)

        if (!cache[a]) cache[a] = [];
        var newCenterIndex = newPositions.length;
        cache[a][b] = newCenterIndex;
        newPositions.push(center);

        //console.log(a, b, '->', newCenterIndex)
        return newCenterIndex;
    }

    //for each face
    for(var i=0; i<cells.length; i++) {
        var face = cells[i];
        //for each face vertex
        var centerFace = [];
        for(var j=0; j<face.length; j++) {
            var prevJ = (j - 1 + face.length) % face.length;
            var nextJ = (j + 1) % face.length;
            var a = face[prevJ];
            var b = face[j];
            var c = face[nextJ];
            var prevEdgeCenter = edgeCenter(a, b);
            var nextEdgeCenter = edgeCenter(b, c);
            newCells.push([nextEdgeCenter, prevEdgeCenter, b]);
            centerFace.push(prevEdgeCenter);
        }
        newCells.push(centerFace);
    }

    //console.log(newCells)

    return {
        positions: newPositions,
        cells: newCells
    }
}

module.exports = subdivideTriangles;
