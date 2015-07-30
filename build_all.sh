browserify 201-init/main.js -i plask -o 201-init/main.web.js
browserify 202-lambert-diffuse/main.js -i plask -g glslify-promise/transform -o 202-lambert-diffuse/main.web.js
browserify 203-gamma-manual/main.js -i plask -g glslify-promise/transform -o 203-gamma-manual/main.web.js

cp assets/html/index.template.html 201-init/index.html
cp assets/html/index.template.html 202-lambert-diffuse/index.html
cp assets/html/index.template.html 203-gamma-manual/index.html
