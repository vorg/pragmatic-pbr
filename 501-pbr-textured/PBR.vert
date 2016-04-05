attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord0;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat3 uNormalMatrix;
uniform mat4 uInverseViewMatrix;

varying vec3 vNormalWorld;
varying vec3 vEyeDirWorld;
varying vec2 vTexCord0;

void main() {
    vec3 positionView = vec3(uViewMatrix * uModelMatrix * vec4(aPosition, 1.0));

    vec3 normalView = vec3(uNormalMatrix * aNormal);
    vNormalWorld = vec3(uInverseViewMatrix * vec4(normalView, 0.0));
    vNormalWorld = aNormal;

    vec3 eyeDirView = normalize(vec3(0.0, 0.0, 0.0) - positionView);
    vEyeDirWorld = vec3(uInverseViewMatrix * vec4(eyeDirView, 0.0));

    gl_Position = uProjectionMatrix * vec4(positionView, 1.0);

    vTexCord0 = aTexCoord0;
}
