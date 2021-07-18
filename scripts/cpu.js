class CPU {
    constructor(renderer, keyboard, speaker){
        this.renderer = renderer;
        this.keyboard = keyboard;
        this.speaker  = speaker;

        this.memory     = new Uint8Array(4 * 1024);
        this.registers  = new Uint8Array(16);
        this.pc         = 0x200;
        this.index      = 0;
        this.stack      = new Array();
        this.timerDelay = 0;
        this.timerSound = 0;

        this.paused     = false;
        this.speed      = 10;
    }

    loadSpritesIntoMemory() {
        // Array of hex values for each sprite. Each sprite is 5 bytes.
        // The technical reference provides us with each one of these values.
        const sprites = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80  // F
        ];

        // According to the technical reference, sprites are 
        // stored in the interpreter section of memory starting at hex 0x000
        for (let i = 0; i < sprites.length; i++) {
            this.memory[i] = sprites[i];
        }
    }

    loadProgramIntoMemory(program) {
        for (let location = 0; location < program.length; location++) {
            this.memory[0x200 + location] = program[location];
        }
    }

    loadRom(romName) {
        var request = new XMLHttpRequest;
        var self = this;

        // Handles the response received from sending (request.send()) our request
        request.onload = function() {
            // If the request response has content
            if (request.response) {
                // Store the contents of the response in an 8-bit array
                let program = new Uint8Array(request.response);

                // Load the ROM/program into memory
                self.loadProgramIntoMemory(program);
            }
        }

        // Initialize a GET request to retrieve the ROM from our roms folder
        request.open('GET', 'roms/' + romName);
        request.responseType = 'arraybuffer';

        // Send the GET request
        request.send();
    }

    cycle(){
        for (let i = 0; i<this.speed; i++) {
            if(!this.paused){
                let opcode = (this.memory[this.pc] << 8 | this.memory[this.pc + 1]);
                // console.log("Gonna execute 0x" + opcode.toString(16));
                this.executeInstruction(opcode);
            }
        }

        if (!this.paused) {
            this.updateTimers();
        }
        this.playSound();
        this.renderer.render();
    }

    updateTimers() {
        if (this.timerDelay > 0) {
            this.timerDelay -= 1;
        }
        if (this.timerSound > 0 ) {
            this.timerSound -= 1;   
        }
    }

    playSound() {
        if (this.soundTimer > 0) {
            this.speaker.play(440);
        } else {
            this.speaker.stop();
        }
    }

    executeInstruction(opcode) {
        this.pc += 2;

        let x = (opcode & 0x0F00) >> 8;
        let y = (opcode & 0x00F0) >> 4;

        switch (opcode & 0xF000) {
            case 0x0000:
                switch (opcode) {
                    case 0x00E0:
                        this.renderer.clear();
                        break;
                    case 0x00EE:
                        this.pc = this.stack.pop();
                        break;
                }
        
                break;
            case 0x1000:
                this.pc = (opcode & 0x0FFF);
                break;

            case 0x2000:
                this.stack.push(this.pc);
                this.pc = (opcode & 0x0FFF);
                break;

            case 0x3000:
                if (this.registers[x] == (opcode & 0x00FF)){
                    this.pc += 2;
                }
                break;

            case 0x4000:
                if (this.registers[x] != (opcode & 0x00FF)){
                    this.pc += 2;
                }
                break;

            case 0x5000:
                if (x == y){
                    this.pc += 2;
                }
                break;

            case 0x6000:
                this.registers[x] = (opcode & 0x0FFF);
                break;

            case 0x7000:
                this.registers[x] += (opcode & 0x0FFF);

                break;
                
            case 0x8000:
                switch (opcode & 0xF) {
                    case 0x0:
                        this.registers[x] = this.registers[y];
                        break;
                    case 0x1:
                        this.registers[x] |= this.registers[y];
                        break;
                    case 0x2:
                        this.registers[x] &= this.registers[y];
                        break;
                    case 0x3:
                        this.registers[x] ^= this.registers[y];
                        break;
                    case 0x4:
                        let sum = this.registers[x] + this.registers[y];
                        this.registers[0xF] = 0;

                        if (sum > 0xFF){
                            this.registers[0xF] = 1;
                        }
                        // Thanks to this.v being a Uint8Array, any value over 8 bits
                        // automatically has the lower, rightmost, 8 bits taken and 
                        // stored in the array. Therefore we don't need to do anything 
                        // special with it.
                        this.registers[x] = sum;
                        break;

                    case 0x5:
                        this.registers[0xF] = 0;

                        if (this.registers[x] > this.registers[y]){
                            this.registers[0xF] = 1;
                        }
                        this.registers[x] = this.registers[x] - this.registers[y];;
                        break;

                    case 0x6:
                        // skips an if statement!!
                        this.registers[0xF] = (this.registers[x] & 0x1);                        
                        this.registers[x] >>= 1;
                        break;

                    case 0x7:
                        this.registers[0xF] = 0;
                        if (this.registers[y] > this.registers[x]){
                            this.registers[0xF] = 1;                            
                        }
                        this.registers[x] = this.registers[y] - this.registers[x];
                        break;

                    case 0xE:
                        // 0x80 == 0b10000000
                        this.registers[0xF] = (this.registers[x] & 0x80);
                        this.registers[x] <<= 1;
                        break;
                }
        
                break;
            case 0x9000:
                if (this.registers[x] != this.registers[y]){
                    this.pc += 2;
                }
                break;

            case 0xA000:
                this.index = (opcode & 0xFFF);
                break;

            case 0xB000:
                this.pc = this.registers[0x0] + (opcode & 0xFFF);
                break;

            case 0xC000:
                let rand = Math.floor(Math.random() * 0xFF);
                this.registers[x] = rand & (opcode & 0xFF)
                break;

            case 0xD000:
                // TODO
                let width   = 8;
                // n is the height of the sprite we want to draw
                // "n-byte" sprite. every row is a byte
                let height  = (opcode & 0xF);

                // set collision to 0 for now
                this.registers[0xF] = 0;

                for (let row = 0; row < height; row++){
                    let sprite = this.memory[this.index + row];

                    for ( let col = 0; col < width; col++){
                        // if the bit (sprite) is not 0, render/erase the pixel
                        if ((sprite & 0x80) > 0) {
                            // if true, that means there was a collision    
                            if (this.renderer.setPixel(this.registers[x] + col, this.registers[y] + row)) {
                                this.registers[0xF] = 1
                            }
                        }
                        sprite <<= 1;
                    }
                }
                break;

            case 0xE000:
                switch (opcode & 0xFF) {
                    case 0x9E:
                        if (this.keyboard.isKeyPressed(this.registers[x])){
                            this.pc += 2;
                        
                        }
                        break;

                    case 0xA1:
                        if (!this.keyboard.isKeyPressed(this.registers[x])){
                            this.pc += 2;
                        
                        }

                        break;
                }
        
                break;
            case 0xF000:
                switch (opcode & 0xFF) {
                    case 0x07:
                        this.registers[x] = this.timerDelay;
                        break;

                    case 0x0A:
                        this.paused = true;

                        this.keyboard.onNextKeyPress = function (key) {
                            this.registers[x] = key;
                            this.paused = false;
                        }.bind(this);
                        break;

                    case 0x15:
                        this.registers[x] = this.timerDelay;
                        break;

                    case 0x18:
                        this.registers[x] = this.soundTimer;
                        break;

                    case 0x1E:
                        this.index += this.registers[x];
                        break;

                    case 0x29:
                        this.index = this.registers[x] * 5;
                        break;

                    case 0x33:
                        let num = this.registers[x];
                        this.memory[this.index]   = parseInt( num / 100);
                        this.memory[this.index+1] = parseInt((num % 100) / 10);
                        this.memory[this.index+2] = parseInt( num % 10);
                        break;

                    case 0x55:
                        for (let i = 0; i<=x; i++){
                            this.memory[this.index + i] = this.registers[i];
                        }
                        break;

                    case 0x65:
                        for (let i = 0; i<=x; i++){
                            this.registers[i] = this.memory[this.index + i];
                        }

                        break;
                }
        
                break;
        
            default:
                throw new Error('Unknown opcode ' + opcode);
        }
    }
}

export default CPU;