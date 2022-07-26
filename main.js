let canvas = document.querySelector("canvas");
canvas.width = window.innerWidth+5;
canvas.height = window.innerHeight+5;

/*
//black theme
let PointColor = "#000";
let LineColor = "#000";
let SubdotColor = "#000";
let SublineColor = "#0008";
let BigdotColor = "#000";
*/

//neon theme
let BackColor = "#555";
let PointColor = "#52ffc7";
let LineColor = "#bcffe9";
let SubdotColor = "#52afff";
let SublineColor = "#fff8";
let BigdotColor = "#ff52c9";



//these represent what's drawn on canvas
class Point {
    next = null;
    prev = null;
    r = 8;
    dor_r = 3.3;
    constructor(container, x, y) {
        this.x = x;
        this.y = y;
        this.container = container;
    }
    draw(x, y, color) {
        if (x === undefined)({
            x,
            y
        } = this);
        let {
            ctx
        } = this.container;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI*2);
        ctx.arc(x, y, 6, 0, Math.PI*2, true);
        ctx.arc(x, y, this.dor_r, 0, Math.PI*2);
        ctx.closePath();
        ctx.fillStyle = color || PointColor;
        ctx.fill();
    }
    moving = false;
    mousedown(x, y) {
        this.dor_r = 4;
        this.moving = true;
        let {container} = this;
        let that = this;
        container.disableEvents = true;
        container.ghostPoint.visible = false;
        let handleMouseMove = (e)=>{
            let [x, y] = container.evtToCoords(e);
            if (!that.moving) return;
            that.x = x;
            that.y = y;
        };
        let handleMouseUp = ()=>{
            that.moving = false;
            container.disableEvents = false;
            container.canvas.removeEventListener("mousemove",handleMouseMove);
            container.canvas.removeEventListener("mouseup",handleMouseUp);
        }
        container.canvas.addEventListener("mousemove",handleMouseMove);
        container.canvas.addEventListener("mouseup",handleMouseUp);
    }
    mousemove() {
    }
    mouseup() {
    }
    mouseenter() {
        this.dor_r = 4;
    }
    mouseleave() {
        this.dor_r = 3.3;
    }
    isColliding(x, y) {
        let dx = x - this.x;
        let dy = y - this.y;
        let r2 = dx * dx + dy * dy;
        return r2 < this.r * this.r;
    }
};

class Line {
    r = 5; //collision box size
    lineWidth = 1;
    constructor(container, p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
        this.container = container;
    }
    draw() {
        let {
            p1,
            p2,
            container
        } = this;
        let {
            ctx
        } = container;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = LineColor;
        ctx.lineWidth = this.lineWidth;
        ctx.stroke();
    }
    mouseenter(x, y) {
        let gp = this.container.ghostPoint;
        this.lineWidth = 2;
        gp.visible = true;
    }
    mousemove(x, y) {
        let gp = this.container.ghostPoint;
        gp.x = x;
        gp.y = y;
    }
    mouseleave() {
        let gp = this.container.ghostPoint;
        this.lineWidth = 1;
        gp.visible = false;
    }
    down = false;
    mousedown(x,y) {
        this.down = true;
        let {
            p1,
            container
        } = this;
        let p2 = new Point(container, x, y);
        container.points.set(p2, true);
        let p3 = this.p2;
        this.p2 = p2;
        let line1 = new Line(container, p2, p3);
        container.lines.set(line1, true);
        p1.next = p2;
        p2.prev = p1;
        p2.next = p3;
        p3.prev = p2;
        
        let gp = this.container.ghostPoint;
        this.lineWidth = 1;
        gp.visible = true;
        p2.mousedown(x,y);
    }
    mouseup(x, y) {
        this.down = false;
    }
    isColliding(x, y) {
        let {
            p1,
            p2
        } = this;
        x -= p1.x;
        y -= p1.y;
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        let cos = dx / d;
        let sin = dy / d;
        let xx = x * cos + y * sin;
        let yy = x * sin - y * cos;
        return Math.abs(yy) < this.r && 0 < xx && xx < d;
    }
};


class Container {
    r = 0; //0 to 1
    pointHead = null; //pointer to ll head
    pointTail = null; //pointer to ll tail
    lines = new Map();
    points = new Map();
    ghostPoint = {
        visible: false,
        x: 0,
        y: 0
    };
    disableEvents = false;
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        let prevPointed = null;
        let that = this;
        canvas.addEventListener("mousemove", (e) => {
            if(that.disableEvents)return;
            let [x, y] = that.evtToCoords(e);
            let pointed = that.getPointed(x, y);
            if (pointed !== prevPointed) {
                if(prevPointed)prevPointed.mouseleave(x, y);
                if(pointed)pointed.mouseenter(x, y);
                prevPointed = pointed;
            }
            if(pointed)pointed.mousemove(x, y);
        });
        canvas.addEventListener("mousedown", (e) => {
            if(that.disableEvents)return;
            let [x, y] = that.evtToCoords(e);
            let pointed = that.getPointed(x, y);
            if (!pointed) return;
            pointed.mousedown(x, y);
        });
        canvas.addEventListener("mouseup", (e) => {
            if(that.disableEvents)return;
            let [x, y] = that.evtToCoords(e);
            let pointed = that.getPointed(x, y);
            if (!pointed) return;
            pointed.mouseup(x, y);
        });
    }
    evtToCoords(e) {
        let rect = this.canvas.getBoundingClientRect();
        let x = e.pageX - window.scrollX - rect.left; //x position within the element.
        let y = e.pageY - window.scrollY - rect.top; //y position within the element.
        return [x, y];
    }
    appendPoint(x, y) {
        let p = new Point(this, x, y);
        this.points.set(p, true);
        if (!this.pointTail) {
            this.pointHead = p;
        } else {
            let tail = this.pointTail;
            tail.next = p;
            p.prev = tail;
            let line = new Line(this, tail, p);
            this.lines.set(line, true);
        }
        this.pointTail = p;
    }
    getPointed(x, y) {
        let result = null;
        this.points.forEach((_, point) => {
            if (point.isColliding(x, y))
                result = point;
        });
        if (result) return result;
        this.lines.forEach((_, line) => {
            if (line.isColliding(x, y))
                result = line;
        });
        return result;
    }
    animating = false;
    pausing = false;
    animationPeriod = 3000;//milliseconds
    animationStart = 0;
    drawFrame(t,dt) {
        let {
            ctx,
            canvas
        } = this;
        let {
            width,
            height
        } = canvas;
        ctx.fillStyle = BackColor;
        ctx.fillRect(0, 0, width, height);
        this.points.forEach((_, point) => point.draw());
        this.lines.forEach((_, line) => line.draw());
        let gp = this.ghostPoint;
        if (gp.visible) {
            this.pointHead.draw(gp.x, gp.y, PointColor+"44");
        }
        
        
        //finally, if the animation is active, draw it
        if(this.animating === true){
            if(this.pausing)this.animationStart += dt;
            if(this.animationStart === 0){
                this.animationStart = t;
            }
            let r = (t-this.animationStart)/this.animationPeriod;
            if(r >= 1){
                r = 1;
                this.animationStart = 0;
                this.animating = false;
                this.onAnimationEnd();
            }
            //loop throught the point linked list
            let arr = [];
            for(let point = this.pointHead; point !== null && point.next !== null; point = point.next){
                let p1 = point;
                let p2 = point.next;
                let dx = p2.x-p1.x;
                let dy = p2.y-p1.y;
                let x = p1.x+dx*r;
                let y = p1.y+dy*r;
                ctx.beginPath();
                ctx.arc(x,y,3,0,Math.PI*2);
                ctx.fillStyle = SubdotColor;
                ctx.fill();
                arr.push([x,y]);
            }
            while(arr.length > 1){
                for(let i = 0; i < arr.length-1; i++){
                    let p1 = arr[i];
                    let p2 = arr[i+1];
                    let dx = p2[0]-p1[0];
                    let dy = p2[1]-p1[1];
                    let x = p1[0]+dx*r;
                    let y = p1[1]+dy*r;
                    //draw line
                    ctx.beginPath();
                    ctx.moveTo(p1[0],p1[1]);
                    ctx.lineTo(p2[0],p2[1]);
                    ctx.strokeStyle = SublineColor;
                    ctx.stroke();
                    //draw point
                    ctx.beginPath();
                    ctx.arc(x,y,3,0,Math.PI*2);
                    ctx.fillStyle = SubdotColor;
                    ctx.fill();
                    arr[i][0] = x;
                    arr[i][1] = y;
                }
                arr.pop();
            }
            let [bx,by] = arr[0];
            //draw the big point
            ctx.beginPath();
            ctx.arc(bx,by,6,0,Math.PI*2);
            ctx.fillStyle = BigdotColor;
            ctx.fill();
        }
    }
    initialize() {
        let that = this;
        let animate = true;
        let s = 0;
        let cb = function(t) {
            if (s === 0) s = t;
            let dt = t - s;
            s = t;
            that.drawFrame(t, dt);
            requestAnimationFrame(cb);
        };
        requestAnimationFrame(cb);
        return {
            cancel: () => {
                animate = false;
            }
        }
    }
    onAnimationEnd(){
        //dummy
    }
};


let cc = new Container(canvas);
let template = [[0,0],[0.07314442185620045,0.579005423292582],[0.33465887954284124,0.5312535385951661],[0.36812476749712525,0],[0.7290782732897613,0.13640293558524533],[0.6199643197942164,0.4834084015074914],[0.7294942538273244,0.7977755308392315],[0.980085466539435,1],[1,0.5551061678463093],[0.9968053769240345,0]];
let iw = canvas.width*0.9-20;
let ih = canvas.height*0.9-20;
let offsetX = (canvas.width-iw)/2;
let offsetY = (canvas.height-ih)/2;
template.map(([x,y])=>{
    cc.appendPoint(offsetX+x*iw, offsetY+y*ih);
});
cc.initialize();




//controls and stuff
//this is where the real CSS porn begins XD
//raw dom === pain, wrapped dom === good
class Elem{
    constructor(tag,attrs,inner){
        let e;
        if(tag instanceof Element){
            e = tag;
        }else{
            e = document.createElement(tag);
        }
        for(let key in attrs){
            e.setAttribute(key,attrs[key]);
        }
        e.innerHTML = inner || "";
        this.e = e;
        this.classList = e.classList;
    }
    add(tag,attrs,inner){
        let elem = new Elem(tag,attrs,inner);
        this.e.appendChild(elem.e);
        return elem;
    }
    on(evt,cb){
        this.e.addEventListener(evt,cb);
    }
    set innerHTML(s){this.e.innerHTML = s;}
    get innerHTML(){return this.e.innerHTML;}
};


let controls = new Elem(document.querySelector("#controls"));
let wrapper = controls.add("div",{class:"wrapper"});
//down up toggle
let toggle = controls.add("div",{class:"toggle"});
controls.collapsed = false;
toggle.on("click",()=>{
    if(controls.collapsed){
        controls.classList.remove("collapsed");
    }else{
        controls.classList.add("collapsed");
    }
    controls.collapsed = !controls.collapsed;
});


let row = wrapper.add("div",{class:"row"});

//speed
row.add("span",{},"Speed: ");
let range = row.add("input",{type:"range",step:"0.001",min:"0",max:"10",value:"7",class:"range"});
range.on("input",()=>{
    let val = 10-range.e.value;
    cc.animationPeriod = val*1000;
});

//play button
let play = row.add("div",{class:"play"},"start");
cc.onAnimationEnd = function(){
    play.innerHTML = "start";
    play.classList.remove("stop");
};
play.on("click",()=>{
    if(cc.animating && !cc.pausing){
        //animating -> pausing
        cc.pausing = true;
        play.innerHTML = "start";
        play.classList.remove("stop");
    }else{
        //not animating -> animating
        cc.animating = true;
        cc.pausing = false;
        play.innerHTML = "stop";
        play.classList.add("stop");
    }
});

//description
let p = wrapper.add("p",{},"Drag points to move them around, and click on lines to add new points");

