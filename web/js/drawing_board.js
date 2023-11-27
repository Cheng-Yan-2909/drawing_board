

const LineStyle = {
    FREE: "free",
    LINE: "line"
}


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
        /*
        paths = [
            {
                "color": 112233,
                "points": [
                    [x1,y1],
                    [x2,y2],
                    [x3,y3]
                ]
            }
        ]
        */
        this.paths = [];
        this.ratio = 1;
        this.isDrawing = false;
        this.shiftDown = false;
        this.originalMouseXY = null;
        this.RGB_color = ["00", "00", "00"];
        this.lineSize = 1;
        this.lineStyle = LineStyle.FREE;
        this.redraw();
    }

    clearDrawing() {
        this.paths = [];
        this.redraw();
    }

    #setupDrawEvent() {
        this.canvas.onmousedown=(env) => {
            var mouseXY = this.#getMouseXY(env);
            this.paths.push(
                {
                    "color": "#" + this.RGB_color.join(""),
                    "lineSize" : this.lineSize,
                    "lineStyle" : this.lineStyle,
                    "points": [mouseXY]
                }
            );
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
        
        if (this.lineStyle == LineStyle.LINE) {
            if(  this.paths[i]["points"].length < 2 ) {
                this.paths[i]["points"].push(mouseXY);
            }
            this.paths[i]["points"][1] = mouseXY;
        }
        else {
            this.paths[i]["points"].push(mouseXY);
        }
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

    redraw(xOffset=0, yOffset=0, resize=1){
        this.ctx.clearRect(0,0, this.canvas.width,this.canvas.height);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(0,0, this.canvas.width,this.canvas.height);
        this.drawPaths(xOffset, yOffset, resize);
    }

    #drawPath(path, xOffset=0, yOffset=0, resize=1){
        var points = path["points"]
        if (points.length < 1) {
            return;
        }

        this.ctx.strokeStyle = path["color"];
        this.ctx.lineWidth = path["lineSize"];
        this.ctx.beginPath();

        points[0][0] *= resize;
        points[0][1] *= resize;
        points[0][0] += xOffset;
        points[0][1] += yOffset;

        let y = points[0][1] * this.ratio;
        let x = points[0][0] * this.ratio;
        this.ctx.moveTo(x, y);
        
        logConsole("start at: (" + x + "," + y + ")")

        for(let i = 1; i < points.length; i++) {
            points[i][0] *= resize;
            points[i][1] *= resize;
            points[i][0] += xOffset;
            points[i][1] += yOffset;

            y = points[i][1] * this.ratio;
            x = points[i][0] * this.ratio;
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
     
    drawPaths(xOffset=0, yOffset=0, resize=1){
        let color="black";

        for( var path of this.paths ) {
            this.#drawPath(path, xOffset, yOffset, resize);
        }
        
    }

    undo() {
        if (this.paths.length < 1) {
            return;
        }
        this.paths.pop();
        this.redraw();
    }

    save(imgType="text/plain") {
        var a = document.createElement('a');

        if( imgType == "text/plain" ) {
            var url = 'data:text/plain;charset=utf-8,'+ encodeURIComponent(JSON.stringify(this.paths, null, 4))
            this.startDownload(a, "drawing.json", url);
        }
        else {
            var self = this;
            var imageName = "drawing.png";
            if(imgType == "image/jpeg") {
                imageName = "drawing.jpeg";
            }

            this.canvas.toBlob(
                function(data) {
                    var url = URL.createObjectURL(data);
                    self.startDownload(a, imageName, url)
                },
                imgType,
                1
            );
        }
    }

    startDownload(a, name, url) {
        a.setAttribute('href', url);
        a.setAttribute('download', name);
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

    updateRGB(color, index, colorSampleButtonName) {
        this.RGB_color[index] = color;
        document.getElementById(colorSampleButtonName).style.backgroundColor = "#" + this.RGB_color.join("");
    }

    updateLineSize(lineSize, lineSizeSampleName) {
        this.lineSize = lineSize;
        document.getElementById(lineSizeSampleName).innerHTML = lineSize;
    }

    updateLineStyle(lineStyle, lineTypeSampleName) {
        this.lineStyle = lineStyle;
        document.getElementById(lineTypeSampleName).innerHTML = lineStyle;
    }

    reSizeImage(size) {
        console.log("resize: " + size);
        this.redraw(0, 0, size);
    }

}

enableLogging = false;
function logConsole(msg) {
    if (!enableLogging) {
        return;
    }
    console.log(msg);
}

