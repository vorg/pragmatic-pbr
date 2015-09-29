#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: textureCubeEnv  = require(../local_modules/glsl-textureCube-env)

varying vec3 wcNormal;

uniform samplerCube uEnvMap;

float flipEnvMap = -1.0;

void main() {
    gl_FragColor = textureCubeEnv(uEnvMap, normalize(wcNormal), flipEnvMap);
}
