var renderToCubemap = require('../render-to-cubemap');
var glslifySync = require('glslify-sync');

var VERT = glslifySync(__dirname + '/glsl/convolve.vert');
var FRAG = glslifySync(__dirname + '/glsl/convolve.frag');

var quadPositions = [[-1,-1],[1,-1], [1,1],[-1,1]];
var quadFaces = [ [0, 1, 2], [0, 2, 3]];

var quadMesh = null;
var convolveProgram = null;

function convolveCubemap(ctx, fromCubemap, toCubemap, options) {
    options = options || {};
    var highQuality = (options.highQuality !== undefined) ? options.highQuality : true;

    ctx.pushState(ctx.MESH_BIT | ctx.PROGRAM_BIT); //ctx.TEXTURE_BIT
    if (!quadMesh) {
        var quadAttributes = [ { data: quadPositions, location: ctx.ATTRIB_POSITION } ];
        var quadIndices = { data: quadFaces };
        quadMesh = ctx.createMesh(quadAttributes, quadIndices);

        convolveProgram = ctx.createProgram(VERT, FRAG);
    }
    renderToCubemap(ctx, toCubemap, function() {
        ctx.bindTexture(fromCubemap, 0);
        ctx.bindProgram(convolveProgram);
        convolveProgram.setUniform('uEnvMap', 0);
        convolveProgram.setUniform('uHighQuality', highQuality);
        ctx.bindMesh(quadMesh);
        ctx.drawMesh();
    });
    ctx.popState(ctx.MESH_BIT | ctx.PROGRAM_BIT); //ctx.TEXTURE_BIT
}

module.exports = convolveCubemap;
