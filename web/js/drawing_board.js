
class DrawPad {
    constructor(container, sizeX=1200, sizeY=600) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = sizeX;
        this.canvas.height = sizeY;
        this.canvas.style=`
            background-color:white;
            box-shadow: 0px 0px 10px 2px black;
        `;
        container.appendChild(this.canvas);
        this.ctx=this.canvas.getContext("2d");

        this.reset();
        this.#setupDrawEvent()
    }

    reset() {
        this.paths = [];
        this.ratio = 1;
        this.isDrawing = false;
        this.shiftDown = false;
        this.originalMouseXY = null;
        this.redraw();
    }

    #setupDrawEvent() {
        this.canvas.onmousedown=(env) => {
            var mouseXY = this.#getMouseXY(env);
            this.paths.push([mouseXY]);
            this.isDrawing = true;
        }

        this.canvas.onmousemove=(env) => {
            this.#captureMouse(env);
            if( this.#moveDrawing(env) ) {
                return;
            }
            this.#doDrawing(env);
        }

        this.canvas.onmouseout=(env) => {
            this.#resetImageMove();
        }

        document.onmouseup=(env) => {
            this.isDrawing = false;
        }

        document.onkeydown=(env) => {
            if( env.shiftKey ) {
                this.shiftDown = true;
            }
        }

        document.onkeyup=(env) => {
            //console.log("key up");
            if( this.shiftDown ) {
                this.#resetImageMove();
                //console.log("shift key up");
            }
        }
    }

    #resetImageMove() {
        this.shiftDown = false;
        this.originalMouseXY = null;
    }

    #getMouseXY=(env)=>{
        const canvaXY = this.canvas.getBoundingClientRect();
        return [
           parseInt(env.clientX - canvaXY.left + 0.5),
           parseInt(env.clientY - canvaXY.top + 0.5)
        ];
     }

    #doDrawing(env) {
        if (! this.isDrawing ) {
            return;
        }
        var mouseXY = this.#getMouseXY(env);
        var i = this.paths.length - 1;
        this.paths[i].push(mouseXY);
        this.redraw();
    }

    #moveDrawing(env) {
        if (! this.shiftDown) {
            return false;
        }
        if( this.originalMouseXY == null ) {
            this.originalMouseXY = this.#getMouseXY(env);
            //console.log("mouse original: ");
            //console.log(this.originalMouseXY);
            return;
        }
        var mouseXY = this.#getMouseXY(env);
        var x_diff = mouseXY[0] - this.originalMouseXY[0];
        var y_diff = mouseXY[1] - this.originalMouseXY[1];
        //console.log("mouse xy: " + mouseXY[0] + "," + mouseXY[1]);
        //console.log("diff: " + x_diff + ", " + y_diff);
        this.redraw(x_diff, y_diff);
        this.originalMouseXY = mouseXY;
        return true;
    }

    #captureMouse(env) {
        if (this.shiftDown) {
            return;
        }
        //this.originalMouseXY = this.#getMouseXY(env);
    }

    redraw(xOffset=0, yOffset=0){
        this.ctx.clearRect(0,0, this.canvas.width,this.canvas.height);
        this.drawPaths(xOffset, yOffset);
    }

    #drawPath(path, color, xOffset=0, yOffset=0){
        if (path.length < 1) {
            return;
        }

        this.ctx.strokeStyle=color;
        this.ctx.lineWidth=3;
        this.ctx.beginPath();

        path[0][0] += xOffset;
        path[0][1] += yOffset;

        let y = path[0][1] * this.ratio;
        let x = path[0][0] * this.ratio;
        this.ctx.moveTo(x, y);
        
        logConsole("start at: (" + x + "," + y + ")")

        for(let i = 1; i < path.length; i++) {
            path[i][0] += xOffset;
            path[i][1] += yOffset;

            y = path[i][1] * this.ratio;
            x = path[i][0] * this.ratio;
            logConsole("line to: (" + x + "," + y + ")")
            this.ctx.lineTo(x, y);
        }
        this.ctx.lineCap="round";
        this.ctx.lineJoin="round";
        this.ctx.stroke();
    }

    #getZoomOffset() {
        h = parseInt(this.canvas.height);
        w = parseInt(this.canvas.width);
        return [
            h - (h * this.ratio),
            w - (w * this.ratio)
        ];
    }
     
    drawPaths(xOffset=0, yOffset=0){
        let color="black";

        for( var path of this.paths ) {
            this.#drawPath(path, color, xOffset, yOffset);
        }
        
    }

    undo() {
        if (this.paths.length < 1) {
            return;
        }
        this.paths.pop();
        this.redraw();
    }

    save() {
        var a = document.createElement('a');
        a.setAttribute('href', 
            'data:text/plain;charset=utf-8,'+ encodeURIComponent(JSON.stringify(this.paths))
        );
        a.setAttribute('download', "drawing.json");
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    #loadFile(file) {
        var self = this;
        var fileReader = new XMLHttpRequest();
        fileReader.overrideMimeType("application/json");
        fileReader.open("GET", file, true);
        fileReader.onreadystatechange = function() {
            if (fileReader.readyState === 4 && fileReader.status == "200") {
                self.paths = JSON.parse(fileReader.responseText);
                self.redraw();
            }
        }
        fileReader.send(null);
    }

    openFile(file) {
        this.#loadFile(URL.createObjectURL(file));
    }

}

enableLogging = false;
function logConsole(msg) {
    if (!enableLogging) {
        return;
    }
    console.log(msg);
}

