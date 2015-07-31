var Window       = require('pex-sys/Window');
var Mat4         = require('pex-math/Mat4');
var Vec3         = require('pex-math/Vec3');
var glslify      = require('glslify-promise');
var createSphere = require('primitive-sphere');
var GUI          = require('pex-gui');

Window.create({
    settings: {
        width: 1024,
        height: 576
    },
    resources: {
        vert: { glsl: glslify(__dirname + '/Material.vert') },
        frag: { glsl: glslify(__dirname + '/Material.frag') }
    },
    init: function() {
        var ctx = this.getContext();

        this.lightColor1 = [0.0, 1, 0.0, 1.0];
        this.lightColor2 = [1, 0.0, 0.0, 1.0];
        this.correctGamma = true;
        this.linearSpace = true;

        this.gui = new GUI(ctx, this.getWidth(), this.getHeight());
        this.addEventListener(this.gui);
        this.gui.addHeader('Settings');
        this.gui.addParam('Linear space', this, 'linearSpace');
        this.gui.addParam('Correct gamma', this, 'correctGamma');
        this.gui.addParam('Light 1', this, 'lightColor1', { type: 'color'});
        this.gui.addParam('Light 2', this, 'lightColor2', { type: 'color'});

        this.model = Mat4.create();
        this.projection = Mat4.perspective(Mat4.create(), 45, this.getAspectRatio(), 0.001, 10.0);
        this.view = Mat4.lookAt([], [3, 2, 2], [0, 0, 0], [0, 1, 0]);

        ctx.setProjectionMatrix(this.projection);
        ctx.setViewMatrix(this.view);
        ctx.setModelMatrix(this.model);

        var res = this.getResources();

        this.program = ctx.createProgram(res.vert, res.frag);
        ctx.bindProgram(this.program);

        var g = createSphere(1);

        var attributes = [
            { data: g.positions, location: ctx.ATTRIB_POSITION },
            { data: g.normals, location: ctx.ATTRIB_NORMAL }
        ];
        var indices = { data: g.cells, usage: ctx.STATIC_DRAW };
        this.mesh = ctx.createMesh(attributes, indices, ctx.TRIANGLES);
    },
    draw: function() {
        var ctx = this.getContext();
        ctx.setClearColor(0.2, 0.2, 0.2, 1);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);
        ctx.setDepthTest(true);

        ctx.setViewMatrix(Mat4.lookAt(this.view, [0, 1, 5], [0, 0, 0], [0, 1, 0]));

        ctx.bindProgram(this.program);
        this.program.setUniform('uLightPos1', [-10, 10, 5]);
        this.program.setUniform('uLightPos2', [10, 10, 5]);
        this.program.setUniform('uLightColor1', this.lightColor1);
        this.program.setUniform('uLightColor2', this.lightColor2);
        this.program.setUniform('uLinearSpace', this.linearSpace);
        this.program.setUniform('uCorrectGamma', this.correctGamma);

        ctx.setViewMatrix(this.view);
        ctx.setLineWidth(2);

        ctx.bindMesh(this.mesh);
        ctx.drawMesh();

        this.gui.draw();
    }
})
