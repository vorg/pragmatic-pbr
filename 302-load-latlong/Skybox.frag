#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: texture2DLatLong  = require(../local_modules/glsl-texture2d-latlong)

varying vec3 vNormal;

uniform sampler2D uReflectionMap;

float flipEnvMap = -1.0;

void main() {
    vec3 N = normalize(vNormal);
    N.x *= flipEnvMap;
    gl_FragColor = texture2DLatLong(uReflectionMap, N);
}
