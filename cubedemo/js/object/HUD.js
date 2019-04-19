import * as THREE from '../three/build/three.min.js';
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
        this.width = this.main.originWidth;
        this.height = this.main.originHeight;

        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;
        // 实际尺寸和实体大小的比例
        this.radio = this.main.originWidth / this.realWidth;
        // 实体大小和屏幕的尺寸关系
        this.uiRadio = this.main.originWidth / window.innerWidth;
        // 屏幕尺寸与实际尺寸比
        this.srRadio = this.screenWidth / this.realWidth;
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
        this.plane.position.set(0, 0, 0);
    }
    /**
     * 重绘
     * @return {void}
     */
    draw(image) {
        console.log('draw');
        let ctx = this.ctx;
        let canvas = this.canvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        this.updateTexture();
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
    getRealPixel(x){
        return x/this.srRadio;
    }
    show(){
        this.main.scene.add(this.plane);
    }
    hide(){
        this.main.scene.remove(this.plane);
    }
}