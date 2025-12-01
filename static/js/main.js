// --- FUNCIONES DE TABLA (index.html) ---

function agregarFila() {
    const tbody = document.getElementById("tbody-engranes");
    if (!tbody) return;
    
    const fila = document.createElement("tr");
    fila.innerHTML = `
        <td><input type="number" name="diente[]" class="form-control" required min="1" oninput="validarInput(this)"></td>
        <td><input type="number" name="mant[]" class="form-control" required min="1" oninput="validarInput(this)"></td>
        <td><button type="button" class="btn btn-danger btn-sm" onclick="eliminarFila(this)"><i class="bi bi-x-lg"></i> Eliminar</button></td>
    `;
    tbody.appendChild(fila);
}

function eliminarFila(btn) { 
    if (confirm('¿Estás seguro de eliminar esta fila?')) {
        btn.parentElement.parentElement.remove(); 
    }
}

function validarInput(input) {
    if (input.value.trim() === "" || parseInt(input.value) <= 0) {
        input.classList.add("invalid-input"); 
        input.classList.remove("valid-input");
    } else {
        input.classList.add("valid-input"); 
        input.classList.remove("invalid-input");
    }
}

// --- FUNCIONES DE EXPORTACIÓN (PDF) ---

function generarYDescargarPDF() {
    console.log("Iniciando generación de PDF...");
    const canvas = document.getElementById('gearCanvas');
    const inputImagen = document.getElementById('gear_image_data');
    const form = document.getElementById('pdfForm');

    // Validación de existencia de elementos
    if (!canvas || !inputImagen || !form) {
        alert("Error: No se encuentran los elementos para generar el reporte (Canvas o Formulario oculto).");
        return;
    }

    // Intentar capturar el canvas limpio (sin grid) usando la función expuesta en engranaje.js
    if (window.gearViz && typeof window.gearViz.drawForCapture === 'function') {
        try {
            window.gearViz.drawForCapture();
        } catch (err) {
            console.warn("No se pudo redibujar para captura, usando estado actual.", err);
        }
    }

    // Convertir a imagen y enviar
    try {
        inputImagen.value = canvas.toDataURL('image/png');
        form.submit();
    } catch (err) {
        console.error(err);
        alert("Error al procesar la imagen del canvas: " + err.message);
    }
}

// Hacer las funciones globales para que los botones onclick del HTML las encuentren
window.agregarFila = agregarFila;
window.eliminarFila = eliminarFila;
window.validarInput = validarInput;
window.generarYDescargarPDF = generarYDescargarPDF;