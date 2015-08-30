#define PI 3.1415926
#define TwoPI (2.0 * PI)
#define OneOverPI (1.0/PI)
#define OneOverTwoPI (1.0/TwoPI)

//Based on http://http.developer.nvidia.com/GPUGems/gpugems_ch17.html
vec4 texture2DLatLong(sampler2D tex, vec3 N) {
    float theta = acos(N.y);
    float phi = atan(N.z, N.x) + PI;
    vec2 texCoord = vec2(phi, theta) * vec2(OneOverTwoPI, OneOverPI);
    return texture2D(tex, texCoord);
}

#pragma glslify: export(texture2DLatLong)
