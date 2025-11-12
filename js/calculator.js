// ==========================================================================
// SEA EXPRESS - MÓDULO DE CÁLCULOS
// Maneja toda la lógica de cálculo de envíos con cache y optimizaciones
// ==========================================================================

import { CONFIG } from './config.js';

/**
 * Clase para gestionar cálculos de envíos con sistema de cache
 */
class CalculadoraEnvio {
    constructor() {
        this.cache = new Map();
        this.estadisticas = {
            calculosRealizados: 0,
            cacheHits: 0,
            cacheMisses: 0,
            errores: 0
        };
        
        // Limpiar cache periódicamente
        this.iniciarLimpiezaCache();
    }

    /**
     * Calcula el costo total de envío basado en peso y valor
     * @param {number} peso - Peso en kg
     * @param {number} valor - Valor declarado en USD
     * @param {string} producto - Descripción del producto (opcional)
     * @returns {Object} Objeto con el desglose del cálculo
     */
    calcular(peso, valor, producto = '') {
        try {
            this.estadisticas.calculosRealizados++;
            
            // Validar parámetros de entrada
            this.validarParametros(peso, valor);
            
            // Generar clave única para el cache
            const claveCache = this.generarClaveCache(peso, valor);
            
            // Verificar cache primero
            if (this.cache.has(claveCache)) {
                this.estadisticas.cacheHits++;
                const resultadoCache = this.cache.get(claveCache);
                return {
                    ...resultadoCache,
                    producto: producto || resultadoCache.producto
                };
            }
            
            this.estadisticas.cacheMisses++;
            
            // Aplicar reglas de negocio
            const pesoCalculo = this.aplicarPesoMinimo(peso);
            const costoEnvio = this.calcularCostoEnvio(pesoCalculo);
            const impuestos = this.calcularImpuestos(valor);
            const desaduanaje = CONFIG.PRECIOS.DESADUANAJE;
            const envioTotal = costoEnvio + desaduanaje;
            const total = valor + envioTotal + impuestos;
            
            // Construir resultado
            const resultado = {
                tipo: "manual",
                producto: producto,
                peso: pesoCalculo,
                valor: this.redondear(valor),
                desaduanaje: this.redondear(desaduanaje),
                costoEnvio: this.redondear(costoEnvio),
                envioTotal: this.redondear(envioTotal),
                impuestos: this.redondear(impuestos),
                total: this.redondear(total),
                desglose: this.generarDesglose(valor, costoEnvio, desaduanaje, impuestos),
                timestamp: Date.now(),
                idCalculo: this.generarIdCalculo()
            };
            
            // Guardar en cache
            this.guardarEnCache(claveCache, resultado);
            
            // Registrar cálculo exitoso
            this.registrarCalculoExitoso(resultado);
            
            return resultado;
            
        } catch (error) {
            this.estadisticas.errores++;
            console.error('❌ Error en cálculo:', error);
            throw error;
        }
    }

    /**
     * Calcula el envío a partir de un enlace de producto
     * @param {string} enlace - URL del producto en Amazon
     * @returns {Object} Datos del producto extraídos
     */
    async calcularPorEnlace(enlace) {
        try {
            // Validar y normalizar enlace
            const enlaceNormalizado = this.normalizarEnlace(enlace);
            
            // Crear controller para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.API.TIMEOUT);
            
            // Realizar petición a la API
            const response = await fetch(CONFIG.API.URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Client': 'sea-express-calculator',
                    'X-Version': '1.0.0'
                },
                body: JSON.stringify({ 
                    url: enlaceNormalizado,
                    timestamp: Date.now()
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Manejar respuesta
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message || `Error del servidor: ${response.status}`
                );
            }
            
            const data = await response.json();
            
            // Validar datos recibidos
            return this.validarYProcesarDatosProducto(data);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('La solicitud tardó demasiado tiempo. Por favor, intenta nuevamente.');
            }
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Error de conexión. Verifica tu internet e intenta nuevamente.');
            }
            
            // Re-lanzar error para manejo superior
            throw error;
        }
    }

    /**
     * Calcula múltiples envíos simultáneamente (para carritos de compra)
     * @param {Array} productos - Array de productos a calcular
     * @returns {Object} Resultado consolidado
     */
    calcularMultiplesEnvios(productos) {
        try {
            if (!Array.isArray(productos) || productos.length === 0) {
                throw new Error('Debe proporcionar un array de productos válido');
            }

            if (productos.length > 10) {
                throw new Error('Máximo 10 productos por cálculo');
            }

            const resultados = productos.map((producto, index) => {
                try {
                    return this.calcular(
                        producto.peso, 
                        producto.valor, 
                        producto.nombre || `Producto ${index + 1}`
                    );
                } catch (error) {
                    return {
                        error: error.message,
                        producto: producto.nombre || `Producto ${index + 1}`,
                        peso: producto.peso,
                        valor: producto.valor
                    };
                }
            });

            const exitosos = resultados.filter(r => !r.error);
            const conError = resultados.filter(r => r.error);

            return {
                productos: resultados,
                resumen: {
                    totalProductos: productos.length,
                    calculosExitosos: exitosos.length,
                    calculosConError: conError.length,
                    pesoTotal: exitosos.reduce((sum, r) => sum + r.peso, 0),
                    valorTotal: exitosos.reduce((sum, r) => sum + r.valor, 0),
                    costoEnvioTotal: exitosos.reduce((sum, r) => sum + r.costoEnvio, 0),
                    impuestosTotal: exitosos.reduce((sum, r) => sum + r.impuestos, 0),
                    totalGeneral: exitosos.reduce((sum, r) => sum + r.total, 0)
                },
                errores: conError
            };

        } catch (error) {
            console.error('❌ Error en cálculo múltiple:', error);
            throw error;
        }
    }

    // ===== MÉTODOS DE CÁLCULO INTERNOS =====

    /**
     * Valida los parámetros de entrada
     */
    validarParametros(peso, valor) {
        if (typeof peso !== 'number' || isNaN(peso)) {
            throw new Error('El peso debe ser un número válido');
        }

        if (typeof valor !== 'number' || isNaN(valor)) {
            throw new Error('El valor debe ser un número válido');
        }

        if (peso <= 0) {
            throw new Error('El peso debe ser mayor a 0 kg');
        }

        if (peso > 1000) {
            throw new Error('El peso máximo permitido es 1000 kg');
        }

        if (valor <= 0) {
            throw new Error('El valor debe ser mayor a $0');
        }

        if (valor > 100000) {
            throw new Error('El valor máximo permitido es $100,000');
        }
    }

    /**
     * Aplica el peso mínimo según políticas
     */
    aplicarPesoMinimo(peso) {
        return peso < 1 ? 1 : peso;
    }

    /**
     * Calcula el costo de envío basado en el peso
     */
    calcularCostoEnvio(peso) {
        const costoBase = peso * CONFIG.PRECIOS.COSTO_POR_KILO;
        return Math.max(costoBase, CONFIG.PRECIOS.MINIMO_ENVIO);
    }

    /**
     * Calcula impuestos según regulaciones aduaneras
     */
    calcularImpuestos(valor) {
        if (valor <= CONFIG.PRECIOS.IMPUESTOS.LIMITE) {
            return 0;
        }
        
        const baseImponible = valor - CONFIG.PRECIOS.IMPUESTOS.LIMITE;
        return baseImponible * CONFIG.PRECIOS.IMPUESTOS.PORCENTAJE;
    }

    /**
     * Genera un desglose detallado del cálculo
     */
    generarDesglose(valor, costoEnvio, desaduanaje, impuestos) {
        return {
            valorProducto: this.redondear(valor),
            costoEnvio: this.redondear(costoEnvio),
            desaduanaje: this.redondear(desaduanaje),
            subtotalEnvio: this.redondear(costoEnvio + desaduanaje),
            baseImponible: valor > CONFIG.PRECIOS.IMPUESTOS.LIMITE ? 
                this.redondear(valor - CONFIG.PRECIOS.IMPUESTOS.LIMITE) : 0,
            tasaImpuestos: valor > CONFIG.PRECIOS.IMPUESTOS.LIMITE ? 
                CONFIG.PRECIOS.IMPUESTOS.PORCENTAJE * 100 : 0,
            impuestos: this.redondear(impuestos),
            total: this.redondear(valor + costoEnvio + desaduanaje + impuestos)
        };
    }

    // ===== MANEJO DE CACHE =====

    /**
     * Genera clave única para el cache
     */
    generarClaveCache(peso, valor) {
        // Redondear para agrupar cálculos similares
        const pesoRedondeado = Math.round(peso * 10) / 10; // 1 decimal
        const valorRedondeado = Math.round(valor);
        return `calc_${pesoRedondeado}_${valorRedondeado}`;
    }

    /**
     * Guarda resultado en cache con expiración
     */
    guardarEnCache(clave, resultado) {
        // Limitar tamaño del cache
        if (this.cache.size >= 100) {
            this.limpiarCacheAntiguo();
        }
        
        this.cache.set(clave, {
            ...resultado,
            _cacheTimestamp: Date.now(),
            _cacheExpires: Date.now() + (5 * 60 * 1000) // 5 minutos
        });
    }

    /**
     * Limpia entradas antiguas del cache
     */
    limpiarCacheAntiguo() {
        const ahora = Date.now();
        let eliminados = 0;
        
        for (const [clave, valor] of this.cache.entries()) {
            if (valor._cacheExpires < ahora || eliminados < 10) {
                this.cache.delete(clave);
                eliminados++;
            }
        }
        
        if (eliminados > 0) {
            console.log(`🧹 Cache limpiado: ${eliminados} entradas eliminadas`);
        }
    }

    /**
     * Inicia limpieza automática del cache
     */
    iniciarLimpiezaCache() {
        setInterval(() => {
            this.limpiarCacheAntiguo();
        }, 2 * 60 * 1000); // Cada 2 minutos
    }

    /**
     * Limpia todo el cache manualmente
     */
    limpiarCache() {
        const tamañoAnterior = this.cache.size;
        this.cache.clear();
        console.log(`🗑️ Cache completamente limpiado: ${tamañoAnterior} entradas eliminadas`);
    }

    // ===== MANEJO DE ENLACES =====

    /**
     * Normaliza y valida enlaces de Amazon
     */
    normalizarEnlace(enlace) {
        try {
            // Verificar que sea una URL válida
            const url = new URL(enlace);
            
            // Validar dominio de Amazon
            const dominiosPermitidos = [
                'amazon.com',
                'amazon.com.mx',
                'amazon.ca',
                'amazon.co.uk',
                'amazon.de',
                'amazon.fr',
                'amazon.es',
                'amazon.it'
            ];
            
            const dominioValido = dominiosPermitidos.some(dominio => 
                url.hostname.includes(dominio)
            );
            
            if (!dominioValido) {
                throw new Error('Solo se aceptan enlaces de Amazon');
            }
            
            // Limpiar parámetros de tracking
            url.searchParams.delete('tag');
            url.searchParams.delete('linkCode');
            url.searchParams.delete('ref_');
            url.searchParams.delete('th');
            
            return url.toString();
            
        } catch (error) {
            if (error instanceof TypeError) {
                throw new Error('El enlace proporcionado no es válido');
            }
            throw error;
        }
    }

    /**
     * Valida y procesa datos del producto desde la API
     */
    validarYProcesarDatosProducto(data) {
        // Validar estructura básica
        if (!data || typeof data !== 'object') {
            throw new Error('Respuesta inválida del servidor');
        }

        if (data.error) {
            throw new Error(data.error);
        }

        // Validar campos requeridos
        const camposRequeridos = ['peso', 'valor', 'producto'];
        const camposFaltantes = camposRequeridos.filter(campo => !data[campo]);

        if (camposFaltantes.length > 0) {
            throw new Error(`Datos incompletos: ${camposFaltantes.join(', ')}`);
        }

        // Validar tipos de datos
        if (typeof data.peso !== 'number' || data.peso <= 0) {
            throw new Error('Peso del producto inválido');
        }

        if (typeof data.valor !== 'number' || data.valor <= 0) {
            throw new Error('Valor del producto inválido');
        }

        if (typeof data.producto !== 'string') {
            throw new Error('Nombre del producto inválido');
        }

        // Procesar y normalizar datos
        return {
            peso: Math.max(data.peso, 0.1), // Peso mínimo
            valor: Math.max(data.valor, 1), // Valor mínimo
            producto: data.producto.trim().substring(0, 100), // Limitar longitud
            imagen: data.imagen || null,
            enlace: data.enlace || null,
            moneda: data.moneda || 'USD',
            procesado: true
        };
    }

    // ===== UTILIDADES =====

    /**
     * Redondea números a 2 decimales
     */
    redondear(numero) {
        return Math.round(numero * 100) / 100;
    }

    /**
     * Genera ID único para el cálculo
     */
    generarIdCalculo() {
        return `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Registra cálculo exitoso para analytics
     */
    registrarCalculoExitoso(resultado) {
        // Podría enviarse a analytics aquí
        if (typeof gtag !== 'undefined') {
            gtag('event', 'calculo_realizado', {
                peso: resultado.peso,
                valor: resultado.valor,
                total: resultado.total,
                tiene_impuestos: resultado.impuestos > 0
            });
        }
    }

    // ===== MÉTODOS DE DIAGNÓSTICO =====

    /**
     * Obtiene estadísticas de uso
     */
    obtenerEstadisticas() {
        return {
            ...this.estadisticas,
            tamañoCache: this.cache.size,
            tasaCacheHit: this.estadisticas.calculosRealizados > 0 ? 
                (this.estadisticas.cacheHits / this.estadisticas.calculosRealizados * 100).toFixed(2) + '%' : '0%',
            ultimaLimpieza: new Date().toISOString()
        };
    }

    /**
     * Obtiene estado del sistema de cálculos
     */
    obtenerEstado() {
        return {
            cache: {
                tamaño: this.cache.size,
                claves: Array.from(this.cache.keys())
            },
            configuracion: {
                costoPorKilo: CONFIG.PRECIOS.COSTO_POR_KILO,
                desaduanaje: CONFIG.PRECIOS.DESADUANAJE,
                minimoEnvio: CONFIG.PRECIOS.MINIMO_ENVIO,
                limiteImpuestos: CONFIG.PRECIOS.IMPUESTOS.LIMITE,
                porcentajeImpuestos: CONFIG.PRECIOS.IMPUESTOS.PORCENTAJE
            },
            estadisticas: this.obtenerEstadisticas()
        };
    }

    /**
     * Simula cálculo para testing
     */
    simularCalculo(peso, valor, producto = 'Producto de prueba') {
        console.log('🧪 Simulando cálculo:', { peso, valor, producto });
        return this.calcular(peso, valor, producto);
    }
}

// ===== INSTANCIA SINGLETON Y EXPORTACIÓN =====

// Crear instancia única (singleton)
const calculadoraInstance = new CalculadoraEnvio();

// Exportar la instancia para uso global
export { calculadoraInstance as CalculadoraEnvio };

// También exportar la clase para testing
export { CalculadoraEnvio as CalculadoraEnvioClass };

// Hacer disponible para debugging en desarrollo
if (process.env.NODE_ENV === 'development') {
    window.CalculadoraEnvio = calculadoraInstance;
}

console.log('🧮 Módulo de cálculos cargado correctamente');
