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
        console.log(this.plane);
        this.plane.position.set(0, 0, this.main.camera.position.z/2);
        this.main.scene.add(this.plane);
        this.children = [];
        this.draw();
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
    draw() {
        this.ctx.clearRect(0, 0, this.realWidth,this.realHight);
        let devicePixelRatio = this.devicePixelRatio;
        // this.ctx.fillStyle = 'black';
        // this.ctx.globalAlpha = 0.2;
        // this.ctx.fillRect(0, 0, this.realWidth, this.realHight);
        this.ctx.font = 48 * this.devicePixelRatio + 'px serif';
        this.ctx.globalAlpha = 1;
        this.ctx.fillText('Hello world', 100 * this.devicePixelRatio, 100 * this.devicePixelRatio);


        let ctx = this.ctx;
        ctx.save();
        ctx.translate(200 * devicePixelRatio, 200 * devicePixelRatio);
        ctx.rect(0,0,80*devicePixelRatio,60*devicePixelRatio);
        ctx.lineWidth = 4 * devicePixelRatio;
        ctx.strokeStyle = '#44b549';
        ctx.stroke();
        ctx.font = 24 * devicePixelRatio + 'px serif ';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText('重置', 42 * devicePixelRatio, 32 * devicePixelRatio);

        ctx.restore();
        ctx.save();
        ctx.translate(300 * devicePixelRatio, 200 * devicePixelRatio);
        let img = createBtn('测试');
        ctx.drawImage(img, 0, 0, img.width * devicePixelRatio, img.height * devicePixelRatio);
        ctx.restore();
        
        var loader = new THREE.TextureLoader();
        loader.load('images/touchLine.png', (texture)=>{
            ctx.save();
            ctx.translate(0,300);
            let img = texture.image;
            ctx.drawImage(img, 0, 0, img.width * devicePixelRatio, img.height * devicePixelRatio);
            ctx.restore();
            this.updateTexture();
        });
        

        // for (let i = 0; i < this.children.length; i++) {
        //     let {img,position} = this.children[i];
        //     let {x,y} = position;
        //     this.ctx.drawImage(img, x * devicePixelRatio, y * devicePixelRatio, img.width * devicePixelRatio, img.height * devicePixelRatio);
        // }
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