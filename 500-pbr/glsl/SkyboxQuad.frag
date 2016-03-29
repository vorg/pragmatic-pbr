#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: envMapEquirect  = require(../../local_modules/glsl-envmap-equirect)
#pragma glslify: toGamma  = require(glsl-gamma/out)
#pragma glslify: tonemapUncharted2  = require(../../local_modules/glsl-tonemap-uncharted2)

varying vec3 wcNormal;

uniform sampler2D uEnvMap;
uniform float uExposure;

void main() {
    vec3 N = normalize(wcNormal);
    gl_FragColor.rgb = texture2D(uEnvMap, envMapEquirect(N)).rgb;
    gl_FragColor.rgb *= uExposure;

    gl_FragColor.rgb = tonemapUncharted2(gl_FragColor.rgb);
    gl_FragColor.rgb = toGamma(gl_FragColor.rgb);

    gl_FragColor.a = 1.0;
}
