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

//Based on Coding Labs and Graphics Rants
float chiGGX(float v) {
    return v > 0 ? 1 : 0;
}

float saturate(float f) {
    return clamp(f, 0.0, 1.0);
}

//Based on Coding Labs and Graphics Rants
float GGX_Distribution(vec3 n, vec3 h, float alpha) {
    float NoH = dot(n,h);
    float alpha2 = alpha * alpha;
    float NoH2 = NoH * NoH;
    float den = NoH2 * alpha2 + (1.0 - NoH2);
    //chiGGX removed to follow Graphics Rants, will get away with NdotL anyway
    //return (chiGGX(NoH) * alpha2) / ( PI * den * den );
    return (alpha2) / ( PI * den * den );
}

//TODO: doesn't seem to work / do anything
//Based on Coding Labs
float GGX_PartialGeometryTerm(vec3 v, vec3 n, vec3 h, float alpha)
{
    float VoH2 = saturate(dot(v,h));
    float chi = chiGGX( VoH2 / saturate(dot(v,n)) );
    VoH2 = VoH2 * VoH2;
    float tan2 = ( 1 - VoH2 ) / VoH2;
    //return chi / (1 + tan2);
    //return ( 1 + sqrt( 1 + alpha * alpha * tan2 ));
    return (chi * 2) / ( 1 + sqrt( 1 + alpha * alpha * tan2 ) );
}

vec3 Fresnel_Schlick(float cosT, vec3 F0)
{
  return F0 + (1-F0) * pow( 1 - cosT, 5);
}

/*
float3 GGX_Specular( TextureCube SpecularEnvmap, float3 normal, float3 viewVector, float roughness, float3 F0, out float3 kS )
{
     float3 reflectionVector = reflect(-viewVector, normal);
     float3x3 worldFrame = GenerateFrame(reflectionVector);
     float3 radiance = 0;
     float  NoV = saturate(dot(normal, viewVector));
     for(int i = 0; i < SamplesCount; ++i)
     {
         // Generate a sample vector in some local space
         float3 sampleVector = GenerateGGXsampleVector(i, SamplesCount, roughness);
         // Convert the vector in world space
         sampleVector = normalize( mul( sampleVector, worldFrame ) );
         // Calculate the half vector
         float3 halfVector = normalize(sampleVector + viewVector);
         float cosT = saturatedDot( sampleVector, normal );
         float sinT = sqrt( 1 - cosT * cosT);
         // Calculate fresnel
         float3 fresnel = Fresnel_Schlick( saturate(dot( halfVector, viewVector )), F0 );
         // Geometry term
         float geometry = GGX_PartialGeometryTerm(viewVector, normal, halfVector, roughness) * GGX_PartialGeometryTerm(sampleVector, normal, halfVector, roughness);
         // Calculate the Cook-Torrance denominator
         float denominator = saturate( 4 * (NoV * saturate(dot(halfVector, normal)) + 0.05) );
         kS += fresnel;
         // Accumulate the radiance
         radiance += SpecularEnvmap.SampleLevel( trilinearSampler, sampleVector, ( roughness * mipsCount ) ).rgb * geometry * fresnel * sinT / denominator;
}
     // Scale back for the samples count
     kS = saturate( kS / SamplesCount );
     return radiance / SamplesCount;
}

 */
float getLightSpecular(inout FragData data) {
    float ior = 1.0 + data.roughness;
    vec3 F0 = vec3(abs((1.0 - ior) / (1.0 + ior)));
    F0 = F0 * F0;
    F0 = mix(F0, data.albedo, data.metalness);

    float alpha = data.roughness * data.roughness;
    vec3 n = data.normalWorld;
    vec3 l = normalize(data.lightDirWorld);
    vec3 v = normalize(data.eyeDirWorld);
    vec3 h = normalize(v + l);
    float NdotL = saturate(dot(n, l));
    float HdotV = saturate(dot(h, v));
    float NoV = saturate(dot(n, v));
    float NoL = saturate(dot(n, l));
    float NoH = saturate(dot(n, h));
    float D = GGX_Distribution(n, h, alpha);
    float G = GGX_PartialGeometryTerm(v, n, h, alpha);
    float f = Fresnel_Schlick(dot(h, v), F0).r;
    //float denom = saturate( 4 * (NoV * NoL + 0.01) );
    float denom = saturate( 4 * (NoV * NoH + 0.01) );

    //float base = 1 - dot(v,h);
    //float exponential = pow( base, 5.0);
    //f = (exponential + F0.r * (1.0 - exponential));

    vec3 sampleVector = v;
    vec3 halfVector = normalize(sampleVector + v);
    float cosT = saturate(dot( sampleVector, n ));
    float sinT = sqrt( 1 - cosT * cosT);
    vec3 fresnel = Fresnel_Schlick( saturate(dot( h, v )), F0 );
    float geometry = GGX_PartialGeometryTerm(v, n, h, data.roughness) * GGX_PartialGeometryTerm(sampleVector, n, h, data.roughness);
    float denominator = saturate( 4 * (NoV * saturate(dot(h, n)) + 0.05) );
    //return 1 / denom;
    return f;
    return NdotL * D * f * G / denom;
    //return NdotL * geometry * fresnel.r * sinT / denominator;
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

    //TMP data.color = data.irradianceColor;
    data.color = vec3(getLightSpecular(data));
    //vec3 l = normalize(reflect(-data.eyeDirView, data.normalView));
    //vec3 h = normalize(data.eyeDirView + l);
    vec3 n = data.normalView;
    vec3 l = normalize(data.lightDirView);
    vec3 v = normalize(data.eyeDirView);
    vec3 h = normalize(v + l);
    float ior = 1.0 + data.metalness;
    vec3 F0 = vec3(abs((1.0 - ior) / (1.0 + ior)));
    F0 = F0 * F0;
    float VdotH = saturate(dot(v, h));
    float NdotL = saturate(dot(n, l));
    float NdotH = saturate(dot(n, h));
    float NdotV = saturate(dot(n, v));
    data.color = data.reflectionColor * NdotL * Fresnel_Schlick(VdotH, F0);
    float alpha = data.roughness * data.roughness;
    float D = GGX_Distribution(n, h, alpha);
    float G = GGX_PartialGeometryTerm(v, n, h, alpha);
    vec3 F = Fresnel_Schlick(VdotH, F0); //VdotH
    float denom = saturate( 4 * (NdotV * NdotH + 0.01) );
    vec3 indirectSpecular = NdotL * D * G * F / denom;
    data.color = indirectSpecular;
    //data.color = Fresnel_Schlick(saturate(dot(n,l)), F0);
    //data.color = vec3(VdotH);
    //
    vec3 rl = normalize(reflect(-data.eyeDirView, data.normalView));
    vec3 rh = normalize(v + rl);
    float VdotRH = saturate(dot(v, rh));
    float NdotRH = saturate(dot(v, rh));
    float NdotRL = saturate(dot(n, rl));
    float rD = GGX_Distribution(n, rh, alpha);
    float rG = GGX_PartialGeometryTerm(v, n, rh, alpha);
    //vec3 rF = Fresnel_Schlick(NdotV, F0);
    vec3 rF = Fresnel_Schlick(VdotRH, F0);
    float rdenom = ( 4 * (NdotV * NdotRH + 0.01) );
    //data.color = data.reflectionColor * rF;
    //data.color = NdotRL * rD * rG * rF / rdenom;
    //data.color = data.reflectionColor * getFresnel(data);
    data.color *= data.reflectionColor;

    data.color *= uExposure;


    #ifdef SHOW_NORMALS
        data.color = data.normalWorld * 0.5 + 0.5;
    #endif

    #ifdef SHOW_TEX_COORDS
        data.color = vec3(data.texCoord, 0.0);
    #endif

    #ifdef SHOW_FRESNEL
        data.color = rF * data.reflectionColor;
    #endif

    #ifdef SHOW_IRRADIANCE
        data.color = data.irradianceColor;
    #endif

    #ifdef SHOW_INDIRECT_SPECULAR
        data.color = indirectSpecular;
    #endif

    #ifdef USE_TONEMAP
        data.color = tonemapUncharted2(data.color);
    #endif

    data.color = toGamma(data.color);

    gl_FragColor.rgb = data.color;
    gl_FragColor.a = data.opacity;

}
