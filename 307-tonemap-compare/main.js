var Window       = require('pex-sys/Window');
var Mat4         = require('pex-math/Mat4');
var Vec3         = require('pex-math/Vec3');
var MathUtils    = require('pex-math/Utils');
var GUI          = require('pex-gui');
var PerspCamera  = require('pex-cam/PerspCamera');
var Arcball      = require('pex-cam/Arcball');
var Draw         = require('pex-draw');
var glslify      = require('glslify-promise');
var createSphere = require('primitive-sphere');
var createCube   = require('primitive-cube');
var parseHdr     = require('../local_modules/parse-hdr');
var isBrowser    = require('is-browser');

var ASSETS_DIR = isBrowser ? '../assets' :  __dirname + '/../assets';

Window.create({
    settings: {
        width: 1200,
        height: 720,
        fullscreen: isBrowser
    },
    resources: {
        skyboxVert: { glsl: glslify(__dirname + '/SkyboxQuad.vert') },
        skyboxFrag: { glsl: glslify(__dirname + '/SkyboxQuad.frag') },
        reflectionVert: { glsl: glslify(__dirname + '/Reflection.vert') },
        reflectionFrag: { glsl: glslify(__dirname + '/Reflection.frag') },
        showColorsVert: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.vert') },
        showColorsFrag: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.frag') },
        reflectionMap: { binary: ASSETS_DIR + '/envmaps/pisa_latlong_256.hdr' },
        filmLut: { image: ASSETS_DIR + '/textures/FilmLut.png' }
    },
    exposure: 1,
    sidebarWidth: 200,
    onMouseMove: function(e) {
        var w = this.getWidth();
        if (e.x < w/2) {
            this.exposure = MathUtils.clamp(MathUtils.map(e.x, 0, w/2, 0, 1), 0, 1);
        }
        else {
            this.exposure = MathUtils.clamp(MathUtils.map(e.x, w/2, w, 1, 5), 0, 5);
        }
    },
    init: function() {
        var ctx = this.getContext();

        this.debugDraw = new Draw(ctx);

        var w = this.getWidth();
        var h = this.getHeight();
        this.gui = new GUI(ctx, w, h);
        this.gui.addHeader('Gamma').setPosition(10, 10);
        this.gui.addHeader('Reinhard + Gamma').setPosition(w/2 + 10, 10);
        this.gui.addHeader('Filmic').setPosition(10, h/2 + 10);
        this.gui.addHeader('Uncharted + Gamma').setPosition(w/2 + 10, h/2 + 10);

        this.camera  = new PerspCamera(45,this.getAspectRatio(),0.001,20.0);
        this.camera.lookAt([0, 0, -5], [0, 0, 0]);

        ctx.setProjectionMatrix(this.camera.getProjectionMatrix());

        this.arcball = new Arcball(this.camera, this.getWidth(), this.getHeight());
        this.addEventListener(this.arcball);

        var res = this.getResources();

        this.skyboxProgram = ctx.createProgram(res.skyboxVert, res.skyboxFrag);
        ctx.bindProgram(this.skyboxProgram);
        this.skyboxProgram.setUniform('uEnvMap', 0);
        this.skyboxProgram.setUniform('uFilmLut', 1);
        this.skyboxProgram.setUniform('uExposure', this.exposure);

        this.reflectionProgram = ctx.createProgram(res.reflectionVert, res.reflectionFrag);
        ctx.bindProgram(this.reflectionProgram);
        this.reflectionProgram.setUniform('uEnvMap', 0);
        this.reflectionProgram.setUniform('uFilmLut', 1);
        this.reflectionProgram.setUniform('uExposure', this.exposure);

        this.showColorsProgram = ctx.createProgram(res.showColorsVert, res.showColorsFrag);

        this.filmLutTexture = ctx.createTexture2D(res.filmLut);

        var hdrInfo = parseHdr(res.reflectionMap, { float: true });
        this.reflectionMap = ctx.createTexture2D(hdrInfo.data, hdrInfo.shape[0], hdrInfo.shape[1], { type: ctx.FLOAT });

        var skyboxPositions = [[-1,-1],[1,-1], [1,1],[-1,1]];
        var skyboxFaces = [ [0, 1, 2], [0, 2, 3]];
        var skyboxAttributes = [
            { data: skyboxPositions, location: ctx.ATTRIB_POSITION },
        ];
        var skyboxIndices = { data: skyboxFaces };
        this.skyboxMesh = ctx.createMesh(skyboxAttributes, skyboxIndices);

        var sphere = createSphere();
        var attributes = [
            { data: sphere.positions, location: ctx.ATTRIB_POSITION },
            { data: sphere.normals, location: ctx.ATTRIB_NORMAL },
            { data: sphere.uvs, location: ctx.ATTRIB_TEX_COORD_0 },
        ];
        var sphereIndices = { data: sphere.cells, usage: ctx.STATIC_DRAW };
        this.sphereMesh = ctx.createMesh(attributes, sphereIndices, ctx.TRIANGLES);
    },
    drawScene: function(tonemappingMethod) {
        var ctx = this.getContext();
        ctx.setDepthTest(false);
        ctx.bindProgram(this.skyboxProgram);
        this.skyboxProgram.setUniform('uExposure', this.exposure);
        this.skyboxProgram.setUniform('uTonemappingMethod', tonemappingMethod);
        ctx.bindMesh(this.skyboxMesh);
        ctx.drawMesh();

        ctx.setDepthTest(true);
        ctx.bindProgram(this.reflectionProgram);
        this.reflectionProgram.setUniform('uExposure', this.exposure);
        this.reflectionProgram.setUniform('uTonemappingMethod', tonemappingMethod);
        ctx.bindMesh(this.sphereMesh);
        ctx.drawMesh();

        ctx.bindProgram(this.showColorsProgram);
        this.debugDraw.drawPivotAxes(2);
    },
    draw: function() {
        var ctx = this.getContext();
        ctx.setClearColor(0.2, 0.2, 0.2, 1);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        ctx.setDepthTest(true);

        this.arcball.apply();
        ctx.setViewMatrix(this.camera.getViewMatrix());

        ctx.bindTexture(this.reflectionMap, 0);
        ctx.bindTexture(this.filmLutTexture, 1);

        var w = this.getWidth();
        var h = this.getHeight();

        //Viewport origin is at bottom left
        ctx.setViewport(0, h/2, w/2, h/2);
        this.drawScene(0);

        ctx.setViewport(w/2, h/2, w/2, h/2);
        this.drawScene(1);

        ctx.setViewport(0, 0, w/2, h/2);
        this.drawScene(2);

        ctx.setViewport(w/2, 0, w/2, h/2);
        this.drawScene(3);

        ctx.setViewport(0, 0, w, h);

        this.gui.draw();
    }
})
