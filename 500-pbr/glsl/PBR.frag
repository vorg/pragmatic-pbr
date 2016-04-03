#pragma glslify: envMapEquirect     = require(../../local_modules/glsl-envmap-equirect)
#pragma glslify: envMapCube         = require(../../local_modules/glsl-envmap-cube)
#pragma glslify: toGamma            = require(glsl-gamma/out)
#pragma glslify: toLinear           = require(glsl-gamma/in)
#pragma glslify: tonemapUncharted2  = require(../../local_modules/glsl-tonemap-uncharted2)
#pragma glslify: random             = require(glsl-random)

//Disney
//https://github.com/wdas/brdf/blob/master/src/brdfs/disney.brdf

#ifdef GL_ES
precision highp float;
#endif

#ifdef GL_ES
  #extension GL_EXT_shader_texture_lod : require
#else
  #extension GL_ARB_shader_texture_lod : require
#endif


uniform float uExposure;
uniform float uIor;

varying vec3 vNormalWorld;
varying vec3 vEyeDirWorld;

float saturate(float f) {
    return clamp(f, 0.0, 1.0);
}

uniform vec4 uAlbedoColor; //assumes sRGB color, not linear

vec3 getAlbedo() {
    return toLinear(uAlbedoColor.rgb);
}

uniform float uRoughness;

float getRoughness() {
    return uRoughness;
}

uniform float uMetalness;

float getMetalness() {
    return uMetalness;
}

uniform samplerCube uReflectionMap;

uniform samplerCube uIrradianceMap;

vec3 getIrradiance(vec3 eyeDirWorld, vec3 normalWorld) {
    float maxMipMapLevel = 7.0; //TODO: const
    vec3 reflectionWorld = reflect(-eyeDirWorld, normalWorld);
    vec3 R = envMapCube(reflectionWorld);
    return textureCube(uIrradianceMap, R).rgb;
}

vec3 EnvBRDFApprox( vec3 SpecularColor, float Roughness, float NoV ) {
    const vec4 c0 = vec4(-1, -0.0275, -0.572, 0.022 );
    const vec4 c1 = vec4( 1, 0.0425, 1.04, -0.04 );
    vec4 r = Roughness * c0 + c1;
    float a004 = min( r.x * r.x, exp2( -9.28 * NoV ) ) * r.x + r.y;
    vec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;
    return SpecularColor * AB.x + AB.y;
}

vec3 getPrefilteredReflection(vec3 eyeDirWorld, vec3 normalWorld, float roughness) {
    float maxMipMapLevel = 5; //TODO: const
    vec3 reflectionWorld = reflect(-eyeDirWorld, normalWorld);
    //vec3 R = envMapCube(data.normalWorld);
    vec3 R = envMapCube(reflectionWorld);
    float lod = roughness * maxMipMapLevel;
    float upLod = floor(lod);
    float downLod = ceil(lod);
    //vec4 a = textureCubeLod(reflectionMap, fixSeams(reflectionWorld, upLod), upLod);
    //vec4 b = textureCubeLod(reflectionMap, fixSeams(reflectionWorld, downLod), downLod);
    vec3 a = textureCubeLod(uReflectionMap, R, upLod).rgb;
    vec3 b = textureCubeLod(uReflectionMap, R, downLod).rgb;
    return mix(a, b, lod - upLod);
}

varying vec3 vPositionView;
uniform mat4 uInverseViewMatrix;

void main() {
    vec3 normalWorld = normalize(vNormalWorld);
    vec3 eyeDirWorld = normalize(vEyeDirWorld);

    vec3 albedo = getAlbedo();
    float roughness = getRoughness();
    float metalness = getMetalness();
    vec3 irradianceColor = getIrradiance(eyeDirWorld, normalWorld);

    vec3 reflectionColor = getPrefilteredReflection(eyeDirWorld, normalWorld, roughness);

    vec3 F0 = vec3(abs((1.0 - uIor) / (1.0 + uIor)));
    F0 = F0 * F0;
    //F0 = vec3(0.04); //0.04 is default for non-metals in UE4
    F0 = mix(F0, albedo, metalness);

    float NdotV = saturate( dot( normalWorld, eyeDirWorld ) );
    vec3 reflectance = EnvBRDFApprox( F0, roughness, NdotV );

    vec3 diffuseColor = albedo * (1.0 - metalness);

    //TODO: No kd? so not really energy conserving
    //we could use disney brdf for irradiance map to compensate for that like in Frostbite
    vec3 color = diffuseColor * irradianceColor + reflectionColor * reflectance;

    color *= uExposure;

    color = tonemapUncharted2(color);

    color = toGamma(color);

    gl_FragColor.rgb = color;
    gl_FragColor.a = 1.0;

}
