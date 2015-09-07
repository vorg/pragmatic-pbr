#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: texture2DEnvLatLong  = require(../local_modules/glsl-texture2d-env-latlong)
#pragma glslify: toGamma  = require(glsl-gamma/out)

uniform sampler2D uEnvMap;
uniform bool uCorrectGamma;

varying vec3 wcNormal;

float flipEvnMap = -1.0;

void main() {
    vec3 N = normalize(wcNormal);
    gl_FragColor.rgb = texture2DEnvLatLong(uEnvMap, N, flipEvnMap).rgb;

    if (uCorrectGamma) {
        gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    }

    gl_FragColor.a = 1.0;
}