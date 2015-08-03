//vertex position in the model space
attribute vec4 aPosition;
//vertex normal in the model space
attribute vec3 aNormal;

//current transformation matrices coming from the Context
uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat3 uNormalMatrix;

//user supplied light position
uniform vec3 uLightPos;

//vertex position in the eye coordinates (view space)
varying vec3 ecPosition;
//light position in the eye coordinates (view space)
varying vec3 ecLightPos;
//normal in the eye coordinates (view space)
varying vec3 ecNormal;

void main() {
    //transform vertex into the eye space
    vec4 pos = uViewMatrix * uModelMatrix * aPosition;
    ecPosition = pos.xyz;
    ecNormal = uNormalMatrix * aNormal;

    ecLightPos = vec3(uViewMatrix * uModelMatrix * vec4(uLightPos, 1.0));

    //project the vertex, the rest is handled by WebGL
    gl_Position = uProjectionMatrix * pos;
}
