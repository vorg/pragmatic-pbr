#ifdef GL_ES
precision highp float;
#endif

varying vec3 vNormal;

uniform samplerCube uReflectionMap;

void main() {
    vec3 N = normalize(vNormal);
    gl_FragColor = textureCube(uReflectionMap, N);
}
