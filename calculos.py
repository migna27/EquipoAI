def factores_primos(n):
    """
    Devuelve un diccionario {primo: exponente} con la factorización de n 
    """
    n = abs(n)
    factores = {}
    divisor = 2
    while divisor * divisor <=n:
        while n % divisor == 0:
            factores[divisor] = factores.get(divisor, 0) + 1
            n //= divisor
        divisor += 1
    if n > 1:
        factores[n] = factores.get(n, 0) + 1

    return factores

def euclides_mcd(a, b):
    """
    Calcula el MCD usando el algoritmo de Euclides:
    - División
    - Cociente
    - Residuo
    """

    a, b = abs(a), abs(b)
    while b != 0:
        a, b = b, a % b
    return a

def euclides_mcm(a, b):
    """
    Calcula el MCM usando el método clásico: |a*b| / MCD
    """
    if a == 0 or b == 0:
        return 0
    return abs(a * b) // euclides_mcd(a, b)

def obtener_mcd(a, b):
    """
    Calcula el Máximo Común Divisor (MCD) usando descomposición en factores primos.
    """
    fa = factores_primos(a)
    fb = factores_primos(b)

    mcd = 1
    for primo in fa:
        if primo in fb:
            exp_min = min(fa[primo], fb[primo])
            mcd *= primo ** exp_min

    eu = euclides_mcd(a, b)
    if mcd != eu:
        print(f"[ERROR] MCD por factores = {mcd}, pero Euclides = {eu}.")
    else:
        return mcd

def obtener_mcm(a, b):
    """
    Calcula el MCM usando descomposición en factores primos.
    """
    if a == 0 or b == 0:
        return 0

    factores_a = factores_primos(a)
    factores_b = factores_primos(b)

    mcm = 1
    factores_ab = set(factores_a.keys()) | set(factores_b.keys())

    for primo in factores_ab:
        exp_max = max(factores_a.get(primo, 0), factores_b.get(primo, 0))
        mcm *= primo ** exp_max

    eu = euclides_mcm(a, b)
    if mcm != eu:
        print(f"[ERROR] MCM por factores = {mcm}, pero Euclides = {eu}.")
    else:
        return mcm

def obtener_mcm_lista(lista_numeros):
    """
    Calcula el MCM acumulativo de una lista de números usando obtener_mcm().
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
    Usa obtener_mcd() ya modificado con método tradicional.
    """
    if dientes_b == 0:
        return "N/A"
    
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

def calcular_distancia_centros(modulo, dientes_a, dientes_b):
    """
    Calcula la distancia entre los ejes de dos engranajes.
    Fórmula: (Módulo * (Dientes_A + Dientes_B)) / 2
    Retorna: Distancia en mm (asumiendo módulo en mm).
    """
    distancia = (modulo * (dientes_a + dientes_b)) / 2
    return round(distancia, 2)