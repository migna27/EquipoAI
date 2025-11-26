

def obtener_mcd(a, b):
    """
    Calcula el Máximo Común Divisor (MCD) usando el Algoritmo de Euclides.
    """
    while b:
        a, b = b, a % b
    return a

def obtener_mcm(a, b):
    """
    Calcula el Mínimo Común Múltiplo (MCM).
    Fórmula: (a * b) / MCD(a, b)
    """
    if a == 0 or b == 0:
        return 0
    # Usamos división entera // para asegurar que el resultado sea int
    return abs(a * b) // obtener_mcd(a, b)

def obtener_mcm_lista(lista_numeros):
    """
    Calcula el MCM acumulativo de una lista de números.
    
    """
    if not lista_numeros:
        return 0
    
    resultado = lista_numeros[0]
    for num in lista_numeros[1:]:
        resultado = obtener_mcm(resultado, num)
    
    return resultado

def calcular_relacion(dientes_a, dientes_b):
    """
    Calcula la relación simplificada (ej. 12:36 -> 1:3)
    REUTILIZA: Función obtener_mcd existente.
    """
    if dientes_b == 0: return "N/A"
    
    # Usamos el algoritmo de Euclides para encontrar el divisor común
    comun_divisor = obtener_mcd(dientes_a, dientes_b)
    
    simp_a = dientes_a // comun_divisor
    simp_b = dientes_b // comun_divisor
    
    return f"{simp_a}:{simp_b}"

def calcular_velocidad(rpm_entrada, dientes_entrada, dientes_salida):
    """
    Calcula las RPM de salida basándose en la física de transmisión.
    Fórmula: RPM_Out = RPM_In * (Z_In / Z_Out)
    """
    if dientes_salida == 0: return 0.0
    return round(rpm_entrada * (dientes_entrada / dientes_salida), 2)