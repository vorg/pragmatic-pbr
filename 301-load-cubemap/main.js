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
        reflectionVert: { glsl: glslify(__dirname + '/Reflection.vert') },
        reflectionFrag: { glsl: glslify(__dirname + '/Reflection.frag') },
        skyboxVert: { glsl: glslify(__dirname + '/Skybox.vert') },
        skyboxFrag: { glsl: glslify(__dirname + '/Skybox.frag') },
        showColorsVert: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.vert') },
        showColorsFrag: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.frag') },
        lake_px:     { image: ASSETS_DIR + '/envmaps/pisa_posx.jpg' },
        lake_nx:     { image: ASSETS_DIR + '/envmaps/pisa_negx.jpg' },
        lake_py:     { image: ASSETS_DIR + '/envmaps/pisa_posy.jpg' },
        lake_ny:     { image: ASSETS_DIR + '/envmaps/pisa_negy.jpg' },
        lake_pz:     { image: ASSETS_DIR + '/envmaps/pisa_posz.jpg' }, //+x is 'back'!
        lake_nz:     { image: ASSETS_DIR + '/envmaps/pisa_negz.jpg' },//-z is 'front'!
        test_px:     { image: ASSETS_DIR + '/envmaps/test_px.png' },
        test_nx:     { image: ASSETS_DIR + '/envmaps/test_nx.png' },
        test_py:     { image: ASSETS_DIR + '/envmaps/test_py.png' },
        test_ny:     { image: ASSETS_DIR + '/envmaps/test_ny.png' },
        test_pz:     { image: ASSETS_DIR + '/envmaps/test_pz.png' },
        test_nz:     { image: ASSETS_DIR + '/envmaps/test_nz.png' }
    },
    debugMode: false,
    thirdPersonView: false,
    init: function() {
        var ctx = this.getContext();

        this.gui = new GUI(ctx, this.getWidth(), this.getHeight());
        this.addEventListener(this.gui);
        this.gui.addParam('Debug mode', this, 'debugMode');
        this.gui.addParam('Third person view', this, 'thirdPersonView');

        this.camera = new PerspCamera(45, this.getAspectRatio(), 0.1, 100);
        this.camera.lookAt([0, 0, -5], [0, 0, 0], [0, 1, 0]);
        this.arcball = new Arcball(this.camera, this.getWidth(), this.getHeight());
        this.addEventListener(this.arcball);

        this.thirdPersonCamera = new PerspCamera(45, this.getAspectRatio(), 0.1, 250);
        this.thirdPersonCamera.lookAt([0, 0, -35], [0, 0, 0], [0, 1, 0]);
        this.thirdPersonArcball = new Arcball(this.thirdPersonCamera, this.getWidth(), this.getHeight());
        this.addEventListener(this.thirdPersonArcball);

        ctx.setProjectionMatrix(this.camera.getProjectionMatrix());
        ctx.setViewMatrix(this.camera.getViewMatrix());

        this.modelMatrix = Mat4.create();
        ctx.setModelMatrix(this.modelMatrix);

        this.debug = new Draw(ctx);

        var res = this.getResources();

        this.reflectionProgram = ctx.createProgram(res.reflectionVert, res.reflectionFrag);
        this.skyboxProgram = ctx.createProgram(res.skyboxVert, res.skyboxFrag);
        this.showColorsProgram = ctx.createProgram(res.showColorsVert, res.showColorsFrag);

        var g = createSphere();
        var attributes = [
            { data: g.positions, location: ctx.ATTRIB_POSITION },
            { data: g.normals, location: ctx.ATTRIB_NORMAL }
        ];
        var indices = { data: g.cells };
        this.mesh = ctx.createMesh(attributes, indices, ctx.TRIANGLES);

        var cube = createCube(20);
        this.skyboxMesh = ctx.createMesh(
            [ { data: cube.positions, location: ctx.ATTRIB_POSITION }],
            { data: cube.cells },
            ctx.TRIANGLES
        );

        this.reflectionMap = ctx.createTextureCube([
            { face: 0, data: res.lake_px },
            { face: 1, data: res.lake_nx },
            { face: 2, data: res.lake_py },
            { face: 3, data: res.lake_ny },
            { face: 4, data: res.lake_pz },
            { face: 5, data: res.lake_nz }
        ])

        this.debugReflectionMap = ctx.createTextureCube([
            { face: 0, data: res.test_px },
            { face: 1, data: res.test_nx },
            { face: 2, data: res.test_py },
            { face: 3, data: res.test_ny },
            { face: 4, data: res.test_pz },
            { face: 5, data: res.test_nz }
        ])
    },
    drawFrustum: function(ctx, debug, camera) {
        var camera = this.camera;
        var lines = [];

        var position = camera.getPosition();
        var target = camera.getTarget();

        var frustumNear = camera.getNear();
        var frustumFar = camera.getFar();
        var frustumTop = Math.tan(camera.getFov() / 180 * Math.PI / 2) * frustumNear;
        var frustumRight = frustumTop * camera.getAspectRatio();
        var frustumLeft = -frustumTop;
        var frustumBottom = -frustumLeft;

        var front = Vec3.normalize(Vec3.sub(Vec3.copy(camera.getTarget()), camera.getPosition()));
        var up = Vec3.copy(camera.getUp());
        var right = Vec3.normalize(Vec3.cross(Vec3.copy(front), up));

        var frontNear = Vec3.scale(Vec3.copy(front), frustumNear);
        var upTop = Vec3.scale(Vec3.copy(up), frustumTop);
        var rightRight = Vec3.scale(Vec3.copy(right), frustumRight);

        var frustumNearTopLeft     = Vec3.add(Vec3.sub(Vec3.copy(frontNear), rightRight), upTop);
        var frustumNearTopRight    = Vec3.add(Vec3.add(Vec3.copy(frontNear), rightRight), upTop);
        var frustumNearBottomRight = Vec3.sub(Vec3.add(Vec3.copy(frontNear), rightRight), upTop);
        var frustumNearBottomLeft  = Vec3.sub(Vec3.sub(Vec3.copy(frontNear), rightRight), upTop);

        var farNearRatio = frustumFar / frustumNear;

        var frustumFarTopLeft     = Vec3.scale(Vec3.copy(frustumNearTopLeft    ), farNearRatio);
        var frustumFarTopRight    = Vec3.scale(Vec3.copy(frustumNearTopRight   ), farNearRatio);
        var frustumFarBottomRight = Vec3.scale(Vec3.copy(frustumNearBottomRight), farNearRatio);
        var frustumFarBottomLeft  = Vec3.scale(Vec3.copy(frustumNearBottomLeft ), farNearRatio);

        var zero = [0, 0, 0];
        lines.push([zero, right]);
        lines.push([zero, up]);
        lines.push([zero, front]);

        lines.push([zero, frustumFarTopLeft]);
        lines.push([zero, frustumFarTopRight]);
        lines.push([zero, frustumFarBottomRight]);
        lines.push([zero, frustumFarBottomLeft]);

        lines.push([frustumNearTopLeft, frustumNearTopRight]);
        lines.push([frustumNearTopRight, frustumNearBottomRight]);
        lines.push([frustumNearBottomRight, frustumNearBottomLeft]);
        lines.push([frustumNearBottomLeft, frustumNearTopLeft]);

        lines.push([frustumFarTopLeft, frustumFarTopRight]);
        lines.push([frustumFarTopRight, frustumFarBottomRight]);
        lines.push([frustumFarBottomRight, frustumFarBottomLeft]);
        lines.push([frustumFarBottomLeft, frustumFarTopLeft]);

        ctx.pushModelMatrix();
            debug.setColor([1,1,1,1]);
            debug.drawLines(lines);
        ctx.popModelMatrix();
    },
    draw: function() {
        var ctx = this.getContext();

        if (this.thirdPersonView) {
            this.arcball.disable();
            this.thirdPersonArcball.enable();
            this.thirdPersonArcball.apply();
            ctx.setViewMatrix(this.thirdPersonCamera.getViewMatrix());
            ctx.setProjectionMatrix(this.thirdPersonCamera.getProjectionMatrix());
        }
        else {
            this.thirdPersonArcball.disable();
            this.arcball.enable();
            this.arcball.apply();
            ctx.setViewMatrix(this.camera.getViewMatrix());
            ctx.setProjectionMatrix(this.camera.getProjectionMatrix());
        }

        ctx.setClearColor(0.2, 0.2, 0.2, 1);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

        ctx.bindTexture(this.debugMode ? this.debugReflectionMap : this.reflectionMap, 0);

        ctx.setDepthTest(false);
        ctx.bindProgram(this.skyboxProgram);
        this.skyboxProgram.setUniform('uReflectionMap', 0);
        ctx.setCullFace(true);
        ctx.setCullFaceMode(ctx.FRONT);
        ctx.pushModelMatrix();
            ctx.translate(this.camera.getPosition());
            ctx.bindMesh(this.skyboxMesh);
            ctx.drawMesh();
        ctx.popModelMatrix();
        ctx.setCullFaceMode(ctx.BACK);

        ctx.setDepthTest(true);
        ctx.bindProgram(this.reflectionProgram);
        this.reflectionProgram.setUniform('uReflectionMap', 0);
        ctx.bindMesh(this.mesh);
        ctx.drawMesh();

        ctx.bindProgram(this.showColorsProgram);
        this.debug.drawPivotAxes(2);

        if (this.thirdPersonView) {
            ctx.pushModelMatrix();
                ctx.translate(this.camera.getPosition());
                this.debug.setColor([1, 1, 0, 1]);
                this.debug.drawCubeStroked(20);
                this.drawFrustum(ctx, this.debug, this.camera);
            ctx.popModelMatrix();
        }

        this.gui.draw();
    }
})
