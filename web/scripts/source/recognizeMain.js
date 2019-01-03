var cubeImg = document.querySelector('.cubeImg');
var canvas = document.getElementById('imgCanvas');
var ctx = canvas.getContext('2d');
// var lena = require('./cube/lena.js');

ctx.drawImage(cubeImg, 0, 0);
// ctx.fillRect(25, 25, 100, 100);
// ctx.clearRect(45, 45, 60, 60);
// ctx.strokeRect(50, 50, 50, 50);
var image = new Image();
image.src = '/img/cube2.jpg';

image.onload = function() {
    getCubeData(image);
};
function getCubeData(image) {
    canvas.width = image.width / 2;
    canvas.height = image.height / 2;
}

// 红色 (255,0,0)
// 黄色（255,255,0）
// 白色 （255,255,255）
// 蓝色 （0，0，255）
// 绿色 （0，255，0）
// 橙色 （255,97,0）
function RGBtoHSV(r, g, b) {
    if (arguments.length === 1) {
        g = r.g, b = r.b, r = r.r;
    }
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return {
        h: h*360,
        s: s*100,
        v: v*100
    };
}

