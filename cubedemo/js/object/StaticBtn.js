import * as THREE from '../three/build/three.js';
export default class TouchLine {
    constructor(main,pic,x,y) {
        this.main = main;
        
        this.radio = this.main.originWidth / 750;
        
        //加载图片

        var loader = new THREE.TextureLoader();

        loader.load(pic, (texture) => {
            // 生成平面几何类
            let img = texture.image;
            //实际尺寸
            this.realWidth = img.width;
            this.realHeight = img.height;
            //在程序中的实体尺寸
            this.width = this.realWidth * this.radio;
            this.height = this.width;
            this.uiRadio = this.main.originWidth / window.innerWidth;
            //屏幕尺寸
            this.screenRect = {
                width: this.width / this.uiRadio,
                height: this.height / this.uiRadio
            }

            var geometry = new THREE.PlaneGeometry(this.width, this.height);
            var material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true
            });
            this.plane = new THREE.Mesh(geometry, material);
            this.plane.position.set(0, 0, 0);
            this.main.scene.add(this.plane);
            this.defaultPosition(x,y);

        }, (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        }, (xhr) => {
            console.log('An error happened');
        });
    }
    /**
     * 默认位置
     * x,y : 屏幕左上角位置
     */
    defaultPosition(x=0,y=0) {
        this.plane.position.x = -this.main.originWidth / 2 + this.width / 2 + x * this.radio;
        this.plane.position.y = this.main.originHeight / 2 - this.height / 2 - y * this.radio;
        console.log(this.plane.position.x,this.plane.position.y);
        this.screenRect.left = (this.main.originWidth / 2 + this.plane.position.x - this.width / 2) / this.uiRadio;
        this.screenRect.top = (this.main.originHeight / 2 - this.plane.position.y - this.height / 2) / this.uiRadio;
    }

    /**
     * 判断是否在范围内
     */
    isHover(touch) {
        var isHover = false;
        if (touch.clientY >= this.screenRect.top && touch.clientY <= this.screenRect.top + this.screenRect.height && touch.clientX >= this.screenRect.left && touch.clientX <= this.screenRect.left + this.screenRect.width) {
            isHover = true;
        }
        return isHover;
    }

    enable() {
        this.isActive = true;
    }
    disable() {
        this.isActive = false;
    }
}