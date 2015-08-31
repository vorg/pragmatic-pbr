#ifdef GL_ES
precision highp float;
#endif

varying vec3 vNormal;

uniform samplerCube uReflectionMap;

float flipEnvMap = -1.0;

void main() {
    vec3 N = normalize(vNormal);
    N.x *= flipEnvMap;
    gl_FragColor = textureCube(uReflectionMap, N);
}
