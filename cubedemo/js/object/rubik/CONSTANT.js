// 基础的配置信息
export const BasicParams = {
    x: 0,
    y: 0,
    z: 0,
    layerNum: 4,
    cubeWidth: 50,
    //右、左、上、下、前、后
    //橙 红 白 黄 蓝 绿
    colors: ['#ff6b02', '#dd422f',
        '#ffffff', '#fdcd02',
        '#3d81f7', '#019d53'
    ]
};

// 还原字符串中的面的顺序
export const resolveFaceOrder = ['U', 'R', 'F', 'D', 'L', 'B'];
// 方块贴片对应的面的顺序
export const materialFaceOrder = ['R', 'L', 'U', 'D', 'F', 'B'];

export const faceOrderEnum = {
    xLine: ['U', 'B', 'D', 'F'],
    yLine: ['F', 'L', 'B', 'R'],
    zLine: ['U', 'R', 'D', 'L']
};
export const turnAxisArray = ['xLine', 'yLine', 'zLine'];