#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: envMapEquirect  = require(../local_modules/glsl-envmap-equirect)
#pragma glslify: tonemapReinhard  = require(../local_modules/glsl-tonemap-reinhard)
#pragma glslify: toGamma  = require(glsl-gamma/out)

uniform mat4 uInverseViewMatrix;
uniform sampler2D uEnvMap;
uniform bool uCorrectGamma;
uniform bool uTonemap;
uniform float uExposure;

varying vec3 ecPosition;
varying vec3 ecNormal;

void main() {
    vec3 ecEyeDir = normalize(-ecPosition);
    vec3 wcEyeDir = vec3(uInverseViewMatrix * vec4(ecEyeDir, 0.0));
    vec3 wcNormal = vec3(uInverseViewMatrix * vec4(ecNormal, 0.0));

    vec3 reflectionWorld = reflect(-wcEyeDir, normalize(wcNormal));

    gl_FragColor.rgb = texture2D(uEnvMap, envMapEquirect(reflectionWorld)).rgb;

    gl_FragColor.rgb *= uExposure;

    if (uTonemap) {
        gl_FragColor.rgb = tonemapReinhard(gl_FragColor.rgb);
    }

    if (uCorrectGamma) {
        gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    }
    gl_FragColor.a = 1.0;
}
