#pragma glslify: envMapEquirect  = require(../../local_modules/glsl-envmap-equirect)
#pragma glslify: toGamma  = require(glsl-gamma/out)
#pragma glslify: tonemapUncharted2  = require(../../local_modules/glsl-tonemap-uncharted2)

uniform mat4 uInverseViewMatrix;
uniform float uRoughness;
uniform float uExposure;
uniform sampler2D uEnvMap;

varying vec3 ecPosition;
varying vec3 ecNormal;
varying vec3 ecLightPosition;




void main() {
    vec3 ecEyeDir = normalize(-ecPosition);
    vec3 wcEyeDir = vec3(uInverseViewMatrix * vec4(ecEyeDir, 0.0));
    vec3 wcNormal = vec3(uInverseViewMatrix * vec4(ecNormal, 0.0));

    vec3 reflectionWorld = reflect(-wcEyeDir, normalize(wcNormal));

    gl_FragColor.rgb = vec3(0.0);

    #ifdef USE_SPECULAR
    gl_FragColor.rgb = texture2D(uEnvMap, envMapEquirect(reflectionWorld)).rgb;
    #endif

    gl_FragColor.rgb *= uExposure;
    gl_FragColor.rgb = tonemapUncharted2(gl_FragColor.rgb);
    gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    gl_FragColor.a = 1.0;
}
