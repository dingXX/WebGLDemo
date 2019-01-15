var cubeImg = document.querySelector('.cubeImg');
var canvas = document.getElementById('imgCanvas');
var ctx = canvas.getContext('2d');
var THREE = require('three');
var AlloyFinger = require('alloyfinger');
var lena = require('./cube/lena');
console.log(lena);

var geometry = '';
var image = new Image();
image.src = '/img/cube.jpg';
let radio = '';
// 前右上
let facesIndex = [[5, 0, 2, 7], [0, 1, 3, 2], [6, 3, 2, 7]];
image.onload = function() {
    radio = Math.max(image.width / canvas.width, image.height / canvas.height);
    initSkeletonCube();
};
document.querySelector('.j_ok_btn').addEventListener('click', function() {
    getFaceImage();
});
function initSkeletonCube() {
    initEvent();
    geometry = new THREE.BoxGeometry(200, 200, 200);
    geometry.translate(250, 250, 0);
    geometry.rotateY(-(45 / 180) * Math.PI);
    geometry.rotateX(-(25 / 180) * Math.PI);
    // geometry.scale(0.5,0.5,0.5);
    console.log(geometry.vertices);
    let points = geometry.vertices;
    drawSkeletonCube(points);
}
function drawSkeletonCube(points) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, image.width / radio, image.height / radio);
    // z轴前面顺 左上5027 后面 4136
    ctx.strokeStyle = 'black';
    // 前面
    facesIndex.forEach(face => {
        ctx.beginPath();
        for (let i = 0; i < face.length; i++) {
            const faceIndex = face[i];
            let fn = i === 0 ? 'moveTo' : 'lineTo';
            ctx[fn](points[faceIndex].x, points[faceIndex].y);
        }
        ctx.closePath();
        ctx.stroke();
    });
}
function initEvent() {
    new AlloyFinger(canvas, {
        rotate: function(evt) {
            console.log(evt.angle);
        },
        pinch: function(evt) {
            console.log(evt.zoom);
        },
        touchStart: function(evt) {
            // console.log(evt);
        },
        pressMove: function(evt) {
            // console.log('pressMove');
            moveCube(evt.deltaX, evt.deltaY);
        }
    });
}
function getFaceImage() {
    let frontFace = facesIndex[2];
    let points = geometry.vertices;
    let xList = frontFace.map(i => points[i].x);
    let yList = frontFace.map(i => points[i].y);
    let minX = Math.min(...xList);
    let minY = Math.min(...yList);
    let maxX = Math.max(...xList);
    let maxY = Math.max(...yList);
    // 水平缩放, 水平倾斜, 垂直倾斜, 垂直缩放, 水平移动,垂直移动;
    let i1 = frontFace[0];
    let i2 = frontFace[1];
    let i3 = frontFace[2];
    console.log(i1, i2, i3);
    let xK =
        points[i1].x - points[i2].x
            ? (points[i1].y - points[i2].y) / (points[i1].x - points[i2].x)
            : 0;
    let yK =
        points[i2].y - points[i3].y
            ? (points[i2].x - points[i3].x) / (points[i2].y - points[i3].y)
            : 0;
    console.log('xK', xK, 'yK', yK);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // [a	c	e
    // b	d	f
    // 0	0	1]
    // setTransform(a, b, c, d, e, f);
    var m = new THREE.Matrix3();
    m.set(1, -xK, 0, -yK, 1, 0, canvas.width / 2, canvas.height / 2, 1);
    console.log(m);
    ctx.save();
    let ele = m.elements;
    ctx.setTransform(ele[0], ele[3], ele[1], ele[4], ele[2], ele[5]);
    // ctx.drawImage(
    //     image,
    //     minX * radio,
    //     minY * radio,
    //     (maxX - minX) * radio,
    //     (maxY - minY) * radio,
    //     -canvas.width / 2,
    //     -canvas.height / 2,
    //     canvas.width,
    //     canvas.height
    // );

    ctx.beginPath();

    for (let i = 0; i < frontFace.length; i++) {
        const faceIndex = frontFace[i];
        let fn = i === 0 ? 'moveTo' : 'lineTo';
        ctx[fn](
            points[faceIndex].x - canvas.width / 2,
            points[faceIndex].y - canvas.height / 2
        );
    }
    ctx.closePath();
    ctx.stroke();
    // ctx.fill();
    ctx.clip();
    ctx.drawImage(
        image,
        minX * radio,
        minY * radio,
        (maxX - minX) * radio,
        (maxY - minY) * radio,
        -canvas.width / 2 + minX,
        -canvas.height / 2 + minY,
        maxX - minX,
        maxY - minY
    );
    ctx.restore();
    // let cOrigin = new THREE.Vector2(-canvas.width / 2, -canvas.height / 2);
    // cOrigin01 = cOrigin.clone().applyMatrix3(m);
    // cOrigin01.sub(cOrigin);
    // console.log(cOrigin01);
    // let offsetX = Math.abs(cOrigin01.x);
    // ctx.clearRect(0, 0, canvas.width, offsetX);
    // ctx.clearRect(0, canvas.height - offsetX, canvas.width, offsetX);
    // let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // let sWidth = canvas.width/6;
    // let sHeight = canvas.height/6;
    // for (let i = 0; i < 3; i++) {
    //     ctx.rect();

    // }
}
function moveCube(x, y) {
    geometry.translate(x, y, 0);
    drawSkeletonCube(geometry.vertices);
}

// var image = new Image();
// image.src = '/img/cube2.jpg';

// image.onload = function() {
//     getCubeData(image);
// };

// 红色 (255,0,0)
// 黄色（255,255,0）
// 白色 （255,255,255）
// 蓝色 （0，0，255）
// 绿色 （0，255，0）
// 橙色 （255,97,0）
function RGBtoHSV(r, g, b) {
    if (arguments.length === 1) {
        (g = r.g), (b = r.b), (r = r.r);
    }
    var max = Math.max(r, g, b),
        min = Math.min(r, g, b),
        d = max - min,
        h,
        s = max === 0 ? 0 : d / max,
        v = max / 255;

    switch (max) {
        case min:
            h = 0;
            break;
        case r:
            h = g - b + d * (g < b ? 6 : 0);
            h /= 6 * d;
            break;
        case g:
            h = b - r + d * 2;
            h /= 6 * d;
            break;
        case b:
            h = r - g + d * 4;
            h /= 6 * d;
            break;
    }

    return {
        h: h * 360,
        s: s * 100,
        v: v * 100
    };
}
