var plask = require('plask');
var hammersley = require('./hammersley');

plask.simpleWindow({
    settings: {
        width: 512,
        height: 512,
        type: '2d'
    },
    init: function() {
        var numSamples = 16;
        var canvas = this.canvas;
        var paint = this.paint;
        canvas.drawColor(255, 255, 255, 255);
        paint.setFill();
        paint.setColor(255, 0, 0, 255);
        paint.setAntiAlias(true);

        var w = this.width;
        var h = this.height;

        for(var i=0; i<=numSamples; i++) {
            var y = i/numSamples*2 - 1;
            var vThree = y * 0.5 + 0.5;
            paint.setColor(255, 0, 0, 255);
            canvas.drawLine(paint, w/2, h/2, 0, vThree * h);

            var vPex = Math.acos(y) / Math.PI;
            paint.setColor(0, 255, 0, 255);
            canvas.drawLine(paint, w/2, h/2, w, vPex * h);
        }
    }
})
