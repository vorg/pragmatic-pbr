#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: texture2DLatLong  = require(../local_modules/glsl-texture2d-latlong)

uniform mat4 uInverseViewMatrix;
uniform sampler2D uReflectionMap;

varying vec3 ecPosition;
varying vec3 ecNormal;

float flipEvnMap = -1;

void main() {
    vec3 ecEyeDir = normalize(-ecPosition);
    vec3 wcEyeDir = vec3(uInverseViewMatrix * vec4(ecEyeDir, 0.0));
    vec3 wcNormal = vec3(uInverseViewMatrix * vec4(ecNormal, 0.0));

    vec3 reflectionWorld = reflect(-wcEyeDir, normalize(wcNormal));
    reflectionWorld.x *= flipEvnMap;

    gl_FragColor = texture2DLatLong(uReflectionMap, reflectionWorld);
}
