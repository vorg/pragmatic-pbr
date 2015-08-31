#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: texture2DEnvLatLong  = require(../local_modules/glsl-texture2d-latlong)

varying vec3 ecNormal;

uniform sampler2D uEnvMap;

float flipEnvMap = -1.0;

void main() {
    gl_FragColor = texture2DEnvLatLong(uEnvMap, normalize(ecNormal), flipEnvMap);
}
