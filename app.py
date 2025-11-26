from flask import Flask, render_template, request
# Importamos las nuevas funciones
from calculos import obtener_mcd, obtener_mcm, obtener_mcm_lista, calcular_relacion, calcular_velocidad

app = Flask(__name__)

@app.route('/', methods=['GET', 'POST'])
def index():
    resultados = None
    analisis_pares = []
    rpm_input = 100 # Valor por defecto
    
    if request.method == 'POST':
        dientes_raw = request.form.getlist("diente[]")
        manten_raw = request.form.getlist("mant[]")
        # Capturamos el nuevo input de RPM del motor (si existe, sino 100)
        rpm_input = float(request.form.get("rpm_input", 100))

        dientes = []
        manten = []
        
        for d, m in zip(dientes_raw, manten_raw):
            if d.strip() and m.strip():
                dientes.append(int(d))
                manten.append(int(m))

        if len(dientes) >= 2:
            # 1. Mantenimiento Global
            mantenimiento_global = obtener_mcm_lista(manten)

            # 2. Pre-calcular RPM de cada engranaje (Asumiendo Tren Secuencial)
            # Esto nos da la velocidad real de cada pieza en el sistema
            lista_rpms = []
            rpm_actual = rpm_input
            for k in range(len(dientes)):
                if k == 0:
                    lista_rpms.append(rpm_actual)
                else:
                    # La velocidad del actual depende del anterior
                    rpm_actual = calcular_velocidad(rpm_actual, dientes[k-1], dientes[k])
                    lista_rpms.append(rpm_actual)

            # 3. Análisis entre Pares
            for i in range(len(dientes)):
                for j in range(i + 1, len(dientes)):
                    dA, mA = dientes[i], manten[i]
                    dB, mB = dientes[j], manten[j]

                    
                    mcd_val = obtener_mcd(dA, dB)
                    tipo = "Completo" if mcd_val == 1 else "Parcial"
                    mcm_mant = obtener_mcm(mA, mB)
                    
                    
                    # Relación simplificada usando MCD
                    ratio = calcular_relacion(dA, dB)
                    
                    # Recuperamos las RPM calculadas previamente para estos engranajes
                    rpm_A = lista_rpms[i]
                    rpm_B = lista_rpms[j]

                    analisis_pares.append({
                        "par": f"{i+1} ↔ {j+1}",
                        "A_d": dA, "B_d": dB,
                        "mcd": mcd_val,
                        "ciclo": tipo,
                        "rep_dientes": f"Cada {mcd_val} dientes",
                        "A_m": mA, "B_m": mB,
                        "rep_mant": f"Cada {mcm_mant} h",
                        # Datos Nuevos
                        "ratio": ratio,
                        "rpm_A": rpm_A,
                        "rpm_B": rpm_B
                    })

            resultados = {
                "dientes": dientes,
                "mant": manten,
                "mantenimiento_global": mantenimiento_global,
                "rpm_motor": rpm_input
            }

    return render_template("index.html", 
                           resultados=resultados, 
                           analisis_pares=analisis_pares)

@app.route('/documentacion')
def documentacion():
    return render_template('documentacion.html')

if __name__ == '__main__':
    app.run(debug=False)