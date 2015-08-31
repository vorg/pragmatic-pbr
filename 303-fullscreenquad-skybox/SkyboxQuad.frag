#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: texture2DLatLong  = require(../local_modules/glsl-texture2d-latlong)

varying vec3 wcNormal;

uniform sampler2D uReflectionMap;

float flipEvnMap = -1;

void main() {
    vec3 N = normalize(wcNormal);
    N.x *= flipEvnMap;
    gl_FragColor = texture2DLatLong(uReflectionMap, N);
}
