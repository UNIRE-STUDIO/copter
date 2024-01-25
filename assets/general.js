// ВСПОМОГАТЕЛЬНЫЕ, УНИВЕРСАЛЬНЫЕ ФУНКЦИИ ................................................................

var requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 20);
        };
})();

function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// Функция проверяет попадает ли точка в область прямоугольника
function isInside(pos, rect) {

    // За левой гранью     и      перед правой гранью    и  за нижней гренью              и  перед верхней гранью
    return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y < rect.y + rect.height && pos.y > rect.y;
}

function drawRect(pos, scale, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.fillRect(pos.x, pos.y, scale.x, scale.y);
    ctx.fill();
}

function drawRoundRect(pos, scale, round, color) {
    if (typeof ctx.roundRect === 'function'){
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.roundRect(pos.x, pos.y, scale.x, scale.y, round);
        ctx.fill();
    }
    else { // Если браузер не поддерживает ctx.roundRect, то рисуем круги
        drawCircle({x:pos.x + 8, y:pos.y + 8}, scale, color);
    }
}

function drawCircle(pos, radius, color) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(pos.x, pos.y, radius.x/2, 0, 2 * Math.PI, false);
    ctx.fill();
}


//Function to get the mouse position
function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function drawText(text){
    ctx.font = '10pt arial';
    ctx.fillStyle = '#000000'
    ctx.fillText('label: ' + text, 13, 50);
}

function moveTo(current, target, step){
    var moveStep = (target - current)/step;
    return current + moveStep;
}

function detectCollision(sq1, sq2) {

    // вычисляем границы квадратов
    const sq1_left = sq1.x;
    const sq1_right = sq1.x + sq1.side;
    const sq1_top = sq1.y;
    const sq1_bottom = sq1.y + sq1.side;
    
    const sq2_left = sq2.x;
    const sq2_right = sq2.x + sq2.side;
    const sq2_top = sq2.y;
    const sq2_bottom = sq2.y + sq2.side;
    
    // проверяем, пересекаются ли границы квадратов по осям X и Y
    const x_collide = sq1_right >= sq2_left && sq1_left <= sq2_right;
    const y_collide = sq1_bottom >= sq2_top && sq1_top <= sq2_bottom;
    
    return x_collide && y_collide;
  }

  var drawDebbug = {
    drawObject: {posX: 0, posY: 0, scaleX: 0, scaleY: 0, color: "ffffff"},
    text: '',
    draw(){
        drawRect(drawDebbug.drawObject.posX, 
            drawDebbug.drawObject.posY, 
            drawDebbug.drawObject.scaleX, 
            drawDebbug.drawObject.scaleY, 
            drawDebbug.drawObject.color);
        drawText(drawDebbug.text);
    }
}

function clearCanvas()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}