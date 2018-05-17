function Shape(x, y, w, h, fill, finished) {
    this.x = x || 0;
    this.y = y || 0;
    this.w = w || 1;
    this.h = h || 1;
    this.fill = fill || 'rgba(96, 96, 96, .5)';
    this.finished = finished;
}

Shape.prototype.draw = function(ctx) {
    ctx.fillStyle = this.fill;
    ctx.fillRect(this.x, this.y, this.w, this.h);
    if (edit) {
        if (this.finished) {
            var img = new Image();
            img.src = "x_20.png";
            var ix = this.x + this.w - 20;
            var iy = this.y;
            if (this.w < 0) {
                ix = this.x - 20;
            }
            if (this.h < 0) {
                iy = this.y + this.h;
            }
            ctx.drawImage(img, ix, iy, 20, 20);
        }
    }
}

Shape.prototype.contains = function(mx, my) {
    return (this.x <= mx) && (this.x + this.w >= mx) && (this.y <= my) && (this.y + this.h >= my);
}

Shape.prototype.needClose = function(mx, my) {
    var minx = this.x + this.w - 20;
    var miny = this.y;
    if (this.w < 0) {
        minx = this.x - 20;
    }
    if (this.h < 0) {
        miny = this.y + this.h;
    }
    return (minx <= mx) && (minx + 20 >= mx) && (miny <= my) && (miny + 20 >= my);
}

function CanvasState(canvas) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.ctx = canvas.getContext('2d');
    var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
    if (document.defaultView && document.defaultView.getComputedStyle) {
        this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
        this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
        this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
        this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;
    }
    var html = document.body.parentNode;
    this.htmlTop = html.offsetTop;
    this.htmlLeft = html.offsetLeft;

    this.valid = false;
    this.shapes = [];
    this.dragging = false;
    this.isDown = false;
    this.selection = null;
    this.dragoffx = 0;
    this.dragoffy = 0;
    this.rect;

    var myState = this;

    var funSelectStart = function(e) {
        e.preventDefault();
        return false;
    };

    var funMouseDown = function(e) {
        var mouse = myState.getMouse(e);
        var mx = mouse.x;
        var my = mouse.y;
        if (!myState.isDown) {
            var shapes = myState.shapes;
            var l = shapes.length;
            for (var i = l - 1; i >= 0; i--) {
                if (shapes[i].needClose(mx, my)) {
                    var mySel = shapes[i];
                    myState.deleteShape(mySel);
                    myState.draw();
                    return;
                }
                if (shapes[i].contains(mx, my)) {
                    var mySel = shapes[i];
                    myState.dragoffx = mx - mySel.x;
                    myState.dragoffy = my - mySel.y;
                    myState.dragging = true;
                    myState.selection = mySel;
                    myState.valid = false;
                    return;
                }
            }
            if (myState.selection) {
                myState.selection = null;
                myState.valid = false;
            }

            var newRect = new Shape(mx,my,0,0,'rgba(96, 96, 96, .5)',false);
            myState.addShape(newRect);
            myState.setRect(newRect);
            myState.setIsDown(true);
        }

    };

    var funMouseMove = function(e) {
        var mouse = myState.getMouse(e);
        if (myState.dragging) {
            myState.selection.x = mouse.x - myState.dragoffx;
            myState.selection.y = mouse.y - myState.dragoffy;
            myState.valid = false;
        }
        if (myState.isDown) {
            var shapes = myState.shapes;
            var rect = myState.rect;
            var rex = rect.x;
            var rey = rect.y;
            var rew = mouse.x - rex
            var reh = mouse.y - rey;
            myState.deleteShape(rect);
            var newRect = new Shape(rex,rey,rew,reh,'rgba(96, 96, 96, .5)',false);
            myState.addShape(newRect);
            myState.setRect(newRect);
        }
    };

    var funMouseUp = function(e) {
        myState.dragging = false;
        if (myState.isDown) {
            var shapes = myState.shapes;
            var rect = myState.rect;
            var rex = rect.x;
            var rey = rect.y;
            var rew = rect.w;
            var reh = rect.h;
            myState.deleteShape(myState.rect);
            var ifBadW = false;
            var ifBadH = false;
            if (rew >= 0) {
                if (rew <= 2) {
                    ifBadW = true;
                }
                if (rew < 40) {
                    rew = 40;
                }
            } else {
                if (rew >= -2) {
                    ifBadW = true;
                }
                if (rew > -40) {
                    rew = -40;
                }
            }
            if (reh >= 0) {
                if (reh <= 2) {
                    ifBadH = true;
                }
                if (reh < 20) {
                    reh = 20;
                }
            } else {
                if (reh >= -2) {
                    ifBadH = true;
                }
                if (reh > -20) {
                    reh = -20;
                }
            }
            if (!(ifBadW && ifBadH)) {
                myState.addShape(new Shape(rex,rey,rew,reh,'rgba(96, 96, 96, .5)',true));
            }
        }
        myState.setIsDown(false);
    };

    this.start = function() {
        canvas.addEventListener('selectstart', funSelectStart, false);
        canvas.addEventListener('mousedown', funMouseDown, true);
        canvas.addEventListener('mousemove', funMouseMove, true);
        canvas.addEventListener('mouseup', funMouseUp, true);
    }
    ;

    this.end = function() {
        canvas.removeEventListener('selectstart', funSelectStart, false);
        canvas.removeEventListener('mousedown', funMouseDown, true);
        canvas.removeEventListener('mousemove', funMouseMove, true);
        canvas.removeEventListener('mouseup', funMouseUp, true);
    }
    ;

    setInterval(function() {
        myState.draw();
    }, myState.interval);
}

CanvasState.prototype.setIsDown = function(isDown) {
    this.isDown = isDown;
}
CanvasState.prototype.setRect = function(rect) {
    this.rect = rect;
}
CanvasState.prototype.addShape = function(shape) {
    this.shapes.push(shape);
    this.valid = false;
}

CanvasState.prototype.deleteShape = function(shape) {
    this.shapes.splice($.inArray(shape, this.shapes), 1);
    this.valid = false;
}

CanvasState.prototype.clear = function() {
    this.ctx.clearRect(0, 0, this.width, this.height);
}

CanvasState.prototype.draw = function() {
    if (!this.valid) {
        var ctx = this.ctx;
        var shapes = this.shapes;
        this.clear();
        var l = shapes.length;
        for (var i = 0; i < l; i++) {
            var shape = shapes[i];
            if (shape.x > this.width || shape.y > this.height || shape.x + shape.w < 0 || shape.y + shape.h < 0)
                continue;
            shapes[i].draw(ctx);
        }
        this.valid = true;
    }
}

CanvasState.prototype.getMouse = function(e) {
    var element = this.canvas, offsetX = 0, offsetY = 0, mx, my;
    if (element.offsetParent !== undefined) {
        do {
            offsetX += element.offsetLeft;
            offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
    }
    offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft;
    offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop;
    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;

    return {
        x: mx,
        y: my
    };
}
