#ifdef GL_ES
precision highp float;
#endif

#pragma glslify: lambert   = require(glsl-diffuse-lambert)
#pragma glslify: toLinear = require(glsl-gamma/in)
#pragma glslify: toGamma  = require(glsl-gamma/out)

//vec3 toLinear(vec3 v) { return v; }
//vec4 toLinear(vec4 v) { return v; }
//vec4 toGamma(vec4 v) { return v; }

varying vec3 ecNormal;
varying vec3 ecLight1;
varying vec3 ecLight2;
varying vec3 ecPosition;

uniform vec4 uLightColor1;
uniform vec4 uLightColor2;

uniform bool uLinearSpace;
uniform bool uCorrectGamma;

float PI = 3.14159265;

void main() {
    vec3 N = normalize(ecNormal);
    vec3 L1 = normalize(ecLight1 - ecPosition);
    vec3 L2 = normalize(ecLight2 - ecPosition);
    vec3 V = normalize(-ecPosition);
    float diffuse1 = lambert(L1, N);
    float diffuse2 = lambert(L2, N);

    vec3 lightColor1 = uLinearSpace ? toLinear(uLightColor1.rgb) : uLightColor1.rgb;
    vec3 lightColor2 = uLinearSpace ? toLinear(uLightColor2.rgb) : uLightColor2.rgb;

    //albedo
    vec4 baseColor = uLinearSpace ? toLinear(vec4(1.0)) : vec4(1.0);

    vec4 finalColor = vec4(0.0, 0.0, 0.0, 1.0);
    finalColor.rgb = baseColor.rgb * diffuse1 * lightColor1 + baseColor.rgb * diffuse2 * lightColor2;
    gl_FragColor = uCorrectGamma ? toGamma(finalColor) : finalColor;
}
