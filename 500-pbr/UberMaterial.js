var glslify        = require('glslify-sync');
var isBrowser      = require('is-browser');
var fs             = require('fs');

var uberShaderVert = glslify(__dirname + '/glsl/UberShader.vert');
var uberShaderFrag = glslify(__dirname + '/glsl/UberShader.frag');

var solidColorVert = glslify(__dirname + '/glsl/SolidColor.vert');
var solidColorFrag = glslify(__dirname + '/glsl/SolidColor.frag');


var TextureCube = require('pex-context/TextureCube');

function UberShader(ctx, uniforms) {
    this.ctx = ctx;
    this.uniforms = Object.assign({
        uRoughness: 0.5,
        uRoughnessParams: { min: 0.01, max: 1 },
        uMetalness: 0.0,
        uMetalnessParams: { min: 0.0, max: 1 },
        uExposure: 0.5,
        uExposureParams: { min: 0.01, max: 2 },
        uLightPos: [10, 10, 0],
        uReflectionMap: null,
        uAlbedoColor: [0,0,0,1],
        uLightColor: [1,1,1,1],
        useSpecular: true,
        useTonemap: true,
        uIor: 1.4

    }, uniforms || {})

    this.name = uniforms.name || 'Uber Shader';

    this.compile();

    if (!isBrowser) {
        this.watch();
    }
}

UberShader.prototype.watch = function() {
    fs.watchFile(__dirname + '/glsl/UberShader.frag', function() {
        this.reload();
    }.bind(this));
}

UberShader.prototype.reload = function() {
    console.log('reloading');
    uberShaderVert = glslify(__dirname + '/glsl/UberShader.vert');
    uberShaderFrag = glslify(__dirname + '/glsl/UberShader.frag');
    this.compile();
}

UberShader.prototype.compile = function() {
    var ctx = this.ctx;

    var uniforms = this.uniforms;

    var flags = [];
    //if (uniforms.useSpecular) {
    //    flags.push('#define USE_SPECULAR');
    //}
    if (uniforms.uReflectionMap instanceof TextureCube) {
        flags.push('#define REFLECTION_MAP_CUBE');
    }
    if (uniforms.uIrradianceMap instanceof TextureCube) {
        flags.push('#define IRRADIANCE_MAP_CUBE');
    }
    if (uniforms.useTonemap) {
        flags.push('#define USE_TONEMAP');
    }
    if (uniforms.showNormals) {
        flags.push('#define SHOW_NORMALS');
    }
    if (uniforms.showTexCoords) {
        flags.push('#define SHOW_TEX_COORDS');
    }
    if (uniforms.showFresnel) {
        flags.push('#define SHOW_FRESNEL');
    }
    if (uniforms.showIrradiance) {
        flags.push('#define SHOW_IRRADIANCE');
    }
    if (uniforms.showIndirectSpecular) {
        flags.push('#define SHOW_INDIRECT_SPECULAR');
    }
    //if (Array.isArray(uniforms.uAlbedo)) {
    //    flags.push('#define ALBEDO_CONST');
    //}
    flags = flags.join('\n') + '\n';

    try {
        this.program = ctx.createProgram(uberShaderVert, flags + uberShaderFrag);
    }
    catch(e) {
        console.log(e);
        this.program = ctx.createProgram(solidColorVert, solidColorFrag);
        this.program.setUniform('uColor', [1,0,0,1]);
    }
}

module.exports = UberShader;
