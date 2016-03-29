#pragma glslify: blinnPhongSpec = require(glsl-specular-phong)

uniform vec3 eyePosition;
uniform vec3 lightPosition;

uniform float uRoughness;
uniform float uN0;

varying vec3 ecPosition;
varying vec3 ecNormal;
varying vec3 ecLightPosition;

float G1V(float dotNV, float k) {
  return 1.0/(dotNV*(1.0-k)+k);
}

float LightingFuncGGX_REF(vec3 N, vec3 V, vec3 L, float roughness, float F0) {
  float alpha = roughness * roughness;

  //half vector
  vec3 H = normalize(V+L);

  float dotNL = clamp(dot(N,L), 0.0, 1.0);
  float dotNV = clamp(dot(N,V), 0.0, 1.0);
  float dotNH = clamp(dot(N,H), 0.0, 1.0);
  float dotLH = clamp(dot(L,H), 0.0, 1.0);

  float F, D, vis;

  //microfacet model

  // D - microfacet distribution function, shape of specular peak
  float alphaSqr = alpha*alpha;
  float pi = 3.14159;
  float denom = dotNH * dotNH * (alphaSqr-1.0) + 1.0;
  D = alphaSqr/(pi * denom * denom);

  // F - fresnel reflection coefficient
  F = F0 + (1.0 - F0) * pow(1.0 - dotLH, 5.0);

  // V / G - geometric attenuation or shadowing factor
  float k = alpha/2.0;
  vis = G1V(dotNL,k)*G1V(dotNV,k);

  float specular = dotNL * D * F * vis;
  //float specular = F;
  return specular;
}

void main() {
    vec3 ecEyePos = vec3(0.0, 0.0, 0.0);
    vec3 viewDirection = normalize(ecEyePos - ecPosition);

    vec3 lightDirection = normalize(ecLightPosition - ecPosition);
    vec3 normal = normalize(ecNormal);

    float power = LightingFuncGGX_REF(normal, viewDirection, lightDirection, uRoughness, uN0);

    gl_FragColor = vec4(power,power,power,1.0);
}
