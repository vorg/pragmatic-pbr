#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: textureCubeEnv  = require(../local_modules/glsl-textureCube-env)

uniform mat4 uInverseViewMatrix;
uniform samplerCube uEnvMap;

varying vec3 ecPosition;
varying vec3 ecNormal;

//most cubemaps are in Renderman / DirectX format which is left handed while OpenGL is right handed
//so we need to flip X axis in OpenGL/WebGL
float flipEnvMap = -1.0;

void main() {
    vec3 ecEyeDir = normalize(-ecPosition);
    vec3 wcEyeDir = vec3(uInverseViewMatrix * vec4(ecEyeDir, 0.0));
    vec3 wcNormal = vec3(uInverseViewMatrix * vec4(ecNormal, 0.0));

    vec3 reflectionWorld = reflect(-wcEyeDir, normalize(wcNormal));
    gl_FragColor = textureCubeEnv(uEnvMap, reflectionWorld, flipEnvMap);
}
