var renderToCubemap = require('../render-to-cubemap');
var glslifySync = require('glslify-sync');
var hammersley = require('hammersley');

var VERT = glslifySync(__dirname + '/glsl/SkyboxQuad.vert');
var FRAG = glslifySync(__dirname + '/glsl/SkyboxQuad.frag');

var quadPositions = [[-1,-1],[1,-1], [1,1],[-1,1]];
var quadFaces = [ [0, 1, 2], [0, 2, 3]];

var quadMesh = null;
var convertProgram = null;

function envmapToCubemap(ctx, fromEnvmap, toCubemap) {
    ctx.pushState(ctx.MESH_BIT | ctx.PROGRAM_BIT); //ctx.TEXTURE_BIT
    if (!quadMesh) {
        var quadAttributes = [ { data: quadPositions, location: ctx.ATTRIB_POSITION } ];
        var quadIndices = { data: quadFaces };
        quadMesh = ctx.createMesh(quadAttributes, quadIndices);

        convertProgram = ctx.createProgram(VERT, FRAG);
    }
    renderToCubemap(ctx, toCubemap, function() {
        ctx.bindTexture(fromEnvmap, 0);
        ctx.bindProgram(convertProgram);
        convertProgram.setUniform('uEnvMap', 0);
        ctx.bindMesh(quadMesh);
        ctx.drawMesh();
    });
    ctx.popState(ctx.MESH_BIT | ctx.PROGRAM_BIT); //ctx.TEXTURE_BIT
}

module.exports = envmapToCubemap;
