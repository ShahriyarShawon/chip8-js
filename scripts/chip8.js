import Renderer from './renderer.js';
import Keyboard from './keyboard.js';
import Speaker from './speaker.js';
import CPU from './cpu.js';

const renderer = new Renderer(10);
const keyboard = new Keyboard();
const speaker  = new Speaker();
const cpu      = new CPU(renderer, keyboard, speaker);


let loop;

let fps = 60, fpsInterval, startTime, now, then, elapsed;

function init(){
    fpsInterval = 1000 / fps;
    then        = Date.now();
    startTime   = then;

    // TESTING CODE. REMOVE WHEN DONE TESTING.
    // renderer.testRender();
    // renderer.render();
    // END TESTING CODE

    cpu.loadSpritesIntoMemory();
    cpu.loadRom('brick.ch8');
    // cpu.loadRom('brick.ch8');
    
    
    loop = requestAnimationFrame(step);
}


function step() {
    now     = Date.now();
    elapsed = now - then;

    if (elapsed > fpsInterval){
        // cycle cpu
        cpu.cycle();
        console.log("finished cycle")
    }

    loop = requestAnimationFrame(step);


}

init();