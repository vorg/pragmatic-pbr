#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: envMapEquirect  = require(../local_modules/glsl-envmap-equirect)

varying vec3 wcNormal;

uniform sampler2D uEnvMap;

void main() {
    gl_FragColor = texture2D(uEnvMap, envMapEquirect(normalize(wcNormal)));
}
