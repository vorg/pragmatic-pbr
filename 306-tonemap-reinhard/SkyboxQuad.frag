#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: envMapEquirect  = require(../local_modules/glsl-envmap-equirect)
#pragma glslify: tonemapReinhard  = require(../local_modules/glsl-tonemap-reinhard)
#pragma glslify: toGamma  = require(glsl-gamma/out)

uniform sampler2D uEnvMap;
uniform bool uCorrectGamma;
uniform bool uTonemap;
uniform float uExposure;

varying vec3 wcNormal;

void main() {
    vec3 N = normalize(wcNormal);
    gl_FragColor.rgb = texture2D(uEnvMap, envMapEquirect(N)).rgb;

    gl_FragColor.rgb *= uExposure;

    if (uTonemap) {
        gl_FragColor.rgb = tonemapReinhard(gl_FragColor.rgb);
    }

    if (uCorrectGamma) {
        gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    }

    gl_FragColor.a = 1.0;
}
