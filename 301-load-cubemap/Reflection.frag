#ifdef GL_ES
precision highp float;
#endif

//envMapCube samples a cubemap envmap by mirroring the sampling ray along X axis
#pragma glslify: envMapCube  = require(../local_modules/glsl-envmap-cube)

uniform mat4 uInverseViewMatrix;
uniform samplerCube uEnvMap;

varying vec3 ecPosition;
varying vec3 ecNormal;

void main() {
    //direction towards they eye (camera) in the view (eye) space
    vec3 ecEyeDir = normalize(-ecPosition);
    //direction towards the camera in the world space
    vec3 wcEyeDir = vec3(uInverseViewMatrix * vec4(ecEyeDir, 0.0));
    //surface normal in the world space
    vec3 wcNormal = vec3(uInverseViewMatrix * vec4(ecNormal, 0.0));

    //reflection vector in the world space. We negate wcEyeDir as the reflect function expect incident vector pointing towards the surface
    vec3 reflectionWorld = reflect(-wcEyeDir, normalize(wcNormal));

    gl_FragColor = textureCube(uEnvMap, envMapCube(reflectionWorld));
}
