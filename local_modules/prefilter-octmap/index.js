var glslifySync = require('glslify-sync');
var hammersley = require('hammersley');

var VERT = glslifySync(__dirname + '/glsl/PrefilterOctmap.vert');
var FRAG = glslifySync(__dirname + '/glsl/PrefilterOctmap.frag');

var fbo = null
var mesh = null
var program = null
var hammersleyPointSetMap = null

function prefilterOctmap(ctx, fromOctmap, toOctmapAtlas) {
    var highQuality = true;
    var numSamples = highQuality ? 1024 : 128;

    if (!fbo) {
        fbo = ctx.createFramebuffer()

        var positions = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
        var uvs = [[0,0], [1,0], [1,1], [0,1]]
        var indices = [[0, 1, 2], [0, 2, 3]]

        mesh = ctx.createMesh([
            { data: positions, location: ctx.ATTRIB_POSITION },
            { data: uvs, location: ctx.ATTRIB_TEX_COORD_0 }
        ], { data: indices }, ctx.TRIANGLES)

        program = ctx.createProgram(VERT, FRAG)

        var hammersleyPointSet = new Float32Array(4 * numSamples);
        for(var i=0; i<numSamples; i++) {
            var p = hammersley(i, numSamples)
            hammersleyPointSet[i*4]   = p[0];
            hammersleyPointSet[i*4+1] = p[1];
            hammersleyPointSet[i*4+2] = 0;
            hammersleyPointSet[i*4+3] = 0;
        }
        hammersleyPointSetMap = ctx.createTexture2D(hammersleyPointSet, 1, numSamples, { type: ctx.FLOAT, magFilter: ctx.NEAREST, minFilter: ctx.NEAREST });
    }

    ctx.pushState(ctx.FRAMEBUFFER_BIT | ctx.MESH_BIT | ctx.PROGRAM_BIT | ctx.VIEWPORT_BIT | ctx.TEXTURE_BIT | ctx.COLOR_BIT)
    ctx.bindFramebuffer(fbo)
    fbo.setColorAttachment(0, toOctmapAtlas.getTarget(), toOctmapAtlas.getHandle())
    ctx.bindTexture(fromOctmap, 0)
    ctx.bindProgram(program)
    ctx.bindMesh(mesh)
    ctx.setClearColor(0, 0, 0, 1)
    ctx.clear(ctx.COLOR_BIT)

    var numLevels = Math.min(6, Math.log2(fromOctmap.getWidth()))
    console.log('prefilterOctmap width', fromOctmap.getWidth(), 'numLevels', numLevels)
    var dy = 0;
    var w = fromOctmap.getWidth()
    var h = fromOctmap.getHeight()
    for(var i = 0; i<numLevels; i++) {
        var roughness = i * 0.2;
        console.log('prefilterOctmap', 'level', i, 'w', w, 'roughness', roughness);
        ctx.setViewport(0, dy, w, h)
        program.setUniform('uOctMap', 0);
        program.setUniform('uHammersleyPointSetMap', 1);
        program.setUniform('uNumSamples', numSamples);
        program.setUniform('uRoughness', roughness);
        ctx.drawMesh()
        dy += h
        w >>= 1
        h >>= 1
    }

    // program.setUniform('uOctmap', 0)
    ctx.popState()
}

module.exports = prefilterOctmap;
