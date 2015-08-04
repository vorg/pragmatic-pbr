attribute vec4 aPosition;
attribute vec3 aNormal;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat3 uNormalMatrix;

uniform vec3 uLightPos;

//vertex position, normal and light position in the eye/view space
varying vec3 ecPosition;
varying vec3 ecNormal;
varying vec3 ecLightPos;

void main() {
    vec4 pos = uViewMatrix * uModelMatrix * aPosition;
    ecPosition = pos.xyz;
    ecNormal = uNormalMatrix * aNormal;

    ecLightPos = vec3(uViewMatrix * uModelMatrix * vec4(uLightPos, 1.0));

    gl_Position = uProjectionMatrix * pos;
}
