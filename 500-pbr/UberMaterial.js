var glslify      = require('glslify-sync');

var uberShaderVert = glslify(__dirname + '/glsl/UberShader.vert');
var uberShaderFrag = glslify(__dirname + '/glsl/UberShader.frag');

function UberShader(ctx, uniforms) {
    this.ctx = ctx;
    this.name = 'Uber Shader';

    this.uniforms = uniforms = Object.assign({
        uRoughness: 0.5,
        uRoughnessParams: { min: 0.01, max: 1 },
        uExposure: 0.5,
        uExposureParams: { min: 0.01, max: 2 },
        uLightPosition: [10, 10, 0],
        uReflectionMap: null,
        useSpecular: true
    }, uniforms || {})

    var flags = [];
    if (uniforms.useSpecular) {
        flags.push('#define USE_SPECULAR');
    }
    flags = flags.join('\n') + '\n';


    this.program = ctx.createProgram(uberShaderVert, flags + uberShaderFrag);

}

module.exports = UberShader;
