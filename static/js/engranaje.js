(function() {
    const canvas = document.getElementById('gearCanvas');
    const container = document.getElementById('canvasContainer');
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    
    // --- CONFIGURACIÓN ---
    const VISUAL_MODULE = 8;
    const TOOTH_DEPTH = 6;
    const BASE_SPEED = 0.015;
    
    let cameraOffset = { x: 0, y: 0 };
    let cameraZoom = 1;
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let isPaused = false;

    const slowModeCheck = document.getElementById('slowModeCheck');
    const zoomSlider = document.getElementById('zoomRange');
    const btnPause = document.getElementById('btnPause');
    const btnReset = document.getElementById('btnResetView');

    const rawData = canvas.dataset.dientes; 
    let dientesData = [];
    try { dientesData = JSON.parse(rawData || '[]'); } catch (e) {}
    if (dientesData.length === 0) return;

    // --- FUNCIÓN RESPONSIVA (Solución al área negra) ---
    function resizeCanvas() {
        // Ajustamos la resolución interna del canvas al tamaño visual del contenedor
        canvas.width = container.clientWidth;
        canvas.height = 400; // Altura fija para mantener consistencia
        
        // Opcional: Recalcular centro si se desea, o dejar que el usuario mueva
        // drawGrid y animate usarán automáticamente el nuevo canvas.width
    }
    
    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', resizeCanvas);
    // Ejecutar una vez al inicio
    resizeCanvas();

    // --- CLASE GEAR ---
    class Gear {
        constructor(x, y, teeth, startAngle, colorHex) {
            this.x = x;
            this.y = y;
            this.teeth = teeth;
            this.radius = (teeth * VISUAL_MODULE) / 2;
            this.angle = startAngle;
            this.initialAngle = startAngle;
            this.colorHex = colorHex;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            const r_pitch = this.radius;
            const r_outer = r_pitch + TOOTH_DEPTH;
            const r_inner = r_pitch - TOOTH_DEPTH;
            const r_hole = this.teeth > 10 ? r_pitch * 0.25 : 6;

            const gradient = ctx.createRadialGradient(0, 0, r_inner * 0.5, 0, 0, r_outer);
            gradient.addColorStop(0, this.colorHex);
            gradient.addColorStop(0.8, this.shadeColor(this.colorHex, -20));
            gradient.addColorStop(1, this.shadeColor(this.colorHex, -40));

            ctx.fillStyle = gradient;
            ctx.strokeStyle = '#111';
            ctx.lineWidth = 1;

            ctx.beginPath();
            const numPoints = this.teeth * 2;
            for (let i = 0; i < numPoints; i++) {
                const theta = (Math.PI * 2 * i) / numPoints;
                
                if (i % 2 === 0) { // Diente (Punta)
                    const angle1 = theta - (Math.PI / this.teeth) * 0.25; 
                    const angle2 = theta + (Math.PI / this.teeth) * 0.25;
                    ctx.lineTo(Math.cos(angle1) * r_outer, Math.sin(angle1) * r_outer);
                    ctx.lineTo(Math.cos(angle2) * r_outer, Math.sin(angle2) * r_outer);
                } else { // Valle (Fondo)
                    const angle1 = theta - (Math.PI / this.teeth) * 0.25;
                    const angle2 = theta + (Math.PI / this.teeth) * 0.25;
                    ctx.lineTo(Math.cos(angle1) * r_inner, Math.sin(angle1) * r_inner);
                    ctx.lineTo(Math.cos(angle2) * r_inner, Math.sin(angle2) * r_inner);
                }
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Decoración
            ctx.beginPath();
            ctx.arc(0, 0, r_hole, 0, Math.PI * 2);
            ctx.fillStyle = '#ddd';
            ctx.fill();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.rect(-r_hole/4, -r_hole, r_hole/2, r_hole/2);
            ctx.fillStyle = '#333';
            ctx.fill();

            if (this.teeth > 12) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.teeth + 'z', 0, r_pitch * 0.6);
            }

            ctx.restore();
        }

        update(speedMultiplier) {
            const angularSpeed = (1 / this.teeth) * 40 * speedMultiplier;
            this.angle += angularSpeed;
        }

        shadeColor(color, percent) {
            let R = parseInt(color.substring(1,3),16);
            let G = parseInt(color.substring(3,5),16);
            let B = parseInt(color.substring(5,7),16);
            R = parseInt(R * (100 + percent) / 100);
            G = parseInt(G * (100 + percent) / 100);
            B = parseInt(B * (100 + percent) / 100);
            R = (R<255)?R:255;  G = (G<255)?G:255;  B = (B<255)?B:255;
            R = Math.round(R); G = Math.round(G); B = Math.round(B);
            const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
            const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
            const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));
            return "#"+RR+GG+BB;
        }
    }

    // --- SETUP ---
    let gears = [];
    let currentX = 0; 
    const centerY = 0;
    const colors = ['#e74c3c', '#3498db', '#f39c12', '#2ecc71', '#9b59b6'];

    dientesData.forEach((numDientes, index) => {
        // 1. Radio visual actual
        const radius = (numDientes * VISUAL_MODULE) / 2;
        let startAngle = 0;

        if (index === 0) {
            currentX = 0;
        } else {
            const prevGear = gears[index - 1];
            
            // 2. Posición X: Tangente al anterior
            currentX += prevGear.radius + radius;

            // 3. SINCRONIZACIÓN DE FASE (CORREGIDO)
            // La fórmula mágica: El ángulo del nuevo engranaje depende del ángulo
            // del anterior multiplicado por la relación de transmisión negativa,
            // MÁS un offset de medio paso (PI/dientes) para alinear Diente con Hueco.
            
            const ratio = prevGear.teeth / numDientes;
            startAngle = - (prevGear.initialAngle * ratio) + (Math.PI / numDientes);
        }
        gears.push(new Gear(currentX, centerY, numDientes, startAngle, colors[index % colors.length]));
    });

    // Centrado Inicial
    const totalWidth = gears[gears.length-1].x - gears[0].x;
    // Como canvas.width puede cambiar, usamos un valor inicial seguro o esperamos al resize
    // Ajustaremos cameraOffset en el animate si es la primera vez, o aquí con un width estimado
    cameraOffset.x = (container.clientWidth / 2) - (totalWidth / 2);
    cameraOffset.y = 400 / 2; // Altura fija definida en resizeCanvas
    
    if (totalWidth > container.clientWidth * 0.8) {
        cameraZoom = (container.clientWidth * 0.8) / totalWidth;
        if (zoomSlider) zoomSlider.value = cameraZoom;
    }

    // --- DIBUJO ---
    function drawGrid() {
        ctx.save();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1 / cameraZoom; 
        ctx.beginPath();
        
        const gridSize = 50;
        // Calculamos los límites visibles basándonos en el tamaño ACTUAL del canvas
        const left = -cameraOffset.x / cameraZoom;
        const top = -cameraOffset.y / cameraZoom;
        const right = (canvas.width - cameraOffset.x) / cameraZoom;
        const bottom = (canvas.height - cameraOffset.y) / cameraZoom;

        // Agregamos un margen extra (+1) para asegurar que cubra todo
        for (let x = Math.floor(left / gridSize) * gridSize; x < right + gridSize; x += gridSize) {
            ctx.moveTo(x, top);
            ctx.lineTo(x, bottom);
        }
        for (let y = Math.floor(top / gridSize) * gridSize; y < bottom + gridSize; y += gridSize) {
            ctx.moveTo(left, y);
            ctx.lineTo(right, y);
        }
        ctx.stroke();
        ctx.restore();
    }

    function animate() {
        // Limpiamos todo el canvas con su tamaño actual
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(cameraOffset.x, cameraOffset.y);
        ctx.scale(cameraZoom, cameraZoom);

        drawGrid();

        // Línea de centros
        ctx.beginPath();
        ctx.moveTo(gears[0].x, centerY);
        ctx.lineTo(gears[gears.length-1].x, centerY);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Control de velocidad
        let speedFactor = BASE_SPEED;
        if (slowModeCheck && slowModeCheck.checked) speedFactor *= 0.15;
        if (isPaused) speedFactor = 0;

        let dir = 1;
        gears.forEach((gear) => {
            gear.update(speedFactor * dir);
            gear.draw(ctx);
            dir *= -1;
        });

        ctx.restore();
        requestAnimationFrame(animate);
    }

    // --- EVENTOS ---
    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        // Obtener posición del mouse relativa al canvas
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        dragStart.x = mouseX - cameraOffset.x;
        dragStart.y = mouseY - cameraOffset.y;
        canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mouseup', () => { isDragging = false; canvas.style.cursor = 'grab'; });
    canvas.addEventListener('mouseleave', () => { isDragging = false; canvas.style.cursor = 'grab'; });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            cameraOffset.x = mouseX - dragStart.x;
            cameraOffset.y = mouseY - dragStart.y;
        }
    });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomAmount = e.deltaY * -0.001;
        const newZoom = Math.min(Math.max(0.1, cameraZoom + zoomAmount), 5);
        cameraZoom = newZoom;
        if (zoomSlider) zoomSlider.value = cameraZoom;
    });

    if (zoomSlider) {
        zoomSlider.addEventListener('input', (e) => {
            cameraZoom = parseFloat(e.target.value);
        });
    }

    if (btnPause) {
        btnPause.addEventListener('click', () => {
            isPaused = !isPaused;
            btnPause.textContent = isPaused ? "▶" : "⏸";
            btnPause.className = isPaused ? "btn btn-success btn-sm" : "btn btn-warning btn-sm";
        });
    }

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            cameraZoom = 1;
            cameraOffset.x = (canvas.width / 2) - (totalWidth / 2);
            cameraOffset.y = canvas.height / 2;
            if (zoomSlider) zoomSlider.value = 1;
        });
    }

    animate();
})();