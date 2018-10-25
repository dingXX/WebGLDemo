var Matrix = require('cuon-matrix-ts');
var Matrix4 = Matrix.Mat4;
var vertexShaderSource = document.querySelector('#shader-vs').innerHTML;
var fragmentShaderSource = document.querySelector('#shader-fs').innerHTML;
var EyePoint = { //视点以及默认位置
    x: 8.0,
    y: 16.0,
    z: 24.0
};
var PerspParams = { //透视投影参数
    fovy: 45.0,
    g_near: 1.0,
    g_far: 1000.0
};
var width = window.innerWidth;
var height = window.innerHeight;

window.onload = function() {
    createWorld();
}

function createWorld() {
    var gl = initRender(); //创建渲染器
    var shaderPorgram = initShaders(gl); //初始化着色器程序
    var cameraMatrix = initCamera(); //创建相机
    initLight(gl, shaderPorgram); //创建光源
    var num = initObject(gl, shaderPorgram); //创建物体
    render(gl, num, shaderPorgram, cameraMatrix); //渲染
}

function initRender() {
    var canvas = document.querySelector('#myCanvas');
    canvas.width = width;
    canvas.height = height;
    var gl = canvas.getContext('webgl'); //获取webgl上下文
    gl.clearColor(1.0, 1.0, 1.0, 1.0); //设置背景颜色
    gl.enable(gl.DEPTH_TEST); //开启隐藏面消除
    return gl;
}

function initCamera() {
    var viewMatrix = new Matrix4(); //视图矩阵
    viewMatrix.setLookAt(EyePoint.x, EyePoint.y, EyePoint.z, 0, 0, 0, 0, 1, 0);
    var projMatrix = new Matrix4(); //透视投影矩阵
    projMatrix.setPerspective(PerspParams.fovy, width / height, PerspParams.g_near, PerspParams.g_far);
    var cameraMatrix = projMatrix.multiply(viewMatrix);
    return cameraMatrix;
}

function initLight(gl, shaderPorgram) {
    //点光源
    // 给片段着色器复制
    var u_LightColor = gl.getUniformLocation(shaderPorgram, 'u_LightColor');
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    var u_LightPosition = gl.getUniformLocation(shaderPorgram, 'u_LightPosition');
    gl.uniform3f(u_LightPosition, 2.5, 4.0, 3.5);
    //环境光
    var u_AmbientLight = gl.getUniformLocation(shaderPorgram, 'u_AmbientLight');
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
}

function initObject(gl, shaderPorgram) {
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    //顶点
    var vertices = new Float32Array([
        2.0, 2.0, 2.0, -2.0, 2.0, 2.0, -2.0, -2.0, 2.0, 2.0, -2.0, 2.0, // v0-v1-v2-v3 front
        2.0, 2.0, 2.0, 2.0, -2.0, 2.0, 2.0, -2.0, -2.0, 2.0, 2.0, -2.0, // v0-v3-v4-v5 right
        2.0, 2.0, 2.0, 2.0, 2.0, -2.0, -2.0, 2.0, -2.0, -2.0, 2.0, 2.0, // v0-v5-v6-v1 up
        -2.0, 2.0, 2.0, -2.0, 2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, 2.0, // v1-v6-v7-v2 left
        -2.0, -2.0, -2.0, 2.0, -2.0, -2.0, 2.0, -2.0, 2.0, -2.0, -2.0, 2.0, // v7-v4-v3-v2 down
        2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, 2.0, -2.0, 2.0, 2.0, -2.0 // v4-v7-v6-v5 back
    ]);
    //颜色
    // var colors = new Float32Array([
    //     1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v0-v1-v2-v3 front
    //     1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v0-v3-v4-v5 right
    //     1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v0-v5-v6-v1 up
    //     1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v1-v6-v7-v2 left
    //     1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, // v7-v4-v3-v2 down
    //     1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0　 // v4-v7-v6-v5 back
    // ]);
    var faceColors = [
        [1.0, 0.0, 0.0, 1.0], // 正面
        [0.0, 1.0, 0.0, 1.0], // 背面
        [0.0, 0.0, 1.0, 1.0], // 顶面
        [1.0, 1.0, 0.0, 1.0], // 底面
        [1.0, 0.0, 1.0, 1.0], // 右面
        [0.0, 1.0, 1.0, 1.0] // 左面
    ];
    var colors = [];
    for (var i in faceColors) {
        var color = faceColors[i];
        for (var j = 0; j < 4; j++) {
            colors = colors.concat(color);
        }
    }
    colors = new Float32Array(colors);
    //法向量
    var normals = new Float32Array([
        0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, // v0-v1-v2-v3 front
        1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // v0-v3-v4-v5 right
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, // v0-v5-v6-v1 up
        -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
        0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, // v7-v4-v3-v2 down
        0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0 // v4-v7-v6-v5 back
    ]);
    //索引
    var indices = new Uint8Array([
        0, 1, 2, 0, 2, 3, // front
        4, 5, 6, 4, 6, 7, // right
        8, 9, 10, 8, 10, 11, // up
        12, 13, 14, 12, 14, 15, // left
        16, 17, 18, 16, 18, 19, // down
        20, 21, 22, 20, 22, 23 // back
    ]);
    var num = indices.length;
    // 给对应的定点着色器的变量指定值
    if (!_initElementBuffer(gl, indices)) return -1; //创建索引缓冲区
    if (!_initArrayBuffer(gl, shaderPorgram, 'a_Normal', normals, 3, gl.FLOAT)) return -1; //创建法向量缓冲区
    if (!_initArrayBuffer(gl, shaderPorgram, 'a_Position', vertices, 3, gl.FLOAT)) return -1; //创建顶点缓冲区
    if (!_initArrayBuffer(gl, shaderPorgram, 'a_Color', colors, 3, gl.FLOAT)) return -1; ////创建颜色缓冲区
    return num;
}
var rotateAngle = 0;

function render(gl, num, shaderPorgram, cameraMatrix) {
    //模型矩阵
    rotateAngle += .3;
    var modelMatrix = new Matrix4();
    modelMatrix.rotate(rotateAngle, 1, 0, 0);
    modelMatrix.rotate(rotateAngle, 0, 1, 0);
    var u_ModelMatrix = gl.getUniformLocation(shaderPorgram, 'u_ModelMatrix');
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

    //投影矩阵
    var mvpMatrix = cameraMatrix;
    var originMatrix = new Matrix4();
    for (var i = 0; i < cameraMatrix.elements.length; i++) {
        originMatrix.elements[i] = cameraMatrix.elements[i];
    }
    mvpMatrix.multiply(modelMatrix);
    // 返回特定统一变量的位置
    var u_MvpMatrix = gl.getUniformLocation(shaderPorgram, 'u_MvpMatrix');
    // 为统一变量指定矩阵值
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    //法向量变换矩阵
    var normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    var u_NormalMatrix = gl.getUniformLocation(shaderPorgram, 'u_NormalMatrix');
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, num, gl.UNSIGNED_BYTE, 0);
    requestAnimationFrame(function() {
        render(gl, num, shaderPorgram, originMatrix);
    });
}
//初始化索引缓冲区
function _initElementBuffer(gl, data) {
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object!');
        return false;
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
    //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);//没有绘制完成之前并不能解绑
    return true;
}
//初始化数据缓冲区
function _initArrayBuffer(gl, shaderPorgram, attribute, data, num, type) {
    //创建缓冲区
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object!');
        return false;
    }
    //将缓冲区对象绑定到目标
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    //把缓冲区数据赋予指定变量
    //
    var a_attribute = gl.getAttribLocation(shaderPorgram, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    // 将当前绑定的缓冲区绑定到当前顶点缓冲区对象的通用顶点属性，并指定其布局
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    gl.enableVertexAttribArray(a_attribute);
    //解绑缓冲区
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    return true;
}



function initShaders(gl) {
    // 加载并编译片段和顶点着色器
    var fragmentShader = createShader(gl, fragmentShaderSource,
        "fragment");
    var vertexShader = createShader(gl, vertexShaderSource,
        "vertex");
    // 将它们链接到一段新的程序中
    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log("Could not initialise shaders");
        return false;
    }
    //链接成功后激活渲染器程序
    gl.useProgram(shaderProgram);
    return shaderProgram;
};
// 着色器代码
function createShader(gl, str, type) {
    var shader;
    if (type == "fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (type == "vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}