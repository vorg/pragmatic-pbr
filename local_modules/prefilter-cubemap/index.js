var renderToCubemap = require('../render-to-cubemap');
var glslifySync = require('glslify-sync');
var hammersley = require('hammersley');

var VERT = glslifySync(__dirname + '/glsl/prefilter.vert');
var FRAG = glslifySync(__dirname + '/glsl/prefilter.frag');

var quadPositions = [[-1,-1],[1,-1], [1,1],[-1,1]];
var quadFaces = [ [0, 1, 2], [0, 2, 3]];

var quadMesh = null;
var prefilterProgram = null;

function prefilterCubemap(ctx, fromCubemap, toCubemap) {
    var numSamples = 1024;
    var hammersleyPointSet = new Float32Array(4 * numSamples);
    for(var i=0; i<numSamples; i++) {
        var p = hammersley(i, numSamples)
        hammersleyPointSet[i*4]   = p[0];
        hammersleyPointSet[i*4+1] = p[1];
        hammersleyPointSet[i*4+2] = 0;
        hammersleyPointSet[i*4+3] = 0;
    }
    var hammersleyPointSetMap = ctx.createTexture2D(hammersleyPointSet, 1, numSamples, { type: ctx.FLOAT, magFilter: ctx.NEAREST, minFilter: ctx.NEAREST });

    ctx.pushState(ctx.MESH_BIT | ctx.PROGRAM_BIT); //ctx.TEXTURE_BIT
    if (!quadMesh) {
        var quadAttributes = [ { data: quadPositions, location: ctx.ATTRIB_POSITION } ];
        var quadIndices = { data: quadFaces };
        quadMesh = ctx.createMesh(quadAttributes, quadIndices);

        prefilterProgram = ctx.createProgram(VERT, FRAG);
    }
    var numLevels = Math.log(fromCubemap.getWidth())/Math.log(2);
    for(var level=0; level<=numLevels; level++) {
        console.log('prefilter-cubemap', level, level/numLevels*0.99 + 0.01)
        renderToCubemap(ctx, toCubemap, function() {
            ctx.bindTexture(fromCubemap, 0);
            ctx.bindTexture(hammersleyPointSetMap, 1);
            ctx.bindProgram(prefilterProgram);
            prefilterProgram.setUniform('uEnvMap', 0);
            prefilterProgram.setUniform('uHammersleyPointSetMap', 1);
            prefilterProgram.setUniform('uRoughness', Math.min(1.0, level * 0.2));
            ctx.bindMesh(quadMesh);
            ctx.drawMesh();
        }, level);
    }

    ctx.popState(ctx.MESH_BIT | ctx.PROGRAM_BIT); //ctx.TEXTURE_BIT
}

module.exports = prefilterCubemap;
