

var enableLogging = false;
function logConsole(msg, forced=false) {
    if (!enableLogging && !forced) {
        return;
    }
    console.log(msg);
}


class SubMenu {

    constructor(bt, menuName) {
        this.x = bt.offsetLeft;
        this.y = bt.offsetTop;
        this.btHeight = bt.offsetHeight;
        this.subMenu = document.getElementById(menuName);
    }

    show(self = null) {
        if( self == null) {
            self = this;
        }
        this.subMenu.style.position = "absolute";
        this.subMenu.style.left = this.x;
        this.subMenu.style.top = this.y + this.btHeight;
        this.subMenu.style.display = "block";
        this.subMenu.setAttribute("tabindex", -1);
        this.subMenu.focus();
        this.subMenu.onblur = function(evt) {
            if (!evt.currentTarget.contains(evt.relatedTarget)) {
                self.hide();
            }
            else {
                evt.relatedTarget.onblur = function(evt) {
                    self.show(self);
                }
            }
        }
    }

    hide() {
        this.subMenu.style.display = "none";
    }
}




