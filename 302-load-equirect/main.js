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
    drawFrustum: function(ctx, debugDraw, camera) {
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
            debugDraw.setColor([1,1,1,1]);
            debugDraw.drawLines(lines);
        ctx.popModelMatrix();
    },
    draw: function() {
        var ctx = this.getContext();
        ctx.setClearColor(0.2, 0.2, 0.2, 1);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        ctx.setDepthTest(true);

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

        ctx.bindTexture(this.debugMode ? this.envMapDebug : this.envMap, 0);

        ctx.setDepthTest(false);
        ctx.bindProgram(this.skyboxProgram);
        this.skyboxProgram.setUniform('uEnvMap', 0);
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
        this.reflectionProgram.setUniform('uEnvMap', 0);
        ctx.bindMesh(this.sphereMesh);
        ctx.drawMesh();

        ctx.bindProgram(this.showColorsProgram);
        this.debugDraw.drawPivotAxes(2);

        if (this.thirdPersonView) {
            ctx.pushModelMatrix();
                ctx.translate(this.camera.getPosition());
                this.debugDraw.setColor([1, 1, 0, 1]);
                this.debugDraw.drawCubeStroked(20);
                this.drawFrustum(ctx, this.debugDraw, this.camera);
            ctx.popModelMatrix();
        }

        this.gui.draw();
    }
})
