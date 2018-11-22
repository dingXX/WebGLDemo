import * as THREE from '../three/build/three.js';
export default class TouchLine {
    constructor(main) {
        this.main = main;
        //实际尺寸
        this.realWidth = 750;
        this.realHeight = 64;
        //在程序中的实体尺寸
        this.width = this.main.originWidth;
        this.height = this.realHeight * this.width / this.realWidth;
        //加载图片
        var loader = new THREE.TextureLoader();
        var that = this;
        //投影到屏幕的尺寸
        this.screenRect = {
            width: window.innerWidth,
            height: this.realHeight * window.innerWidth / this.realWidth,
            left:0
            
        } 
        this.screenRect.top = window.innerHeight / 2 - this.screenRect.height / 2;
        loader.load('images/touchLine.png', function(texture) {
            // 生成平面几何类
            var geometry = new THREE.PlaneGeometry(that.width, that.height);
            var material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true
            });
            that.plane = new THREE.Mesh(geometry, material);
            that.plane.position.set(0, 0, 0);
            that.main.scene.add(that.plane);
            // that.defaultPosition();
        }, function(xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        }, function(xhr) {
            console.log('An error happened');
        });
    }
    /**
     * 默认位置
     */
    defaultPosition() {
        this.enable();
        this.move(window.innerHeight * (1 - this.main.minPercent));
        this.disable();
    }

    enable() {
        this.isActive = true;
    }

    disable() {
        this.isActive = false;
    }

    move(y,cb) {
        if (this.isActive) {
            if (y < window.innerHeight * this.main.minPercent || y > window.innerHeight * (1 - this.main.minPercent)) {
                if (y < window.innerHeight * this.main.minPercent) {
                    y = window.innerHeight * this.main.minPercent;
                } else {
                    y = window.innerHeight * (1 - this.main.minPercent);
                }
            }

            var len = this.screenRect.top + this.screenRect.height / 2 - y; //屏幕移动距离
            this.screenRect.top = y - this.screenRect.height / 2;

            var percent = len / window.innerHeight;
            var len2 = this.main.originHeight * percent;
            this.plane.position.y += len2;
            if (typeof cb === 'function') {
                cb();
            }
        }
    }
}