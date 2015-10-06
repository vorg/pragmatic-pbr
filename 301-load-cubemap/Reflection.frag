#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: envMapCube  = require(../local_modules/glsl-envmap-cube)

uniform mat4 uInverseViewMatrix;
uniform samplerCube uEnvMap;

varying vec3 ecPosition;
varying vec3 ecNormal;

void main() {
    vec3 ecEyeDir = normalize(-ecPosition);
    vec3 wcEyeDir = vec3(uInverseViewMatrix * vec4(ecEyeDir, 0.0));
    vec3 wcNormal = vec3(uInverseViewMatrix * vec4(ecNormal, 0.0));

    vec3 reflectionWorld = reflect(-wcEyeDir, normalize(wcNormal));
    gl_FragColor = textureCube(uEnvMap, envMapCube(reflectionWorld));
}
