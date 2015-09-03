attribute vec4 aPosition;
attribute vec3 aNormal;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat3 uNormalMatrix;

uniform bool uSkybox;

varying vec3 ecPosition;
varying vec3 ecNormal;

void main() {
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aPosition;
    ecPosition = vec3(uViewMatrix * uModelMatrix * aPosition);

    if (uSkybox) {
        ecNormal = vec3(0.0);
    }
    else {
        ecNormal = uNormalMatrix * aNormal;
    }
}
