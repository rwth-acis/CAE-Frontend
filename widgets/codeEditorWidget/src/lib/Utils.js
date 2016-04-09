export function delayed(callback,time,clear=true){
    if (this.timer && clear) {
        clearTimeout(this.timer);
        this.timer = false;
    }
    if (!this.timer) {
        this.timer = setTimeout(function(){
            callback.bind(this)();
            this.timer=false;
        }.bind(this),time);

    }
}