from flask import Flask, render_template, request
# Importamos nuestras funciones matemáticas propias
from calculos import obtener_mcd, obtener_mcm, obtener_mcm_lista

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    resultados = None
    analisis_pares = []
    
    if request.method == 'POST':
        # 1. Obtener listas del formulario HTML
        dientes_raw = request.form.getlist("diente[]")
        manten_raw = request.form.getlist("mant[]")

        # 2. Limpiar y convertir a enteros (validación básica)
        dientes = []
        manten = []
        
        for d, m in zip(dientes_raw, manten_raw):
            if d.strip() and m.strip():
                dientes.append(int(d))
                manten.append(int(m))

        # 3. Lógica de Negocio (Solo si hay al menos 2 engranajes)
        if len(dientes) >= 2:
            
            # --- A. Mantenimiento Global (MCM de todos los tiempos) ---
            mantenimiento_global = obtener_mcm_lista(manten)

            # --- B. Análisis entre Pares (Todos contra todos) ---
            # Iteramos para comparar cada engranaje con los siguientes en la lista
            for i in range(len(dientes)):
                for j in range(i + 1, len(dientes)):
                    
                    # Datos del Engranaje A
                    dA = dientes[i]
                    mA = manten[i]
                    
                    # Datos del Engranaje B
                    dB = dientes[j]
                    mB = manten[j]

                    # Cálculo de MCD de dientes (para ver el ciclo)
                    mcd_dientes = obtener_mcd(dA, dB)
                    
                    # Determinar tipo de ciclo
                    # Si MCD es 1, son coprimos (ciclo completo). Si no, ciclo parcial.
                    tipo_ciclo = "Completo" if mcd_dientes == 1 else "Parcial"
                    
                    # Texto de repetición de dientes
                    repeticion_dientes = f"Cada {mcd_dientes} dientes"

                    # Cálculo de coincidencia de mantenimiento (MCM de horas)
                    mcm_horas = obtener_mcm(mA, mB)
                    repeticion_mant = f"Cada {mcm_horas} horas"

                    # Guardamos el análisis de este par
                    analisis_pares.append({
                        "par": f"Engranaje {i+1} ↔ Engranaje {j+1}",
                        "A_d": dA,
                        "B_d": dB,
                        "mcd": mcd_dientes,
                        "ciclo": tipo_ciclo,
                        "rep_dientes": repeticion_dientes,
                        "A_m": mA,
                        "B_m": mB,
                        "rep_mant": repeticion_mant,
                    })

            # Empaquetamos los resultados generales
            resultados = {
                "dientes": dientes,
                "mant": manten,
                "mantenimiento_global": mantenimiento_global,
            }

    return render_template("index.html", 
                           resultados=resultados, 
                           analisis_pares=analisis_pares)

if __name__ == '__main__':
    app.run(debug=True)