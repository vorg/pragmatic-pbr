var Window       = require('pex-sys/Window');
var Draw         = require('pex-draw');
var OrthoCamera  = require('pex-cam/OrthoCamera');
var glslify      = require('glslify-promise');
var Vec3         = require('pex-math/Vec3');
var Quat         = require('pex-math/Quat');
var Mat4         = require('pex-math/Mat4');
var isBrowser    = require('is-browser');
var sphereIntersection    = require('ray-sphere-intersection');
var aabbIntersection      = require('ray-aabb-intersection');

function reflect(out, I, N) {
    //I - 2.0 * dot(N, I) * N
    var dot = Vec3.dot(N, I);
    Vec3.set(out, N);
    Vec3.scale(out, -2.0 * dot);
    Vec3.add(out, I);
    return out;
}

Window.create({
    settings: {
        width: 1280,
        height: 720,
        fullscreen: isBrowser
    },
    resources: {
        showColorsVert: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.vert') },
        showColorsFrag: { glsl: glslify(__dirname + '/../assets/glsl/ShowColors.frag') },
    },
    cameraPos: [-0.5,0,0],
    cameraDir: [1,0,0],
    cameraRot: Quat.create(),
    circlePos: [0.5,0,0],
    circleRadius: 0.2,
    boxSize: 0.9,
    moveCamera: true,
    init: function() {
        var ctx = this.getContext();
        var res = this.getResources();

        this.showColorsProgram = ctx.createProgram(res.showColorsVert, res.showColorsFrag);
        this.debugDraw = new Draw(ctx);

        this.camera = new OrthoCamera(this.getAspectRatio());

        ctx.setProjectionMatrix(this.camera.getProjectionMatrix());
        ctx.setViewMatrix(this.camera.getViewMatrix());

        this.debugDraw.setCircleNumSegments(64);

        if (isBrowser) {
            this.getContext().getGL().canvas.addEventListener('touchmove',this.onTouchMove.bind(this));
        }
    },
    onMouseMove: function(e) {
        this.updateCamera(e.x, e.y);
    },
    updateCamera: function(x, y) {
        var h = this.getHeight();
        var w = this.getWidth();
        if (this.moveCamera) {
            this.cameraPos[0] =  (x - w/2)/(h/2);
            this.cameraPos[1] = -(y - h/2)/(h/2);
            this.circlePos[0] =  0.5;
            this.circlePos[1] =  0.0;
        }
        else {
            this.circlePos[0] =  (x - w/2)/(h/2);
            this.circlePos[1] = -(y - h/2)/(h/2);
            this.cameraPos[0] =  0.0;
            this.cameraPos[1] =  0.0;
        }

        Vec3.set(this.cameraDir, this.cameraPos);
        Vec3.normalize(this.cameraDir);

        Vec3.set(this.cameraDir, this.circlePos);
        Vec3.sub(this.cameraDir, this.cameraPos);
        Vec3.normalize(this.cameraDir);
        Quat.fromDirection(this.cameraRot, this.cameraDir);
    },
    onTouchMove: function(e) {
        this.updateCamera(e.touches[0].clientX, e.touches[0].clientY);
        e.preventDefault();
        return false;
    },
    draw: function() {
        var ctx = this.getContext();
        ctx.setClearColor(0.2, 0.2, 0.2, 1);
        ctx.clear(ctx.COLOR_BIT | ctx.DEPTH_BIT);

        ctx.bindProgram(this.showColorsProgram);

        //bounding box
        this.debugDraw.setColor([1,1,1,1]);
        this.debugDraw.drawLine([-this.boxSize, this.boxSize, 0], [ this.boxSize, this.boxSize, 0]);
        this.debugDraw.drawLine([ this.boxSize, this.boxSize, 0], [ this.boxSize,-this.boxSize, 0]);
        this.debugDraw.drawLine([ this.boxSize,-this.boxSize, 0], [-this.boxSize,-this.boxSize, 0]);
        this.debugDraw.drawLine([-this.boxSize,-this.boxSize, 0], [-this.boxSize, this.boxSize, 0]);

        //circle
        this.debugDraw.setColor([1,1,1,1]);
        ctx.pushModelMatrix();
        ctx.translate(this.circlePos);
        this.debugDraw.drawCircleStroked(this.circleRadius);
        ctx.popModelMatrix();

        //camera
        this.debugDraw.setColor([1,1,0,1]);
        ctx.pushModelMatrix();
        ctx.translate(this.cameraPos);
        var angle = Math.atan2(this.cameraDir[1], this.cameraDir[0]);
        ctx.rotate(angle, [0,0,1])
        ctx.translate([-0.1, -0.025, 0]);
        this.debugDraw.drawRectStroked(0.1, 0.05);
        ctx.popModelMatrix();

        var insideCircle = Vec3.distance(this.cameraPos, this.circlePos) < this.circleRadius;
        var insideBox = Math.abs(this.cameraPos[0]) < this.boxSize && Math.abs(this.cameraPos[1]) < this.boxSize;
        if (!insideCircle && insideBox) {
            var numRays = 7;
            var rot = Mat4.create();
            var dir = Vec3.create();
            var aabb = [
                [-this.boxSize, -this.boxSize, -this.boxSize],
                [+this.boxSize, +this.boxSize, +this.boxSize]
            ];
            for(var i=0; i<numRays; i++) {
                dir[0] = this.circlePos[0] - this.cameraPos[0];
                dir[1] = this.circlePos[1] - this.cameraPos[1];
                Vec3.normalize(dir);
                var angle = -Math.PI/180 * (-numRays/2 + i + 0.5) / numRays *45;
                Mat4.setRotation(rot, angle, [0, 0, 1]);
                Vec3.multMat4(dir, rot);
                var circleHit = sphereIntersection([], this.cameraPos, dir, this.circlePos, this.circleRadius);
                if (circleHit) {
                    this.debugDraw.setColor([0,1,0,1]);
                    this.debugDraw.drawLine(this.cameraPos, circleHit);
                    var normal = Vec3.normalize([circleHit[0] - this.circlePos[0], circleHit[1] - this.circlePos[1], 0]);

                    var bounce = reflect([], dir, normal);

                    this.debugDraw.setColor([1,1,0,1]);
                    var invBounce = [-bounce[0], -bounce[1], 0];
                    var boxHit = aabbIntersection([], circleHit, invBounce, aabb);
                    this.debugDraw.drawLine(
                        circleHit,
                        boxHit
                    );
                }
                else {
                    this.debugDraw.setColor([1,0,0,1]);
                    //we need to flip the ray as we are inside the cube
                    var invDir = [-dir[0], -dir[1], 0];
                    var boxHit = aabbIntersection([], this.cameraPos, invDir, aabb);
                    this.debugDraw.drawLine(
                        this.cameraPos,
                        boxHit
                    );
                    //this.debugDraw.drawLine(this.cameraPos, [this.cameraPos[0] + dir[0] * 5, this.cameraPos[1] + dir[1] * 5, 0]);
                }
            }

        }
    }
})
