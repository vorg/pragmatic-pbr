browserify 201-init/main.js -i plask -o 201-init/main.web.js
browserify 202-lambert-diffuse/main.js -i plask -g glslify-promise/transform -o 202-lambert-diffuse/main.web.js
browserify 203-gamma/main.js -i plask -g glslify-promise/transform -o 203-gamma/main.web.js
browserify 204-gamma-color/main.js -i plask -g glslify-promise/transform -o 204-gamma-color/main.web.js
browserify 205-gamma-texture/main.js -i plask -g glslify-promise/transform -o 205-gamma-texture/main.web.js
browserify 206-gamma-ext-srgb/main.js -i plask -g glslify-promise/transform -o 206-gamma-ext-srgb/main.web.js

browserify 301-load-cubemap/main.js -i plask -g glslify-promise/transform -o 301-load-cubemap/main.web.js
browserify 302-load-latlong/main.js -i plask -g glslify-promise/transform -o 302-load-latlong/main.web.js
browserify 303-fullscreenquad-skybox/main.js -i plask -g glslify-promise/transform -o 303-fullscreenquad-skybox/main.web.js
browserify 304-load-hdr/main.js -i plask -g glslify-promise/transform -o 304-load-hdr/main.web.js
browserify 305-exposure-basic/main.js -i plask -g glslify-promise/transform -o 305-exposure-basic/main.web.js
browserify 306-tonemap-reinhard/main.js -i plask -g glslify-promise/transform -o 306-tonemap-reinhard/main.web.js
browserify 307-tonemap-compare/main.js -i plask -g glslify-promise/transform -o 307-tonemap-compare/main.web.js
browserify 308-exposure-camera/main.js -i plask -g glslify-promise/transform -o 308-exposure-camera/main.web.js

cp assets/html/index.template.html 201-init/index.html
cp assets/html/index.template.html 202-lambert-diffuse/index.html
cp assets/html/index.template.html 203-gamma/index.html
cp assets/html/index.template.html 204-gamma-color/index.html
cp assets/html/index.template.html 205-gamma-texture/index.html
cp assets/html/index.template.html 206-gamma-ext-srgb/index.html
cp assets/html/index.template.html 301-load-cubemap/index.html
cp assets/html/index.template.html 302-load-latlong/index.html
cp assets/html/index.template.html 303-fullscreenquad-skybox/index.html
cp assets/html/index.template.html 304-load-hdr/index.html
cp assets/html/index.template.html 305-exposure-basic/index.html
cp assets/html/index.template.html 306-tonemap-reinhard/index.html
cp assets/html/index.template.html 307-tonemap-compare/index.html
cp assets/html/index.template.html 308-exposure-camera/index.html



cp assets/html/index.template.html 300-load-cubemap/index.html
