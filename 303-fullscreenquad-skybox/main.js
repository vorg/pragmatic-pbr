//TODO: simplified textured cube
//http://gamedev.stackexchange.com/questions/60313/implementing-a-skybox-with-glsl-version-330
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
        skyboxVert: { glsl: glslify(__dirname + '/SkyboxQuad.vert') },
        skyboxDebugVert: { glsl: glslify(__dirname + '/SkyboxQuadDebug.vert') },
        skyboxFrag: { glsl: glslify(__dirname + '/SkyboxQuad.frag') },
        reflectionVert: { glsl: glslify(__dirname + '/Reflection.vert') },
        reflectionFrag: { glsl: glslify(__dirname + '/Reflection.frag') },
        showColorsVert: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.vert') },
        showColorsFrag: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.frag') },
        envMap: { image: ASSETS_DIR + '/envmaps/pisa_preview.jpg' },
        envMapDebug: { image: ASSETS_DIR + '/envmaps/test.jpg' }
    },
    debugMode: false,
    thirdPersonView: true,
    init: function() {
        var ctx = this.getContext();

        this.gui = new GUI(ctx, this.getWidth(), this.getHeight());
        this.addEventListener(this.gui);
        this.gui.addParam('Debug mode', this, 'debugMode');
        this.gui.addParam('Third person view', this, 'thirdPersonView');

        this.camera = new PerspCamera(45, this.getAspectRatio(), 0.1, 50);
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

        this.skyboxDebugProgram = ctx.createProgram(res.skyboxDebugVert, res.skyboxFrag);
        ctx.bindProgram(this.skyboxDebugProgram);
        this.skyboxDebugProgram.setUniform('uEnvMap', 0);

        this.reflectionProgram = ctx.createProgram(res.reflectionVert, res.reflectionFrag);
        ctx.bindProgram(this.reflectionProgram);
        this.reflectionProgram.setUniform('uEnvMap', 0);

        this.showColorsProgram = ctx.createProgram(res.showColorsVert, res.showColorsFrag);

        this.envMap = ctx.createTexture2D(res.envMap, res.envMap.width, res.envMap.height);
        this.envMapDebug = ctx.createTexture2D(res.envMapDebug, res.envMapDebug.width, res.envMapDebug.height);

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

        this.farNearRatio = farNearRatio;
        this.frontNear = frontNear;
        this.rightRight = rightRight;
        this.upTop = upTop;

        var frustumFarTopLeft     = Vec3.scale(Vec3.copy(frustumNearTopLeft    ), farNearRatio);
        var frustumFarTopRight    = Vec3.scale(Vec3.copy(frustumNearTopRight   ), farNearRatio);
        var frustumFarBottomRight = Vec3.scale(Vec3.copy(frustumNearBottomRight), farNearRatio);
        var frustumFarBottomLeft  = Vec3.scale(Vec3.copy(frustumNearBottomLeft ), farNearRatio);

        this.frustumFarTopRight = frustumFarTopRight;

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
        ctx.setDepthTest(true);

        ctx.bindTexture(this.debugMode ? this.envMapDebug : this.envMap, 0);

        if (!this.thirdPersonView) {
            ctx.setDepthTest(false);
            ctx.bindProgram(this.skyboxProgram);
            ctx.bindMesh(this.skyboxMesh);
            ctx.drawMesh();
        }
        else {
            ctx.setDepthTest(false);
            ctx.bindProgram(this.skyboxDebugProgram);
            this.skyboxDebugProgram.setUniform('uOrigProjectionMatrix', this.camera.getProjectionMatrix());
            this.skyboxDebugProgram.setUniform('uOrigViewMatrix', this.camera.getViewMatrix());
            if (this.farNearRatio) {
                this.skyboxDebugProgram.setUniform('uFarNearRatio', this.farNearRatio);
                this.skyboxDebugProgram.setUniform('uFrontNear', this.frontNear);
                this.skyboxDebugProgram.setUniform('uRightRight', this.rightRight);
                this.skyboxDebugProgram.setUniform('uUpTop', this.upTop);
                this.skyboxDebugProgram.setUniform('uCamPosition', this.camera.getPosition());
                ctx.bindMesh(this.skyboxMesh);
                ctx.drawMesh();
            }
        }

        ctx.setDepthTest(true);
        ctx.bindProgram(this.reflectionProgram);
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
