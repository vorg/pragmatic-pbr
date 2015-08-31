#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: texture2DEnvLatLong  = require(../local_modules/glsl-texture2d-env-latlong)

varying vec3 wcNormal;

uniform sampler2D uEnvMap;

float flipEvnMap = -1.0;

void main() {
    vec3 N = normalize(wcNormal);
    gl_FragColor = texture2DEnvLatLong(uEnvMap, N, flipEvnMap);
}
