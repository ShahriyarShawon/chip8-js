// handles all visual stuff

class Renderer {
    constructor(scale){
        this.rows   = 32;
        this.cols   = 64;
        this.scale  = scale;

        this.canvas = document.querySelector('canvas');
        this.ctx    = this.canvas.getContext('2d');

        this.canvas.height = this.scale * this.rows;
        this.canvas.width  = this.scale * this.cols;

        // 64x32    
        this.display = new Array(this.rows * this.cols);

    }

    setPixel(x,y){
        if(x > this.cols){
            x -= this.cols;
        }else if(x < 0){
            x += this.cols;
        }

        if(y > this.rows){
            y -= this.rows;
        }else if(y < 0){
            y += this.rows;
        }

        let pixelLocation = x + (y * this.cols);

        this.display[pixelLocation] ^= 1;
        
        // if this returns true, a pixel was erased
        return !this.display[pixelLocation];
    }

    clear() {
        this.display = new Array(this.cols * this.rows);
    }

    render() {
        // clear display every render cycle
        this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);

        // loop through display
        for (let i = 0; i < this.cols * this.rows; i++) {
            // get x position based of i
            let x = (i % this.cols) * this.scale;

            // Grabs the y position of the pixel based off of `i`
            let y = Math.floor(i / this.cols) * this.scale;

            // If the value at this.display[i] == 1, then draw a pixel.
            if (this.display[i]) {
                // Set the pixel color to black
                this.ctx.fillStyle = '#000';

                // Place a pixel at position (x, y) with a width and height of scale
                this.ctx.fillRect(x, y, this.scale, this.scale);
            }
        }
    }

    testRender(){
        this.setPixel(0,0);
        this.setPixel(5,2);
        this.setPixel(5,3);
        this.setPixel(5,4);
        this.setPixel(5,5);
        this.setPixel(5,6);
        this.setPixel(5,7);
    }
}

export default Renderer;