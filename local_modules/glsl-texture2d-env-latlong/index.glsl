#define PI 3.1415926
#define TwoPI (2.0 * PI)

/**
 * Samples equirectangular (lat/long) panorama environment map
 * @param  {sampler2D} envMap - equirectangular (lat/long) panorama texture
 * @param  {vec3} wcNormal - normal in the world coordinate space
 * @param  {float} - flipEnvMap    -1.0 for left handed coorinate system oriented texture (usual case)
 *                                  1.0 for right handed coorinate system oriented texture
 * @return {vec4} - sampledColor
 * @description Based on http://http.developer.nvidia.com/GPUGems/gpugems_ch17.html and http://gl.ict.usc.edu/Data/HighResProbes/
 */
vec4 texture2DEnvLatLong(sampler2D envMap, vec3 wcNormal, float flipEnvMap) {
    float phi = acos(wcNormal.y);
    float theta = atan(flipEnvMap * wcNormal.x, wcNormal.z) + PI;
    vec2 texCoord = vec2(theta / TwoPI, phi / PI);
    return texture2D(envMap, texCoord);
}

#pragma glslify: export(texture2DEnvLatLong)
