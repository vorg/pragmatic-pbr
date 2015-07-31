vec3 rgbe2rgb(vec4 rgbe) {
  return (rgbe.rgb * pow(2.0, rgbe.a * 255.0 - 128.0));
}

#pragma glslify: export(rgbe2rgb)
