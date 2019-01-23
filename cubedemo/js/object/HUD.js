import * as THREE from '../three/build/three.js';
function createBtn(txt) {
    let canvas = document.createElement('canvas');
    canvas.width = 84;
    canvas.height = 64;
    let ctx = canvas.getContext('2d');
    //在内部用某颜色的16px宽的线再画一个宽高为224的圆角正方形并用改颜色填充
    ctx.rect(2,2,80,60);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#44b549';
    ctx.stroke();
    ctx.fillStyle = 'black';
    ctx.font = '24px serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(txt, 42, 32);
    return canvas;
}
/**
 * 平视显示器
 */
export default class HUD {
    /**
     * 构造器
     * @param {threejs} main  threejs实例
     * @return {void}
     */
    constructor(main) {
        this.main = main;

        // 实际尺寸
        this.devicePixelRatio = window.devicePixelRatio;
        this.realWidth = 750 * this.devicePixelRatio;
        this.realHight = window.innerHeight * (this.realWidth / window.innerWidth);

        // 在程序中的实体大小
        this.width = this.main.originWidth/2;
        this.height = this.main.originHeight/2;

        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        // 实际尺寸和实体大小的比例
        this.radio = this.main.originWidth / this.realWidth;
        // 实体大小和屏幕的尺寸关系
        this.uiRadio = this.main.originWidth / window.innerWidth;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.realWidth;
        this.canvas.height = this.realHight;
        
        var texture = new THREE.Texture(this.canvas);
        texture.needsUpdate = true;
        var geometry = new THREE.PlaneGeometry(this.width, this.height);
        var material = new THREE.MeshBasicMaterial({
            map: texture,
            // color:0xff0000
            transparent: true
        });
        this.plane = new THREE.Mesh(geometry, material);
        this.plane.position.set(0, 0, this.main.camera.position.z/2);
        this.main.scene.add(this.plane);
        this.children = [];
        this.draw();
    }
    /**
     * 添加内容
     * @param {childObj} 
     * @return {void}
     */
    addObject(childObj){
        this.children.push(childObj);
        this.draw();
    }
    /**
     * 重绘
     * @return {void}
     */
    draw() {
    }
    /**
     * 更新texture
     * @returns {void}
     */
    updateTexture(){
        let texture = new THREE.Texture(this.canvas);
        texture.needsUpdate = true;
        this.plane.material.setValues({
            map: texture
        });
    }
}