#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: envMapEquirect  = require(../local_modules/glsl-envmap-equirect)
#pragma glslify: toGamma  = require(glsl-gamma/out)
#pragma glslify: tonemapReinhard  = require(../local_modules/glsl-tonemap-reinhard)
#pragma glslify: tonemapFilmic  = require(../local_modules/glsl-tonemap-filmic)
#pragma glslify: tonemapUncharted2  = require(../local_modules/glsl-tonemap-uncharted2)

uniform mat4 uInverseViewMatrix;
uniform sampler2D uEnvMap;
uniform float uExposure;
uniform float uTonemappingMethod;

uniform sampler2D uFilmLut;

varying vec3 ecPosition;
varying vec3 ecNormal;

float LOG10 = log(10.0);

float log10(float x) {
    return log(x) / LOG10;
}

vec3 log10(vec3 v) {
    return vec3(log10(v.x), log10(v.y), log10(v.z));
}

float saturate(float x) {
    return clamp(x, 0.0, 1.0);
}

vec3 saturate(vec3 v) {
    return vec3(saturate(v.x), saturate(v.y), saturate(v.z));
}

float A = 0.15;
float B = 0.50;
float C = 0.10;
float D = 0.20;
float E = 0.02;
float F = 0.30;
float W = 11.2;

vec3 Uncharted2Tonemap(vec3 x) {
   return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

void main() {
    vec3 ecEyeDir = normalize(-ecPosition);
    vec3 wcEyeDir = vec3(uInverseViewMatrix * vec4(ecEyeDir, 0.0));
    vec3 wcNormal = vec3(uInverseViewMatrix * vec4(ecNormal, 0.0));

    vec3 reflectionWorld = reflect(-wcEyeDir, normalize(wcNormal));

    gl_FragColor.rgb = texture2D(uEnvMap, envMapEquirect(reflectionWorld)).rgb;
    gl_FragColor.rgb *= uExposure;

    if (uTonemappingMethod == 0.0) {
        //no tonemapping
        gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    }
    else if (uTonemappingMethod == 1.0) {
        gl_FragColor.rgb = tonemapReinhard(gl_FragColor.rgb);
        gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    }
    else if (uTonemappingMethod == 2.0) {
        vec3 x = max(vec3(0.0), gl_FragColor.rgb - 0.004);
        gl_FragColor.rgb = (x * (6.2 * x + 0.5)) / (x * (6.2 * x + 1.7) + 0.06);
    }
    else if (uTonemappingMethod == 20.0) {
        vec3 ld = vec3(0.002);
        float linReference = 0.18;
        float logReference = 444.0;
        float logGamma = 0.45;

        vec3 LogColor;
        LogColor.rgb = (log10(0.4*gl_FragColor.rgb/linReference)/ld*logGamma + logReference)/1023.0;
        LogColor.rgb = saturate(LogColor.rgb);

        float FilmLutWidth = 256.0;
        float Padding = 0.5/FilmLutWidth;

        //  apply response lookup and color grading for target display
        vec3 retColor;
        retColor.r = texture2D(uFilmLut, vec2( mix(Padding,1.0-Padding,LogColor.r), 0.5)).r;
        retColor.g = texture2D(uFilmLut, vec2( mix(Padding,1.0-Padding,LogColor.g), 0.5)).r;
        retColor.b = texture2D(uFilmLut, vec2( mix(Padding,1.0-Padding,LogColor.b), 0.5)).r;

        //gl_FragColor.rgb = tonemapFilmic(gl_FragColor.rgb);
        gl_FragColor.rgb = retColor;
    }
    else if (uTonemappingMethod == 3.0) {
        float ExposureBias = 2.0;
        vec3 curr = Uncharted2Tonemap(ExposureBias * gl_FragColor.rgb);

        vec3 whiteScale = 1.0 / Uncharted2Tonemap(vec3(W));
        vec3 color = curr * whiteScale;

        gl_FragColor.rgb = color;
        gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
        //gl_FragColor.rgb = tonemapUncharted2(gl_FragColor.rgb);
    }

    gl_FragColor.a = 1.0;
}
