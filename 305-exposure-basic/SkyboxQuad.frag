#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: envMapEquirect  = require(../local_modules/glsl-envmap-equirect)
#pragma glslify: toGamma  = require(glsl-gamma/out)

uniform sampler2D uEnvMap;
uniform bool uCorrectGamma;
uniform float uExposure;

varying vec3 wcNormal;

void main() {
    vec3 N = normalize(wcNormal);
    gl_FragColor.rgb = texture2D(uEnvMap, envMapEquirect(N)).rgb;

    gl_FragColor.rgb *= uExposure;

    if (uCorrectGamma) {
        gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    }

    gl_FragColor.a = 1.0;
}
