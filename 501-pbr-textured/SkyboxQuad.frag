#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: envMapCube  = require(../local_modules/glsl-envmap-cube)
#pragma glslify: toGamma  = require(glsl-gamma/out)
#pragma glslify: tonemapUncharted2  = require(../local_modules/glsl-tonemap-uncharted2)

varying vec3 wcNormal;

uniform samplerCube uEnvMap;
uniform float uExposure;

void main() {
    gl_FragColor.rgb = textureCube(uEnvMap, envMapCube(normalize(wcNormal))).rgb;
    gl_FragColor.rgb *= uExposure;

    gl_FragColor.rgb = tonemapUncharted2(gl_FragColor.rgb);
    gl_FragColor.rgb = toGamma(gl_FragColor.rgb);

    gl_FragColor.a = 1.0;
}
