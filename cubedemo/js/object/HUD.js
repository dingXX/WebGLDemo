import * as THREE from '../three/build/three.js';

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
        // this.ctx.fillStyle = 'black';
        // this.ctx.globalAlpha = 0.2;
        this.ctx.fillRect(0, 0, this.realWidth, this.realHight);
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
    }
    /**
     * 添加内容
     * @param {img|canvas} imgOBj 添加的内容
     * @param {number} x 在屏幕中的x位置
     * @param {number} y 在屏幕中的y位置
     * @return {void}
     */
    addObject(img,x,y){
        let imgOBj = {img,position:{x,y}};
        this.children.push(imgOBj);
        this.draw();
    }
    /**
     * 重绘
     * @return {void}
     */
    draw(){
        this.ctx.clearRect(0, 0, this.realWidth,this.realHight);
        let devicePixelRatio = this.devicePixelRatio;
        console.log(devicePixelRatio);
        for (let i = 0; i < this.children.length; i++) {
            let {img,position} = this.children[i];
            let {x,y} = position;
            this.ctx.drawImage(img, x * devicePixelRatio, y * devicePixelRatio, img.width * devicePixelRatio, img.height * devicePixelRatio);
        }
    }
}