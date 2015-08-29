#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: texture2DLatLong  = require(../local_modules/glsl-texture2d-latlong)
#pragma glslify: rgbe2rgb  = require(../local_modules/glsl-rgbe2rgb)
#pragma glslify: toGamma  = require(glsl-gamma/out)

uniform mat4 uInvViewMatrix;
uniform sampler2D uReflectionMap;
uniform float uExposure;
varying vec3 ecPosition;
varying vec3 ecNormal;


void main() {
    vec3 ecEyeDir = normalize(-ecPosition);
    vec3 wcEyeDir = vec3(uInvViewMatrix * vec4(ecEyeDir, 0.0));
    vec3 wcNormal = vec3(uInvViewMatrix * vec4(ecNormal, 0.0));

    vec3 reflectionWorld = reflect(-wcEyeDir, normalize(wcNormal));

    gl_FragColor.rgb = rgbe2rgb(texture2DLatLong(uReflectionMap, reflectionWorld));
    gl_FragColor.rgb *= uExposure;
    //gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    gl_FragColor.a = 1.0;
}
