attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord0;

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform mat3 uNormalMatrix;

uniform vec3 uLightPos;

varying vec3 vPositionWorld;
varying vec3 vPositionView;
varying vec3 vNormalWorld;
varying vec3 vNormalView;
varying vec2 vTexCoord;

varying vec3 vLightPosView;

void main() {
    vPositionWorld = vec3(uModelMatrix * vec4(aPosition, 1.0));
    vPositionView = vec3(uViewMatrix * vec4(vPositionWorld, 1.0));
    vNormalWorld = aNormal; //TODO: this should be transformed by model world matrix
    vNormalView = vec3(uNormalMatrix * aNormal);
    vTexCoord = aTexCoord0;

    vLightPosView = vec3(uViewMatrix * vec4(uLightPos, 1.0));

    gl_Position = uProjectionMatrix * vec4(vPositionView, 1.0);
}
