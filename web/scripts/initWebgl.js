/**
 * [initWebGL 从 canvas 中获取 WebGL 绘图上下文]
 * @param  {[type]} canvas [description]
 * @return {[type]}        [description]
 */
function initWebGL(canvas) {
    var gl;
    var msg = "Your browser does not support WebGL, " +
        "or it is not enabled by default.";
    try {
        // "webgl" 或 "experimental-webgl"（较老版本的浏览器）用于获取 WebGL 绘图上下文。新的浏览器同时兼容 "experimental-webgl" 和 "webgl" 参数。
        gl = canvas.getContext("experimental-webgl");
    } catch (e) {
        msg = "Error creating WebGL Context!: " + e.toString();
    }
    if (!gl) {
        alert(msg);
        throw new Error(msg);
    }
    return gl;
}

/**
 * [initViewPort 定义一个绘制区域的矩形边界]
 * @param  {[type]} gl     [canvas上下文]
 * @param  {[type]} canvas [description]
 * @return {[type]}        [description]
 */
function initViewPort(gl, canvas) {
    gl.viewPort(0, 0, canvas.width, canvas.height);
}

/**
 * [createSquare 创建顶点缓冲数据]
 * @param  {[type]} gl [description]
 * @return {[type]}    [description]
 */
function createSquare(gl) {
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    var verts = [
        .5, .5, 0.0, -.5, .5, 0.0,
        .5, -.5, 0.0, -.5, -.5, 0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    var square = {
        buffer: vertexBuffer,
        vertSize: 3,
        nVerts: 4,
        primtype: gl.TRIANGLE_STRIP
    };
    return square;
}

var projectionMatrix, modelViewMatrix;
/**
 * [initMatrices 初始化投影矩阵和模型 - 视图矩阵]
 * @param  {[type]} canvas [description]
 * @return {[type]}        [description]
 */
function initMatrices(canvas) {
    // 创建一个模型-视图矩阵，包含一个位于(0, 0, -3.333)的相机
    // glMatrix 的开源库（https://github.com/toji/gl-matrix）
    modelViewMatrix = mat4.create();
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -3.333]);
    // 创建一个45度角视野的投影矩阵
    projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4,
        canvas.width / canvas.height, 1, 10000);
}

/**
 * [createShader 着色器代码]
 * @param  {[type]} gl   [description]
 * @param  {[type]} str  [description]
 * @param  {[type]} type [description]
 * @return {[type]}      [description]
 */
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
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}


var shaderProgram, shaderVertexPositionAttribute,
    shaderProjectionMatrixUniform,
    shaderModelViewMatrixUniform;

/**
 * [initShader 初始化着色器]
 * @param  {[type]} gl [description]
 * @return {[type]}    [description]
 */
function initShader(gl) {
    // 加载并编译片段和顶点着色器
    var fragmentShader = createShader(gl, fragmentShaderSource,
        "fragment");
    var vertexShader = createShader(gl, vertexShaderSource,
        "vertex");
    // 将它们链接到一段新的程序中
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    // 获取指向着色器参数的指针
    shaderVertexPositionAttribute = gl.getAttribLocation(shaderProgram, "vertexPos");
    gl.enableVertexAttribArray(shaderVertexPositionAttribute);
    shaderProjectionMatrixUniform = gl.getUniformLocation(shaderProgram, "projectionMatrix");
    shaderModelViewMatrixUniform = gl.getUniformLocation(shaderProgram, "modelViewMatrix");
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Could not initialise shaders");
    }
}

function draw(gl, obj) {
    // 清空背景（使用黑色填充）
    // WebGL 的 RGBA 值是用 0.0 到 1.0 范围的浮点数来表示的
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // 设置待绘制的顶点缓冲
    gl.bindBuffer(gl.ARRAY_BUFFER, obj.buffer);
    // 设置待用的着色器
    gl.useProgram(shaderProgram);
    // 建立着色器参数之间的关联：顶点和投影/模型矩阵
    gl.vertexAttribPointer(shaderVertexPositionAttribute,
        obj.vertSize, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(shaderProjectionMatrixUniform, false,
        projectionMatrix);
    gl.uniformMatrix4fv(shaderModelViewMatrixUniform, false,
        modelViewMatrix);
    // 绘制物体
    gl.drawArrays(obj.primtype, 0, obj.nVerts);
}

function createCube(gl) {
    // 顶点数据
    var vertexBuffer;
    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    var verts = [
        // 正面
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
        // 背面
        -1.0, -1.0, -1.0, -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,
        // 顶面
        -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,
        // 底面
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
        // 右面
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,
        // 左面
        -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    // 颜色数据
    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    var faceColors = [
        [1.0, 0.0, 0.0, 1.0], // 正面
        [0.0, 1.0, 0.0, 1.0], // 背面
        [0.0, 0.0, 1.0, 1.0], // 顶面
        [1.0, 1.0, 0.0, 1.0], // 底面
        [1.0, 0.0, 1.0, 1.0], // 右面
        [0.0, 1.0, 1.0, 1.0] // 左面
    ];
    var vertexColors = [];
    for (var i in faceColors) {
        var color = faceColors[i];
        for (var j = 0; j < 4; j++) {
            vertexColors = vertexColors.concat(color);
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors),
        gl.STATIC_DRAW);
    // 索引数据（定义待绘制的三角形）
    var cubeIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndexBuffer);
    var cubeIndices = [
        0, 1, 2, 0, 2, 3, // 正面
        4, 5, 6, 4, 6, 7, // 背面
        8, 9, 10, 8, 10, 11, // 顶面
        12, 13, 14, 12, 14, 15, // 底面
        16, 17, 18, 16, 18, 19, // 右面
        20, 21, 22, 20, 22, 23 // 左面
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeIndices),
        gl.STATIC_DRAW);
    var cube = {
        buffer: vertexBuffer,
        colorBuffer: colorBuffer,
        indices: cubeIndexBuffer,
        vertSize: 3,
        nVerts: 24,
        colorSize: 4,
        nColors: 24,
        nIndices: 36,
        primtype: gl.TRIANGLES
    };
    return cube;
}