function createOctahedron(r) {
    r = r || 0.5;

    var a = 1 / (2 * Math.sqrt(2));
    var b = 1 / 2;

    var s3 = Math.sqrt(3);
    var s6 = Math.sqrt(6);

    var positions = [
        [ -a, 0, a ],
        [  a, 0, a ],
        [  a, 0,-a ],
        [ -a, 0,-a ],
        [  0, b, 0 ],
        [  0,-b, 0 ]
    ];

    positions.forEach(function(p) {
        var len = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
        p[0] = p[0] / len * r;
        p[1] = p[1] / len * r;
        p[2] = p[2] / len * r;
    })

    var normals = positions.map(function(p) {
        var len = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]);
        return [ p[0] / len, p[1] / len, p[2] / len ];
    });

    var cells = [
      [3, 0, 4],
      [2, 3, 4],
      [1, 2, 4],
      [0, 1, 4],
      [3, 2, 5],
      [0, 3, 5],
      [2, 1, 5],
      [1, 0, 5]
    ];

    return {
        positions: positions,
        normals: normals,
        cells: cells
    }
}

module.exports = createOctahedron;
