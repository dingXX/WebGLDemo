var cubeImg = document.querySelector('.cubeImg');
var canvas = document.getElementById('imgCanvas');
var ctx = canvas.getContext('2d');
var kMeans = require('kmeans-js');
console.log(canvas);

ctx.drawImage(cubeImg, 0, 0);
// ctx.fillRect(25, 25, 100, 100);
// ctx.clearRect(45, 45, 60, 60);
// ctx.strokeRect(50, 50, 50, 50);
var image = new Image();
image.src = '/img/cube.jpg';

image.onload = function() {
    getCubeData(image);
};
function getCubeData(image) {
    canvas.width = image.width / 2;
    canvas.height = image.height / 2;
    // console.log(canvas.width);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    console.log(imageData);
    let pxData = imageData.data;
    // 
    for (let i = 0; i < imageData.width * imageData.height; i++) {
        //分别获取rgb的值(a代表透明度，在此处用不上)
        var r = pxData[4 * i];
        var g = pxData[4 * i + 1];
        var b = pxData[4 * i + 2];
        // let hsv = RGBtoHSV(r,g,b);
        var grey = Math.max(r,g,b);
        var min = Math.min(r,g,b);
        //运用图像学公式，设置灰度值
        // var grey = r * 0.3 + g * 0.59 + b * 0.11;
        // 红色为0°，绿色为120°,蓝色为240°。它们的补色是：黄色为60°，青色为180°,品红为300°；
        // 红 330-15
        // 绿 90-150
        // 蓝 210-270
        // 黄 45-90
        // 白 
        // 橙 15-45

        
        // let k = 0; 
        // let h = hsv.h;
        pxData[4 * i] = grey;
        pxData[4 * i + 1] = grey;
        pxData[4 * i + 2] = grey;
        if (grey<40 || min> 100) {
            pxData[4 * i + 3] = 1;
        }
    }
    //将改变后的数据重新展现在canvas上
    ctx.putImageData(imageData, 0, 0, 0, 0, canvas.width, canvas.height);
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
