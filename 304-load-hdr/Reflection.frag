#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: texture2DEnvLatLong  = require(../local_modules/glsl-texture2d-env-latlong)
#pragma glslify: rgbe2rgb  = require(../local_modules/glsl-rgbe2rgb)
#pragma glslify: toGamma  = require(glsl-gamma/out)

uniform mat4 uInverseViewMatrix;
uniform sampler2D uEnvMap;

varying vec3 ecPosition;
varying vec3 ecNormal;

float flipEnvMap = -1.0;

void main() {
    vec3 ecEyeDir = normalize(-ecPosition);
    vec3 wcEyeDir = vec3(uInverseViewMatrix * vec4(ecEyeDir, 0.0));
    vec3 wcNormal = vec3(uInverseViewMatrix * vec4(ecNormal, 0.0));

    vec3 reflectionWorld = reflect(-wcEyeDir, normalize(wcNormal));

    gl_FragColor.rgb = rgbe2rgb(texture2DEnvLatLong(uEnvMap, reflectionWorld, flipEnvMap));
    gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    gl_FragColor.a = 1.0;
}
