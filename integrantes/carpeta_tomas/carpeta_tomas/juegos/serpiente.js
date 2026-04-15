// =============================================
//   SERPIENTE TERMINAL - Lógica del Juego
// =============================================

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMsg = document.getElementById('overlay-msg');
const scoreEl = document.getElementById('score');
const nivelEl = document.getElementById('nivel');
const recordEl = document.getElementById('record');
const btnIniciar = document.getElementById('btn-iniciar');
const btnPausar = document.getElementById('btn-pausar');
const btnReiniciar = document.getElementById('btn-reiniciar');

// Colores terminal ámbar
const COLOR_SERPIENTE = '#ffb000';
const COLOR_CABEZA = '#ffd060';
const COLOR_COMIDA = '#ff4444';
const COLOR_GRID = 'rgba(255,176,0,0.04)';

const CELDA = 20;
const FILAS = canvas.height / CELDA;
const COLS = canvas.width / CELDA;

let serpiente, direccion, proximaDireccion, comida;
let puntos, nivel, record, jugando, pausado;
let intervalo = null;

function init() {
    serpiente = [
        { x: 10, y: 10 },
        { x: 9,  y: 10 },
        { x: 8,  y: 10 }
    ];
    direccion = { x: 1, y: 0 };
    proximaDireccion = { x: 1, y: 0 };
    puntos = 0;
    nivel = 1;
    jugando = false;
    pausado = false;
    record = parseInt(localStorage.getItem('serpiente_record') || '0');
    actualizarUI();
    generarComida();
    dibujar();
}

function velocidadPorNivel(n) {
    return Math.max(80, 220 - (n - 1) * 20);
}

function iniciarJuego() {
    if (jugando) return;
    jugando = true;
    pausado = false;
    overlay.classList.add('hidden');
    btnIniciar.disabled = true;
    btnPausar.disabled = false;
    btnReiniciar.disabled = false;
    clearInterval(intervalo);
    intervalo = setInterval(tick, velocidadPorNivel(nivel));
}

function pausarJuego() {
    if (!jugando) return;
    if (!pausado) {
        pausado = true;
        clearInterval(intervalo);
        btnPausar.textContent = '[ CONTINUAR ]';
        mostrarOverlay('> PAUSADO', 'Presiona ESPACIO o [ CONTINUAR ]');
    } else {
        pausado = false;
        overlay.classList.add('hidden');
        btnPausar.textContent = '[ PAUSAR ]';
        intervalo = setInterval(tick, velocidadPorNivel(nivel));
    }
}

function reiniciarJuego() {
    clearInterval(intervalo);
    init();
    mostrarOverlay('> REINICIANDO...', 'Presiona ENTER o [ INICIAR ]');
    btnIniciar.disabled = false;
    btnPausar.disabled = true;
    btnPausar.textContent = '[ PAUSAR ]';
    btnReiniciar.disabled = true;
}

function tick() {
    moverSerpiente();
    if (colision()) {
        finJuego();
        return;
    }
    if (comerComida()) {
        sumarPunto();
        generarComida();
    }
    dibujar();
}

function moverSerpiente() {
    direccion = { ...proximaDireccion };
    const nuevaCabeza = {
        x: serpiente[0].x + direccion.x,
        y: serpiente[0].y + direccion.y
    };
    serpiente.unshift(nuevaCabeza);
    serpiente.pop();
}

function colision() {
    const cabeza = serpiente[0];
    if (cabeza.x < 0 || cabeza.x >= COLS || cabeza.y < 0 || cabeza.y >= FILAS) return true;
    for (let i = 1; i < serpiente.length; i++) {
        if (cabeza.x === serpiente[i].x && cabeza.y === serpiente[i].y) return true;
    }
    return false;
}

function comerComida() {
    return serpiente[0].x === comida.x && serpiente[0].y === comida.y;
}

function sumarPunto() {
    puntos++;
    // Crecer: volver a añadir la cola
    const cola = { ...serpiente[serpiente.length - 1] };
    serpiente.push(cola);

    if (puntos % 5 === 0) {
        nivel++;
        clearInterval(intervalo);
        intervalo = setInterval(tick, velocidadPorNivel(nivel));
    }
    if (puntos > record) {
        record = puntos;
        localStorage.setItem('serpiente_record', record);
    }
    actualizarUI();
}

function generarComida() {
    let pos;
    do {
        pos = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * FILAS)
        };
    } while (serpiente.some(s => s.x === pos.x && s.y === pos.y));
    comida = pos;
}

function finJuego() {
    clearInterval(intervalo);
    jugando = false;
    if (puntos > record) {
        record = puntos;
        localStorage.setItem('serpiente_record', record);
        actualizarUI();
    }
    mostrarOverlay(
        '> GAME_OVER.EXE',
        `Puntos: ${puntos} | Nivel: ${nivel} | Record: ${record}`
    );
    btnIniciar.disabled = false;
    btnPausar.disabled = true;
    btnPausar.textContent = '[ PAUSAR ]';
}

function mostrarOverlay(titulo, msg) {
    overlayTitle.textContent = titulo;
    overlayMsg.textContent = msg;
    overlay.classList.remove('hidden');
}

function actualizarUI() {
    scoreEl.textContent = puntos;
    nivelEl.textContent = nivel;
    recordEl.textContent = record;
}

// ===== DIBUJO =====
function dibujar() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    dibujarGrid();
    dibujarComida();
    dibujarSerpiente();
}

function dibujarGrid() {
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= canvas.width; x += CELDA) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += CELDA) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function dibujarComida() {
    const x = comida.x * CELDA;
    const y = comida.y * CELDA;
    ctx.fillStyle = COLOR_COMIDA;
    ctx.shadowColor = COLOR_COMIDA;
    ctx.shadowBlur = 8;
    ctx.fillRect(x + 3, y + 3, CELDA - 6, CELDA - 6);
    ctx.shadowBlur = 0;

    // Etiqueta [■]
    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold 10px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('■', x + CELDA / 2, y + CELDA / 2 + 4);
}

function dibujarSerpiente() {
    serpiente.forEach((seg, i) => {
        const x = seg.x * CELDA;
        const y = seg.y * CELDA;
        const color = i === 0 ? COLOR_CABEZA : COLOR_SERPIENTE;
        const alpha = i === 0 ? 1 : Math.max(0.3, 1 - i * (0.015));

        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;

        if (i === 0) {
            // Cabeza con brillo
            ctx.shadowColor = COLOR_CABEZA;
            ctx.shadowBlur = 10;
        }

        ctx.fillRect(x + 1, y + 1, CELDA - 2, CELDA - 2);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        // Borde interior en cabeza
        if (i === 0) {
            ctx.strokeStyle = '#ffe080';
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 2, y + 2, CELDA - 4, CELDA - 4);
        }
    });
}

// ===== CONTROLES DE TECLADO =====
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':    case 'w': case 'W':
            if (direccion.y !== 1)  proximaDireccion = { x: 0, y: -1 };
            break;
        case 'ArrowDown':  case 's': case 'S':
            if (direccion.y !== -1) proximaDireccion = { x: 0, y: 1 };
            break;
        case 'ArrowLeft':  case 'a': case 'A':
            if (direccion.x !== 1)  proximaDireccion = { x: -1, y: 0 };
            break;
        case 'ArrowRight': case 'd': case 'D':
            if (direccion.x !== -1) proximaDireccion = { x: 1, y: 0 };
            break;
        case 'Enter':
            if (!jugando) iniciarJuego();
            break;
        case ' ':
            e.preventDefault();
            if (!jugando) iniciarJuego();
            else pausarJuego();
            break;
    }
});

// ===== BOTONES =====
btnIniciar.addEventListener('click', iniciarJuego);
btnPausar.addEventListener('click', pausarJuego);
btnReiniciar.addEventListener('click', reiniciarJuego);

// ===== ARRANQUE =====
init();
mostrarOverlay('> SERPIENTE_TERMINAL.EXE', 'Presiona ENTER o [ INICIAR ]');
