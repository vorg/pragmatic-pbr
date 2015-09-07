#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: texture2DEnvLatLong  = require(../local_modules/glsl-texture2d-env-latlong)
#pragma glslify: toGamma  = require(glsl-gamma/out)
#pragma glslify: tonemapReinhard  = require(../local_modules/glsl-tonemap-reinhard)

float flipEnvMap = -1.0;

/*
* Get an exposure using the Saturation-based Speed method.
*/
float getSaturationBasedExposure(float aperture,
                                 float shutterSpeed,
                                 float iso)
{
    float l_max = (7800.0 / 65.0) * sqrt(aperture) / (iso * shutterSpeed);
    return 1.0 / l_max;
}

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
    //https://placeholderart.wordpress.com/2014/11/21/implementing-a-physically-based-camera-manual-exposure/
    //https://en.wikipedia.org/wiki/Film_speed#Standard_output_sensitivity_.28SOS.29
    //photometric exposure magic
    //represents the properties of lens
    float q = 0.65;

    //float l_avg = (1000.0f / 65.0f) * sqrt(aperture) / (iso * shutterSpeed);
    float l_avg = (1.0 / q) * sqrt(aperture) / (iso * shutterSpeed);
    //float l_avg = sqrt(aperture) / (iso * shutterSpeed);
    return MIDDLE_GREY / l_avg;
}

varying vec3 vNormal;

uniform sampler2D uEnvMap;
uniform float uAperture;
uniform float uShutterSpeed;
uniform float uIso;

void main() {
    vec3 N = normalize(vNormal);
    //gl_FragColor.rgb = rgbe2rgb(texture2DEnvLatLong(uEnvMap, N));
    //gl_FragColor.rgb *= log(uExposure);
    gl_FragColor.rgb = texture2DEnvLatLong(uEnvMap, N, flipEnvMap).rgb;
    gl_FragColor.rgb *= getStandardOutputBasedExposure(uAperture, uShutterSpeed, uIso);
    //gl_FragColor.rgb *= getStandardOutputBasedExposure(16, uExposure, 100.0, 0.18);
    gl_FragColor.rgb = tonemapReinhard(gl_FragColor.rgb);
    gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    gl_FragColor.a = 1.0;
}
