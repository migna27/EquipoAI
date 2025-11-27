(function() {
    const canvas = document.getElementById('gearCanvas');
    if (!canvas) return;

    // --- CONFIGURACIÓN ---
    const VISUAL_MODULE = 8;  // Escala visual
    const TOOTH_DEPTH = 6;    // Profundidad diente
    const BASE_SPEED = 0.015;  // Velocidad base
    
    const rawData = canvas.dataset.dientes; 
    let dientesData = [];
    try {
        dientesData = JSON.parse(rawData || '[]');
    } catch (e) {
        console.error("Error parsing gear data:", e);
        return;
    }

    if (dientesData.length === 0) return;

    const ctx = canvas.getContext('2d');
    let isPaused = false;
    const slowModeCheck = document.getElementById('slowModeCheck');

    // --- CLASE GEAR ---
    class Gear {
        constructor(x, y, teeth, startAngle, color) {
            this.x = x;
            this.y = y;
            this.teeth = teeth;
            this.radius = (teeth * VISUAL_MODULE) / 2; // Radio Primitivo
            this.angle = startAngle; 
            this.initialAngle = startAngle; // Guardamos el ángulo base para cálculos
            this.color = color;
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            const r_pitch = this.radius;
            const r_outer = r_pitch + TOOTH_DEPTH;
            const r_inner = r_pitch - TOOTH_DEPTH;
            const r_hole = this.teeth > 10 ? r_pitch * 0.3 : 5;

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
            
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#2c3e50';
            ctx.stroke();

            // Decoración
            ctx.beginPath();
            ctx.arc(0, 0, r_hole, 0, Math.PI * 2);
            ctx.fillStyle = '#ecf0f1';
            ctx.fill();
            ctx.stroke();

            // Texto
            if (this.teeth > 8) {
                ctx.fillStyle = '#333';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.teeth + 'z', 0, 0);
            }

            // Punto guía para ver rotación
            ctx.beginPath();
            ctx.arc(0, r_pitch - 5, 3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fill();

            ctx.restore();
        }

        update(speedMultiplier) {
            // Velocidad angular inversamente proporcional a los dientes
            const angularSpeed = (1 / this.teeth) * 40 * speedMultiplier;
            this.angle += angularSpeed;
        }
    }

    // --- SETUP: CÁLCULO DE POSICIÓN Y FASE ---
    let gears = [];
    let currentX = 50; 
    const centerY = canvas.height / 2;
    const colors = ['#e74c3c', '#3498db', '#f39c12', '#2ecc71', '#9b59b6'];

    dientesData.forEach((numDientes, index) => {
        // 1. Radio visual actual
        const radius = (numDientes * VISUAL_MODULE) / 2;
        let startAngle = 0;

        if (index === 0) {
            currentX += radius + 20;
            startAngle = 0;
        } else {
            const prevGear = gears[index - 1];
            
            // 2. Posición X: Tangente al anterior
            currentX += prevGear.radius + radius;

            // 3. SINCRONIZACIÓN DE FASE (CORREGIDO)
            // La fórmula mágica: El ángulo del nuevo engranaje depende del ángulo
            // del anterior multiplicado por la relación de transmisión negativa,
            // MÁS un offset de medio paso (PI/dientes) para alinear Diente con Hueco.
            
            const ratio = prevGear.teeth / numDientes;
            
            // startAngle = - (AnguloAnterior * Ratio) + (MedioPaso)
            startAngle = - (prevGear.initialAngle * ratio) + (Math.PI / numDientes);
        }

        // Color cíclico
        const color = colors[index % colors.length];
        
        gears.push(new Gear(currentX, centerY, numDientes, startAngle, color));
    });

    // Ajustar Canvas
    const lastGear = gears[gears.length - 1];
    const widthNeeded = lastGear.x + lastGear.radius + 50;
    if (widthNeeded > canvas.width) canvas.width = widthNeeded;

    // --- ANIMACIÓN ---
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

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
        if (slowModeCheck && slowModeCheck.checked) {
            speedFactor = BASE_SPEED * 0.15; // Muy lento para análisis
        }
        if (isPaused) speedFactor = 0;

        // Dirección inicial
        let dir = 1;

        gears.forEach((gear) => {
            gear.update(speedFactor * dir);
            gear.draw(ctx);
            dir *= -1; // Alternar dirección 1, -1, 1, -1...
        });

        requestAnimationFrame(animate);
    }

    animate();
    canvas.addEventListener('click', () => isPaused = !isPaused);
})();