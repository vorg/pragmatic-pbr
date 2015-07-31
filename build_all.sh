browserify 201-init/main.js -i plask -o 201-init/main.web.js
browserify 202-lambert-diffuse/main.js -i plask -g glslify-promise/transform -o 202-lambert-diffuse/main.web.js
browserify 203-gamma/main.js -i plask -g glslify-promise/transform -o 203-gamma/main.web.js
browserify 204-gamma-color/main.js -i plask -g glslify-promise/transform -o 204-gamma-color/main.web.js
browserify 205-gamma-texture/main.js -i plask -g glslify-promise/transform -o 205-gamma-texture/main.web.js
browserify 206-gamma-ext-srgb/main.js -i plask -g glslify-promise/transform -o 206-gamma-ext-srgb/main.web.js

cp assets/html/index.template.html 201-init/index.html
cp assets/html/index.template.html 202-lambert-diffuse/index.html
cp assets/html/index.template.html 203-gamma/index.html
cp assets/html/index.template.html 204-gamma-color/index.html
cp assets/html/index.template.html 205-gamma-texture/index.html
cp assets/html/index.template.html 206-gamma-ext-srgb/index.html
