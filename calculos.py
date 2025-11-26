

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