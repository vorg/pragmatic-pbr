#pragma glslify: envMapEquirect  = require(../../local_modules/glsl-envmap-equirect)
#pragma glslify: envMapCube      = require(../../local_modules/glsl-envmap-cube)
#pragma glslify: toGamma  = require(glsl-gamma/out)
#pragma glslify: toLinear = require(glsl-gamma/in)
#pragma glslify: tonemapUncharted2  = require(../../local_modules/glsl-tonemap-uncharted2)

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

uniform mat4 uInverseViewMatrix;
uniform float uExposure;

uniform vec3 uLightPos;
uniform vec4 uLightColor;

varying vec3 vPositionWorld;
varying vec3 vPositionView;
varying vec3 vNormalWorld;
varying vec3 vNormalView;
varying vec2 vTexCoord;

varying vec3 vLightPosView;

struct FragData {
  vec3 color;
  vec3 albedo;
  float opacity;
  float roughness;
  float metalness;
  vec3 specularity;
  vec3 positionWorld;
  vec3 positionView;
  vec3 normalWorld;
  vec3 normalView;
  vec2 texCoord;
  vec3 eyePosView;
  vec3 eyeDirWorld;
  vec3 eyeDirView;
  vec3 lightColor;
  float lightAtten;
  vec3 lightPosView;
  vec3 lightPosWorld;
  vec3 lightDirView;
  vec3 lightDirWorld;
  vec3 reflectionColor;
  vec3 irradianceColor;
  float exposure;
};

uniform vec4 uAlbedoColor; //assumes sRGB color, not linear

vec3 getAlbedo(inout FragData data) {
    return toLinear(uAlbedoColor.rgb);
}

float lambert(vec3 surfaceNormal, vec3 lightDir) {
    return max(0.0, dot(surfaceNormal, lightDir));
}

float getLightDiffuse(inout FragData data) {
    return lambert(data.normalView, data.lightDirView);
}

float phong(vec3 lightDir, vec3 eyeDir, vec3 normal) {
    vec3 R = reflect(-lightDir, normal);
    return dot(R, eyeDir);
}

float getLightSpecular(inout FragData data) {
    float glossiness = 1.0 - data.roughness;
    float specPower = pow(2.0, glossiness * 11.0);

    return pow(max(0.0, phong(data.lightDirView, data.eyeDirView, data.normalView)), specPower);
}

uniform float uRoughness;

float getRoughness(inout FragData data) {
    return uRoughness;
}

uniform float uMetalness;

float getMetalness(inout FragData data) {
    return uMetalness;
}

//Schlick's approximation TODO: verify
vec3 getFresnel(inout FragData data) {
    float glossiness = 1.0 - data.roughness;
    float NdotV = max(0.0, dot(data.normalView, data.eyeDirView));
    float d = 1.0 - NdotV;
    float d2 = d * d;
    float fresnel = d2 * d2 * d * glossiness; //TODO: glossiness^2 like in Unreal Engine?
    return (1.0 - data.specularity) * fresnel;
}

#ifdef REFLECTION_MAP_CUBE
    uniform samplerCube uReflectionMap;

    vec3 getReflection(inout FragData data) {
        float maxMipMapLevel = 7.0; //TODO: const
        vec3 reflectionWorld = reflect(-data.eyeDirWorld, data.normalWorld);
        vec3 R = envMapCube(reflectionWorld);
        float k = 1.0 - (1.0 - data.roughness) * (1.0 - data.roughness);
        float lod = k * maxMipMapLevel;
        float upLod = floor(lod);
        float downLod = ceil(lod);
        //vec4 a = textureCubeLod(reflectionMap, fixSeams(reflectionWorld, upLod), upLod);
        //vec4 b = textureCubeLod(reflectionMap, fixSeams(reflectionWorld, downLod), downLod);
        vec3 a = textureCubeLod(uReflectionMap, R, upLod).rgb;
        vec3 b = textureCubeLod(uReflectionMap, R, downLod).rgb;
        return mix(a, b, lod - upLod);
        //return textureCubeLod(uReflectionMap, , data.roughness * 8.0).rgb;
    }
#else
    uniform sampler2D uReflectionMap;

    vec3 getReflection(inout FragData data) {
        vec3 reflectionWorld = reflect(-data.eyeDirWorld, data.normalWorld);
        return texture2D(uReflectionMap, envMapEquirect(reflectionWorld)).rgb;
    }
#endif

#ifdef IRRADIANCE_MAP_CUBE
    uniform samplerCube uIrradianceMap;

    vec3 getIrradiance(inout FragData data) {
        float maxMipMapLevel = 7.0; //TODO: const
        vec3 reflectionWorld = reflect(-data.eyeDirWorld, data.normalWorld);
        vec3 R = envMapCube(reflectionWorld);
        return textureCube(uIrradianceMap, R).rgb;
    }
#else
    uniform sampler2D uReflectionMap;

    vec3 getIrradiance(inout FragData data) {
        vec3 reflectionWorld = reflect(-data.eyeDirWorld, data.normalWorld);
        return texture2D(uIrradianceMap, envMapEquirect(reflectionWorld)).rgb;
    }
#endif

void main() {
    FragData data;
    data.color = vec3(0.0);
    data.albedo = vec3(0.0);
    data.opacity = 1.0;
    data.positionWorld = vPositionWorld;
    data.positionView = vPositionView;
    data.normalWorld = normalize(vNormalWorld);
    data.normalView = normalize(vNormalView);
    data.texCoord = vTexCoord;
    data.eyePosView = vec3(0.0, 0.0, 0.0);
    data.eyeDirView = normalize(data.eyePosView - data.positionView);
    data.eyeDirWorld = vec3(uInverseViewMatrix * vec4(data.eyeDirView, 0.0));
    data.lightAtten = 1.0;
    data.lightColor = toLinear(uLightColor.rgb);
    data.lightPosWorld = uLightPos;
    data.lightPosView = vLightPosView;
    data.lightDirWorld = normalize(data.lightPosWorld - data.positionWorld);
    data.lightDirView = normalize(data.lightPosView - data.positionView);
    data.reflectionColor = vec3(0.0);
    data.exposure = uExposure;

    data.albedo = getAlbedo(data);
    data.lightAtten = getLightDiffuse(data);
    data.roughness = getRoughness(data);
    data.metalness = getMetalness(data);

    //TODO: figure out specularity color for diaelectricts with small metalness
    data.specularity = toLinear(vec3(0.04)); //TODO: 0.04 = plastic, is this gamma or linear?
    if (data.metalness == 1.0) {
        data.specularity = data.albedo;
        data.albedo = vec3(0.0); //TODO: metals don't have albedo, what about irradiance?
    }

    //TODO: reflectance?

    vec3 fresnel = getFresnel(data);
    data.specularity += fresnel;

    vec3 lightDiffuse = data.lightAtten * data.albedo * uLightColor.rgb; //TODO: remove albedo from here?
    vec3 lightSpecular = getLightSpecular(data) * uLightColor.rgb;

    data.irradianceColor = getIrradiance(data);
    data.reflectionColor = getReflection(data);

    data.color = data.albedo * data.irradianceColor; //TODO: multiply by albedo?
    //? data.color += data.albedo * data.irradianceColor * (1.0 - data.specularity);\n'

    //TODO: verify that
    //mixing diffuse and specular according to specularity for energy conservation
    data.color += mix(lightDiffuse, lightSpecular, data.specularity);

    data.color += data.specularity * data.reflectionColor;//TODO: is specular reflection shadowed by NdotL?

    data.color *= uExposure;

#ifdef USE_TONEMAP
    data.color = tonemapUncharted2(data.color);
#endif

    data.color = toGamma(data.color);

    gl_FragColor.rgb = data.color;
    gl_FragColor.a = data.opacity;

    #ifdef SHOW_NORMALS
        gl_FragColor.rgb = data.normalWorld * 0.5 + 0.5;
    #endif

    #ifdef SHOW_TEX_COORDS
        gl_FragColor.rgb = vec3(data.texCoord, 0.0);
    #endif

    #ifdef SHOW_FRESNEL
        gl_FragColor.rgb = fresnel;
    #endif
/*
    gl_FragColor.rgb = lightDiffuse;

*/
}
