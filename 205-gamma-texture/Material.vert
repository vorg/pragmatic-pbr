attribute vec4 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord0;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat3 uNormalMatrix;

uniform vec3 uLightPos;

varying vec3 ecPosition;
varying vec3 ecNormal;
varying vec3 ecLightPos;
varying vec2 vTexCoord0;

void main() {
    vec4 pos = uViewMatrix * uModelMatrix * aPosition;
    ecPosition = pos.xyz;
    gl_Position = uProjectionMatrix * pos;
    ecLightPos = vec3(uViewMatrix * uModelMatrix * vec4(uLightPos, 1.0));
    ecNormal = uNormalMatrix * aNormal;
    vTexCoord0 = aTexCoord0;
}
