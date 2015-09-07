#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: texture2DEnvLatLong  = require(../local_modules/glsl-texture2d-env-latlong)
#pragma glslify: toGamma  = require(glsl-gamma/out)
#pragma glslify: tonemapReinhard  = require(../local_modules/glsl-tonemap-reinhard)

uniform mat4 uInverseViewMatrix;
uniform sampler2D uEnvMap;
uniform float uAperture;
uniform float uShutterSpeed;
uniform float uIso;
uniform float uMiddleGrey;

varying vec3 ecPosition;
varying vec3 ecNormal;

float flipEnvMap = -1.0;

//White balance middle grey we are targetting for a good scene exposure
//https://en.wikipedia.org/wiki/Middle_gray
const float MIDDLE_GREY = 0.18;

/*
* Get an exposure using the Standard Output Sensitivity method.
* Accepts an additional parameter of the target middle grey.
*/
float getStandardOutputBasedExposure(float aperture,
                                     float shutterSpeed,
                                     float iso)
{
    float q = 0.65;
    //float l_avg = (1000.0f / 65.0f) * sqrt(aperture) / (iso * shutterSpeed);
    float l_avg = (1.0 / q) * sqrt(aperture) / (iso * shutterSpeed);
    //float l_avg = sqrt(aperture) / (iso * shutterSpeed);
    return MIDDLE_GREY / l_avg;
}

void main() {
    vec3 ecEyeDir = normalize(-ecPosition);
    vec3 wcEyeDir = vec3(uInverseViewMatrix * vec4(ecEyeDir, 0.0));
    vec3 wcNormal = vec3(uInverseViewMatrix * vec4(ecNormal, 0.0));

    vec3 reflectionWorld = reflect(-wcEyeDir, normalize(wcNormal));

    //gl_FragColor.rgb = rgbe2rgb(texture2DEnvLatLong(uEnvMap, reflectionWorld));
    //gl_FragColor.rgb *= log(uExposure);
    gl_FragColor.rgb = texture2DEnvLatLong(uEnvMap, reflectionWorld, flipEnvMap).rgb;
    gl_FragColor.rgb *= getStandardOutputBasedExposure(uAperture, uShutterSpeed, uIso);
    //gl_FragColor.rgb *= getStandardOutputBasedExposure(16, uExposure, 100.0, 0.18);
    gl_FragColor.rgb = tonemapReinhard(gl_FragColor.rgb);
    gl_FragColor.rgb = toGamma(gl_FragColor.rgb);

    gl_FragColor.a = 1.0;
}
