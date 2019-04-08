import * as THREE from '../three/build/three.min.js';
import HUD from './HUD';
function createFace() {
    let canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    let context = canvas.getContext('2d');
    //画一个宽高都是256的黑色正方形
    context.strokeStyle = 'rgb(0,0,0)';
    context.lineWidth = 5;
    context.fillStyle = 'rgba(0,0,0,0.5)';
    context.rect(0, 0, 256, 256);
    context.stroke();
    context.fill();
    return canvas;
}
export default class RecognizeCube{
    constructor(main){
        this.main = main;
        this.init();
    }
    init(){
        this.cube = this.createdCube();
        this.group = new THREE.Group();
        this.hud = new HUD(this.main);
        this.group.add(this.cube);
        this.cube.visible = false;
        this.group.add(this.hud.plane);
        this.selectImg = this.selectImg.bind(this);

        this.introduce();
        this.main.scene.add(this.group);
       
    }
    createdCube(){
        let geometry = new THREE.BoxGeometry(100, 100, 100);
        let face = createFace();
        let texture = new THREE.Texture(face);
        texture.needsUpdate = true;
        let material = new THREE.MeshBasicMaterial({
            map: texture,
            opacity:0.5,
            transparent:true,
        });
        let cube = new THREE.Mesh(geometry, material);
        cube.rotateY(45 / 180 * Math.PI);
        cube.rotateOnAxis(new THREE.Vector3(1, 0, 1), 25 / 180 * Math.PI);
        cube.position.z = 100;
        return cube;
    }
    introduce(){
        // this.hud.draw();
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        let devicePixelRatio = window.devicePixelRatio;
        canvas.width = this.hud.realWidth;
        canvas.height = this.hud.realHight;
        let w = canvas.width;
        let h = canvas.height;
        ctx.font = 48 * devicePixelRatio + 'px serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'black';
        ctx.save();
        ctx.translate(w/2,h/4);
        ctx.fillText('请选择如下图的魔方的正反图片',0,0);
        ctx.restore();
        ctx.save();
        ctx.translate(w / 2, h / 4 * 3);
        ctx.fillText('点击屏幕任意位置选取图片', 0, 0);
        ctx.restore();
        this.loadImgs('images/cube.jpg',(img)=>{
            ctx.save();
            ctx.translate(w / 2, h / 2);
            ctx.drawImage(img,-400,-400,800,800);
            ctx.restore();
            this.hud.draw(canvas, 0, 0);
        });
        let a = wx.onTouchStart(this.selectImg);
    }
    recognize(){
        this.cube.visible = true;
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        let devicePixelRatio = window.devicePixelRatio;
        canvas.width = this.hud.realWidth;
        canvas.height = this.hud.realHight;
        let w = canvas.width;
        let h = canvas.height;
        let img = this.cubeImgs[0];
        let radio = Math.min(w/img.width,h/img.height) * 0.7;
        let drawW = radio * img.width;
        let drawH = radio * img.height;
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.drawImage(img, -drawW/2, -drawH/2, drawW, drawH);
        ctx.restore();
        this.hud.draw(canvas, 0, 0);
    }
    selectImg(){
        wx.chooseImage({
            count: 2,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success:(res)=> {
                // tempFilePath可以作为img标签的src属性显示图片
                const tempFilePaths = res.tempFilePaths;
                this.loadImgs(tempFilePaths, (imgList) => {
                    this.cubeImgs = imgList;
                    this.recognize();
                });
                wx.offTouchStart(this.selectImg);
            }
        });
    }
    loadImgs(imgSrcList,loadFn){
        let isString = 0;
        if (typeof imgSrcList === 'string') {
            imgSrcList = [imgSrcList];
            isString = 1;
        }
        let len = imgSrcList.length;
        let imgs = [];
        let doneloadNum = 0;
        for (let i = 0; i < imgSrcList.length; i++) {
            const imgSrc = imgSrcList[i];
            let img = wx.createImage();
            imgs.push(img);
            img.src = imgSrc;
            img.onload = () => {
                doneloadNum++;
                if (doneloadNum >= len && (typeof loadFn === 'function')) {
                    if (isString) {
                        imgs = imgs[0];
                    }
                    loadFn(imgs);
                }
            };
        }
    }
}