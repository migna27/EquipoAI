from flask import Flask, render_template, request, session, make_response
# Importamos la nueva función
from calculos import obtener_mcd, obtener_mcm, obtener_mcm_lista, calcular_relacion, calcular_velocidad, calcular_distancia_centros
from xhtml2pdf import pisa
import io
import os

app = Flask(__name__)
app.secret_key = "engranajes_clave_secreta"

@app.route('/', methods=['GET', 'POST'])
def index():
    resultados = None
    analisis_pares = []
    
    if request.method == 'POST':
        try:
            
            rpm_str = request.form.get("rpm_input")
            rpm_input = float(rpm_str) if rpm_str else 0.0
            
            
            mod_str = request.form.get("modulo_input")
            modulo_input = float(mod_str) if mod_str else 1.0
        except ValueError:
            rpm_input = 0.0
            modulo_input = 1.0

        dientes_raw = request.form.getlist("diente[]")
        manten_raw = request.form.getlist("mant[]")

        dientes = []
        manten = []
        
        for d, m in zip(dientes_raw, manten_raw):
            if d.strip() and m.strip():
                dientes.append(int(d))
                manten.append(int(m))

        if len(dientes) >= 2:
            mantenimiento_global = obtener_mcm_lista(manten)
            
            for i in range(len(dientes)):
                for j in range(i + 1, len(dientes)):
                    dA = dientes[i]; mA = manten[i]
                    dB = dientes[j]; mB = manten[j]

                    mcd_val = obtener_mcd(dA, dB)
                    mcm_val = obtener_mcm(mA, mB)
                    
                    ratio = calcular_relacion(dA, dB)
                    rpm_salida = calcular_velocidad(rpm_input, dA, dB)
                    
                    
                    distancia = calcular_distancia_centros(modulo_input, dA, dB)

                    analisis_pares.append({
                        "par": f"{i+1} ↔ {j+1}",
                        "A_d": dA, "B_d": dB,
                        "ciclo": "Completo" if mcd_val == 1 else "Parcial",
                        "rep_dientes": mcd_val,
                        "A_m": mA, "B_m": mB,
                        "rep_mant": mcm_val,
                        "ratio": ratio,
                        "rpm_salida": rpm_salida,
                        "distancia": distancia  
                    })

            resultados = {
                "dientes": dientes,
                "mant": manten,
                "mantenimiento_global": mantenimiento_global,
                "rpm_motor": rpm_input,
                "modulo": modulo_input 
            }

            session['resultados'] = resultados
            session['analisis_pares'] = analisis_pares

    return render_template("index.html", resultados=resultados, analisis_pares=analisis_pares)

@app.route('/descargar_pdf')
def descargar_pdf():
    resultados = session.get('resultados')
    analisis_pares = session.get('analisis_pares')

    if not resultados:
        return "No hay datos para generar el reporte."

    logo_path = os.path.join(app.root_path, 'static', 'imagenes', 'ITSON_azul.png')

    html_content = render_template('reporte_pdf.html', 
                                   resultados=resultados, 
                                   analisis_pares=analisis_pares,
                                   logo_path=logo_path)

    pdf_file = io.BytesIO()
    pisa_status = pisa.CreatePDF(io.BytesIO(html_content.encode('utf-8')), dest=pdf_file)

    if pisa_status.err:
        return "Error al generar el PDF"

    response = make_response(pdf_file.getvalue())
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = 'attachment; filename=reporte_tecnico.pdf'
    return response

@app.route('/documentacion')
def documentacion():
    return render_template('documentacion.html')

if __name__ == '__main__':
    app.run()