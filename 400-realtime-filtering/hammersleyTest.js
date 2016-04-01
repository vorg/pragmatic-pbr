var plask = require('plask');
var hammersley = require('./hammersley');

plask.simpleWindow({
    settings: {
        width: 512,
        height: 512,
        type: '2d',
        borderless: true
    },
    init: function() {
        var numSamples = 300;
        var canvas = this.canvas;
        canvas.drawColor(240,240,240,255);
        var paint = this.paint;
        paint.setFill();
        paint.setColor(255, 0, 0, 255);
        paint.setAntiAlias(true);

        var w = this.width;
        var h = this.height;

        for(var i=0; i<numSamples; i++) {
            var p = hammersley(i, numSamples);
            console.log(p)
            canvas.drawCircle(paint, p[0]*w, h-p[1]*h, 2)
        }
    }
})
