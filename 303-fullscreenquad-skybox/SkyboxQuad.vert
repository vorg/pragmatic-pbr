//Based on http://gamedev.stackexchange.com/questions/60313/implementing-a-skybox-with-glsl-version-330
//
attribute vec4 aPosition;

#pragma glslify: inverse = require('glsl-inverse')
#pragma glslify: transpose = require('glsl-transpose')

uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;

varying vec3 wcNormal;

void main() {
    mat4 inverseProjection = inverse(uProjectionMatrix);
    mat3 inverseModelview = transpose(mat3(uViewMatrix));

    //transform from the normalized device coordinates back to the view space
    vec3 unprojected = (inverseProjection * aPosition).xyz;

    //transfrom from the view space back to the world space
    //and use it as a sampling vector
    wcNormal = inverseModelview * unprojected;

    gl_Position = aPosition;
}
