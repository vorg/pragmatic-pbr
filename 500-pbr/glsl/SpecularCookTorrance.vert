attribute vec4 aPosition;
attribute vec3 aNormal;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat3 uNormalMatrix;

uniform vec3 uLightPosition;

varying vec3 ecPosition;
varying vec3 ecNormal;
varying vec3 ecLightPosition; //this should be computed outside

void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;
    ecPosition = vec3(uViewMatrix * uModelMatrix * aPosition);
    ecLightPosition = vec3(uModelMatrix * vec4(uLightPosition, 1.0));
    ecNormal = uNormalMatrix * aNormal;
}
