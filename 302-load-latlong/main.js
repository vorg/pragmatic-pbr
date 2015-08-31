var Window       = require('pex-sys/Window');
var Mat4         = require('pex-math/Mat4');
var Vec3         = require('pex-math/Vec3');
var glslify      = require('glslify-promise');
var createSphere = require('primitive-sphere');
var createCube   = require('primitive-cube');
var PerspCamera  = require('pex-cam/PerspCamera');
var Arcball      = require('pex-cam/Arcball');
var Draw         = require('pex-draw');
var GUI          = require('pex-gui');
var isBrowser    = require('is-browser');

var ASSETS_DIR = isBrowser ? '../assets' :  __dirname + '/../assets';

Window.create({
    settings: {
        width: 1024,
        height: 576,
        fullscreen: isBrowser
    },
    resources: {
        skyboxVert: { glsl: glslify(__dirname + '/Skybox.vert') },
        skyboxFrag: { glsl: glslify(__dirname + '/Skybox.frag') },
        reflectionVert: { glsl: glslify(__dirname + '/Reflection.vert') },
        reflectionFrag: { glsl: glslify(__dirname + '/Reflection.frag') },
        showColorsVert: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.vert') },
        showColorsFrag: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.frag') },
        envMap: { image: ASSETS_DIR + '/envmaps/pisa_preview.jpg' },
        envMapDebug: { image: ASSETS_DIR + '/envmaps/test.jpg' }
    },
    debugMode: false,
    init: function() {
        var ctx = this.getContext();

        this.gui = new GUI(ctx, this.getWidth(), this.getHeight());
        this.addEventListener(this.gui);
        this.gui.addParam('Debug mode', this, 'debugMode');

        this.camera = new PerspCamera(45, this.getAspectRatio(), 0.1, 100);
        this.camera.lookAt([0, 0, -5], [0, 0, 0], [0, 1, 0]);
        this.arcball = new Arcball(this.camera, this.getWidth(), this.getHeight());
        this.addEventListener(this.arcball);

        ctx.setProjectionMatrix(this.camera.getProjectionMatrix());
        ctx.setViewMatrix(this.camera.getViewMatrix());

        this.modelMatrix = Mat4.create();
        ctx.setModelMatrix(this.modelMatrix);

        this.debugDraw = new Draw(ctx);

        var res = this.getResources();

        this.skyboxProgram = ctx.createProgram(res.skyboxVert, res.skyboxFrag);
        ctx.bindProgram(this.skyboxProgram);
        this.skyboxProgram.setUniform('uEnvMap', 0);

        this.reflectionProgram = ctx.createProgram(res.reflectionVert, res.reflectionFrag);
        ctx.bindProgram(this.reflectionProgram);
        this.reflectionProgram.setUniform('uEnvMap', 0);

        this.showColorsProgram = ctx.createProgram(res.showColorsVert, res.showColorsFrag);

        this.envMap = ctx.createTexture2D(res.envMap);
        this.envMapDebug = ctx.createTexture2D(res.envMapDebug);

        var skybox = createCube(20);
        var skyboxAttributes = [
            { data: skybox.positions, location: ctx.ATTRIB_POSITION },
            { data: skybox.uvs, location: ctx.ATTRIB_TEX_COORD_0 },
            { data: skybox.normals, location: ctx.ATTRIB_NORMAL }
        ];
        var skyboxIndices = { data: skybox.cells };
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

        ctx.bindTexture(this.debugMode ? this.envMapDebug : this.envMap, 0);

        ctx.pushModelMatrix();
            //move skybox to the camera position
            ctx.translate(this.camera.getPosition());
            ctx.bindProgram(this.skyboxProgram);
            ctx.bindMesh(this.skyboxMesh);
            ctx.drawMesh();
        ctx.popModelMatrix();

        ctx.bindProgram(this.reflectionProgram);
        ctx.bindMesh(this.sphereMesh);
        ctx.drawMesh();

        ctx.bindProgram(this.showColorsProgram);
        this.debugDraw.drawPivotAxes(2);

        this.gui.draw();
    }
})
