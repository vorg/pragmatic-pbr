var Window       = require('pex-sys/Window');
var glslify      = require('glslify-promise');
var PerspCamera  = require('pex-cam/PerspCamera');
var Arcball      = require('pex-cam/Arcball');
var hammersley   = require('hammersley');
var GUI          = require('pex-gui');
var Draw         = require('pex-draw');
var isBrowser    = require('is-browser');
var createSphere = require('primitive-sphere');
var random       = require('pex-random');
var Vec3         = require('pex-math/Vec3');

Window.create({
    settings: {
        width: 1024,
        height: 576,
        fullscreen: isBrowser
    },
    resources: {
        showColorsVert: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.vert') },
        showColorsFrag: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.frag') }
    },
    init: function() {
        var ctx = this.getContext();
        var res = this.getResources();

        this.camera = new PerspCamera(60, this.getAspectRatio(), 0.1, 100);
        this.camera.lookAt([0, 1, 3], [0, 0, 0], [0, 1, 0]);
        this.arcball = new Arcball(this.camera, this.getWidth(), this.getHeight());
        this.addEventListener(this.arcball);

        ctx.setProjectionMatrix(this.camera.getProjectionMatrix());
        ctx.setViewMatrix(this.camera.getViewMatrix());

        var sphere = createSphere(1, { segments: 16});
        var colors = sphere.positions.map(function() { return [1, 1, 1, 0.25]; })
        var attributes = [
            { data: sphere.positions, location: ctx.ATTRIB_POSITION },
            { data: colors, location: ctx.ATTRIB_COLOR },
        ];
        var sphereIndices = { data: sphere.cells, usage: ctx.STATIC_DRAW };
        this.sphereMesh = ctx.createMesh(attributes, sphereIndices, ctx.LINES);

        this.debugDraw = new Draw(ctx);
        this.showColorsProgram = ctx.createProgram(res.showColorsVert, res.showColorsFrag);

        this.center = [0, 0, 0];
        this.samplingDir = Vec3.normalize([1, 1, 1]);
        this.samples = this.resamplePoints(this.samplingDir);
    },
    resamplePoints: function(N) {
        var numSamples = 1024;
        var points = [];
        for(var i=0; i<numSamples; i++) {
            var Xi = hammersley(i, numSamples);

            var Phi = Xi[1] * 2.0 * Math.PI;
            var CosTheta = Math.sqrt(1.0 - Xi[0]);
            var SinTheta = Math.sqrt(1.0 - CosTheta * CosTheta);
            var H = [
                SinTheta * Math.cos(Phi),
                SinTheta * Math.sin(Phi),
                CosTheta
            ];

            //Tangent space vectors
            var UpVector = (Math.abs(N[2]) < 0.999) ? [0.0, 0.0, 1.0] : [1.0, 0.0, 0.0];
            var TangentX = Vec3.normalize(Vec3.cross(Vec3.copy(UpVector), N));
            var TangentY = Vec3.normalize(Vec3.cross(Vec3.copy(N), TangentX));

            //Tangent to World Space
            var L = [0, 0, 0];
            Vec3.add(L, Vec3.scale(Vec3.copy(TangentX), H[0]));
            Vec3.add(L, Vec3.scale(Vec3.copy(TangentY), H[1]));
            Vec3.add(L, Vec3.scale(Vec3.copy(N), H[2]));
            points.push(L);
        }
        return points;
    },
    draw: function() {
        var ctx = this.getContext();
        ctx.setClearColor(0.2, 0.2, 0.2, 1);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        ctx.setDepthTest(true);

        this.arcball.apply();
        ctx.setViewMatrix(this.camera.getViewMatrix());

        ctx.bindProgram(this.showColorsProgram);

        ctx.setBlend(true);
        ctx.setBlendFunc(ctx.SRC_ALPHA, ctx.ONE);
        ctx.bindMesh(this.sphereMesh);
        ctx.drawMesh();
        ctx.setBlend(false);

        this.debugDraw.drawPivotAxes(2);

        this.debugDraw.setColor([1, 1, 0, 1]);
        this.debugDraw.drawVector(this.center, this.samplingDir)

        this.debugDraw.setPointSize(4);
        this.debugDraw.setColor([1, 0, 0, 1]);
        this.debugDraw.drawPoints(this.samples);
    }
});
