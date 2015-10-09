//Based on http://gamedev.stackexchange.com/questions/60313/implementing-a-skybox-with-glsl-version-330
attribute vec4 aPosition;

#pragma glslify: inverse = require('glsl-inverse')
#pragma glslify: transpose = require('glsl-transpose')

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

uniform mat4 uOrigProjectionMatrix;
uniform mat4 uOrigViewMatrix;

uniform float uFarNearRatio;
uniform vec3 uRightRight;
uniform vec3 uUpTop;
uniform vec3 uFrontNear;
uniform vec3 uCamPosition;

varying vec3 wcNormal;

void main2() {
    mat4 inverseProjection = inverse(uOrigProjectionMatrix);
    mat3 transposedView = transpose(mat3(uOrigViewMatrix));
    vec3 unprojected = (inverseProjection * aPosition).xyz;
    wcNormal = transposedView * unprojected;

    vec3 wcPos = uCamPosition + (uFrontNear + aPosition.x * uRightRight + aPosition.y * uUpTop) * uFarNearRatio;

    gl_Position = uProjectionMatrix * uViewMatrix * vec4(wcPos, 1.0);
}

void main() {
    main2();
    return;
    mat4 inverseProjection = inverse(uProjectionMatrix);
    mat3 inverseModelview = transpose(mat3(uViewMatrix));
    vec3 unprojected = (inverseProjection * aPosition).xyz;
    wcNormal = inverseModelview * unprojected;

    gl_Position = aPosition;
}
