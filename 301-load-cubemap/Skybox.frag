#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: envMapCube  = require(../local_modules/glsl-envmap-cube)

varying vec3 wcNormal;

uniform samplerCube uEnvMap;

void main() {
    gl_FragColor = textureCube(uEnvMap, envMapCube(normalize(wcNormal)));
}
