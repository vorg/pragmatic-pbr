var Window       = require('pex-sys/Window');
var Mat4         = require('pex-math/Mat4');
var Vec3         = require('pex-math/Vec3');
var MathUtils    = require('pex-math/Utils');
var glslify      = require('glslify-promise');
var createSphere = require('primitive-sphere');
var createCube   = require('primitive-cube');
var parseHdr     = require('../local_modules/parse-hdr');
var isBrowser    = require('is-browser');
var GUI          = require('pex-gui');
var PerspCamera  = require('pex-cam/PerspCamera');
var Arcball      = require('pex-cam/Arcball');

var ASSETS_DIR = isBrowser ? '../assets' : __dirname + '/../assets';

Window.create({
    settings: {
        width: 1024,
        height: 576,
        fullscreen: isBrowser
    },
    resources: {
        skyboxVert: { glsl: glslify(__dirname + '/SkyboxQuad.vert') },
        skyboxFrag: { glsl: glslify(__dirname + '/SkyboxQuad.frag') },
        reflectionVert: { glsl: glslify(__dirname + '/Reflection.vert') },
        reflectionFrag: { glsl: glslify(__dirname + '/Reflection.frag') },
        envMap: { binary: ASSETS_DIR + '/envmaps/pisa_latlong_256.hdr' }
    },
    aperture: 16,
    shutterSpeed: 0.5,
    iso: 100,
    onMouseMove: function(e) {
        var w = this.getWidth();
        //this.exposure = MathUtils.clamp(MathUtils.map(e.x, 0, w, 1/60, 1), 0, 1);
    },
    init: function() {
        var ctx = this.getContext();

        this.gui = new GUI(ctx, this.getWidth(), this.getHeight());
        this.addEventListener(this.gui);
        this.gui.addParam('Aperture - f', this, 'aperture', { min: 1.4, max: 32 });
        this.gui.addParam('Sutter Speed (sec)', this, 'shutterSpeed', {min: 1/1000,  max: 1/2});
        this.gui.addParam('ISO', this, 'iso', { min: 100, max: 1600 });
        this.gui.addParam('Middle grey', this, 'middleGrey', { min: 0, max: 1 });

        this.camera = new PerspCamera(45, this.getAspectRatio(), 0.1, 100);
        this.camera.lookAt([0, 0, -5], [0, 0, 0], [0, 1, 0]);
        this.arcball = new Arcball(this.camera, this.getWidth(), this.getHeight());
        this.addEventListener(this.arcball);

        ctx.setProjectionMatrix(this.camera.getProjectionMatrix());
        ctx.setViewMatrix(this.camera.getViewMatrix());

        this.modelMatrix = Mat4.create();
        ctx.setModelMatrix(this.modelMatrix);

        var res = this.getResources();

        this.skyboxProgram = ctx.createProgram(res.skyboxVert, res.skyboxFrag);
        ctx.bindProgram(this.skyboxProgram);
        this.skyboxProgram.setUniform('uEnvMap', 0);
        this.skyboxProgram.setUniform('uAperture', this.aperture);
        this.skyboxProgram.setUniform('uShutterSpeed', this.shutterSpeed);
        this.skyboxProgram.setUniform('uIso', this.iso);


        this.reflectionProgram = ctx.createProgram(res.reflectionVert, res.reflectionFrag);
        ctx.bindProgram(this.reflectionProgram);
        this.reflectionProgram.setUniform('uEnvMap', 0);
        this.reflectionProgram.setUniform('uAperture', this.aperture);
        this.reflectionProgram.setUniform('uShutterSpeed', this.shutterSpeed);
        this.reflectionProgram.setUniform('uIso', this.iso);

        var hdrInfo = parseHdr(res.envMap);
        this.envMap = ctx.createTexture2D(hdrInfo.data, hdrInfo.shape[0], hdrInfo.shape[1], { type: ctx.FLOAT });

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
    draw: function() {
        var ctx = this.getContext();
        ctx.setClearColor(0.2, 0.2, 0.2, 1);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        ctx.setDepthTest(true);

        this.arcball.apply();
        ctx.setViewMatrix(this.camera.getViewMatrix());

        ctx.bindTexture(this.envMap, 0);

        //move skybox to the camera position
        ctx.setDepthTest(false);
        ctx.bindProgram(this.skyboxProgram);
        this.skyboxProgram.setUniform('uAperture', this.aperture);
        this.skyboxProgram.setUniform('uShutterSpeed', this.shutterSpeed);
        this.skyboxProgram.setUniform('uIso', this.iso);
        ctx.bindMesh(this.skyboxMesh);
        ctx.drawMesh();

        ctx.setDepthTest(true);
        ctx.bindProgram(this.reflectionProgram);
        this.reflectionProgram.setUniform('uAperture', this.aperture);
        this.reflectionProgram.setUniform('uShutterSpeed', this.shutterSpeed);
        this.reflectionProgram.setUniform('uIso', this.iso);
        ctx.bindMesh(this.sphereMesh);
        ctx.drawMesh();

        this.gui.draw();
    }
})
