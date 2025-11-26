(function() {
    // 1. OBTENER EL CANVAS
    const canvas = document.getElementById('gearCanvas');
    if (!canvas) return; // Si no hay canvas, salir.

    // 2. LEER DATOS DESDE EL HTML (El "puente" con Flask)
    // Flask escribe en el atributo 'data-dientes', JS lo lee aquí.
    const rawData = canvas.dataset.dientes; 
    let dientesData = [];

    try {
        // Convertimos el texto JSON a un Array de JS
        dientesData = JSON.parse(rawData || '[]');
    } catch (e) {
        console.error("Error al leer datos de engranajes:", e);
        return;
    }

    // Si no hay engranajes para dibujar, no hacemos nada
    if (dientesData.length === 0) return;

    const ctx = canvas.getContext('2d');
    let isPaused = false;
    
    // Configuración visual
    const TOOTH_DEPTH = 6;
    const SPEED_FACTOR = 0.08;

    // --- CLASE GEAR (Engranaje) ---
    class Gear {
        constructor(x, y, teeth, direction) {
            this.x = x;
            this.y = y;
            this.teeth = teeth;
            this.radius = teeth * 4; 
            this.angle = 0;
            // Física: Velocidad inversa al número de dientes
            this.speed = (1 / teeth) * 40 * direction * SPEED_FACTOR;
            this.color = this.getRandomColor();
        }

        getRandomColor() {
            const colors = ['#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e67e22', '#1abc9c'];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            ctx.beginPath();
            const outerRadius = this.radius + TOOTH_DEPTH;
            const innerRadius = this.radius - TOOTH_DEPTH;
            
            // Dibujar dientes
            for (let i = 0; i < this.teeth; i++) {
                const theta = (Math.PI * 2) / this.teeth;
                const angle = theta * i;
                
                ctx.lineTo(Math.cos(angle) * outerRadius, Math.sin(angle) * outerRadius);
                ctx.lineTo(Math.cos(angle + theta/2) * outerRadius, Math.sin(angle + theta/2) * outerRadius);
                ctx.lineTo(Math.cos(angle + theta/2) * innerRadius, Math.sin(angle + theta/2) * innerRadius);
                ctx.lineTo(Math.cos(angle + theta) * innerRadius, Math.sin(angle + theta) * innerRadius);
            }
            
            ctx.closePath();
            ctx.fillStyle = this.color;
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ecf0f1';
            ctx.stroke();

            // Dibujar número de dientes en el centro
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.teeth, 0, 0);

            ctx.restore();
        }

        update() {
            if (!isPaused) this.angle += this.speed;
        }
    }

    // --- INICIALIZACIÓN ---
    let gears = [];
    let currentX = 50; 
    const centerY = canvas.height / 2;
    let direction = 1;

    // Crear objetos Gear basados en los datos
    dientesData.forEach((numDientes, index) => {
        const radius = numDientes * 4;
        
        if (index > 0) {
            const prevGear = gears[index-1];
            // Posicionar tangente al anterior
            currentX += prevGear.radius + radius + (TOOTH_DEPTH * 1.8);
        } else {
            currentX += radius + 20; 
        }

        gears.push(new Gear(currentX, centerY, numDientes, direction));
        direction *= -1; // Alternar dirección de giro
    });

    // Ajustar tamaño del canvas si es necesario
    const widthNeeded = currentX + (dientesData[dientesData.length-1] * 4) + 50;
    if (widthNeeded > canvas.width) canvas.width = widthNeeded;

    // --- BUCLE DE ANIMACIÓN ---
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Dibujar eje
        if (gears.length > 1) {
            ctx.beginPath();
            ctx.moveTo(gears[0].x, centerY);
            ctx.lineTo(gears[gears.length-1].x, centerY);
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        gears.forEach(gear => {
            gear.update();
            gear.draw(ctx);
        });

        requestAnimationFrame(animate);
    }

    // Iniciar
    animate();

    // Evento click para pausar
    canvas.addEventListener('click', () => isPaused = !isPaused);

})();
