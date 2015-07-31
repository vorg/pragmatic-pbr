attribute vec4 aPosition;
attribute vec3 aNormal;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat3 uNormalMatrix;

uniform vec3 uLightPos1;
uniform vec3 uLightPos2;

varying vec3 ecNormal;
varying vec3 ecLight1;
varying vec3 ecLight2;
varying vec3 ecPosition;

void main() {
    vec4 pos = uViewMatrix * uModelMatrix * aPosition;
    ecPosition = pos.xyz;
    gl_Position = uProjectionMatrix * pos;
    ecLight1 = vec3(uViewMatrix * uModelMatrix * vec4(uLightPos1, 1.0));
    ecLight2 = vec3(uViewMatrix * uModelMatrix * vec4(uLightPos2, 1.0));
    ecNormal = uNormalMatrix * aNormal;
}
