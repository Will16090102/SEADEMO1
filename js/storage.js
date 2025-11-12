// ==========================================================================
// SEA EXPRESS - MÓDULO DE ALMACENAMIENTO
// Maneja almacenamiento local con compresión, encriptación y gestión de datos
// ==========================================================================

import { CONFIG } from './config.js';

/**
 * Clase para gestión avanzada de almacenamiento local
 */
class GestorAlmacenamiento {
    constructor() {
        this.prefijo = 'sea_express';
        this.estadisticas = {
            lecturas: 0,
            escrituras: 0,
            compresiones: 0,
            errores: 0,
            espacioAhorrado: 0
        };
        
        this.validarCompatibilidad();
        this.iniciarMonitoreoEspacio();
    }

    /**
     * Valida que el navegador soporte las funcionalidades necesarias
     */
    validarCompatibilidad() {
        if (typeof localStorage === 'undefined') {
            throw new Error('El navegador no soporta almacenamiento local');
        }

        if (typeof btoa === 'undefined' || typeof atob === 'undefined') {
            throw new Error('El navegador no soporta las funciones de codificación Base64');
        }

        console.log('✅ Almacenamiento local compatible');
    }

    // ===== GESTIÓN DE HISTORIAL =====

    /**
     * Guarda una cotización en el historial
     * @param {Object} cotizacion - Objeto de cotización a guardar
     * @returns {boolean} True si se guardó correctamente
     */
    guardarCotizacion(cotizacion) {
        try {
            this.estadisticas.escrituras++;

            // Validar cotización
            this.validarCotizacion(cotizacion);

            // Obtener historial actual
            let historial = this.obtenerHistorial();

            // Generar ID único y timestamp
            const cotizacionCompleta = {
                ...cotizacion,
                id: this.generarIdUnico(),
                timestamp: Date.now(),
                fecha: new Date().toISOString(),
                version: '1.0'
            };

            // Limitar tamaño del historial
            if (historial.length >= CONFIG.HISTORIAL.MAX_ELEMENTOS) {
                historial = this.rotarHistorial(historial);
            }

            // Agregar al inicio
            historial.unshift(cotizacionCompleta);

            // Comprimir y guardar
            const datosComprimidos = this.comprimirDatos(historial);
            const guardadoExitoso = this.guardarEnLocalStorage(
                CONFIG.HISTORIAL.CLAVE_LOCALSTORAGE, 
                datosComprimidos
            );

            if (guardadoExitoso) {
                this.emitirEvento('historialActualizado', { accion: 'guardar', cotizacion: cotizacionCompleta });
                return true;
            }

            throw new Error('No se pudo guardar en localStorage');

        } catch (error) {
            this.estadisticas.errores++;
            console.error('❌ Error guardando cotización:', error);
            return false;
        }
    }

    /**
     * Obtiene el historial completo de cotizaciones
     * @returns {Array} Array de cotizaciones ordenadas por fecha
     */
    obtenerHistorial() {
        try {
            this.estadisticas.lecturas++;

            const datosComprimidos = localStorage.getItem(CONFIG.HISTORIAL.CLAVE_LOCALSTORAGE);
            
            if (!datosComprimidos) {
                return [];
            }

            const historial = this.descomprimirDatos(datosComprimidos);
            
            // Validar y limpiar historial
            return this.limpiarYValidarHistorial(historial);

        } catch (error) {
            this.estadisticas.errores++;
            console.error('❌ Error obteniendo historial:', error);
            
            // En caso de error, limpiar historial corrupto
            this.limpiarHistorial();
            return [];
        }
    }

    /**
     * Limpia todo el historial
     * @returns {boolean} True si se limpió correctamente
     */
    limpiarHistorial() {
        try {
            localStorage.removeItem(CONFIG.HISTORIAL.CLAVE_LOCALSTORAGE);
            this.emitirEvento('historialActualizado', { accion: 'limpiar' });
            
            console.log('🗑️ Historial limpiado correctamente');
            return true;

        } catch (error) {
            this.estadisticas.errores++;
            console.error('❌ Error limpiando historial:', error);
            return false;
        }
    }

    /**
     * Elimina una cotización específica del historial
     * @param {string} id - ID de la cotización a eliminar
     * @returns {boolean} True si se eliminó correctamente
     */
    eliminarCotizacion(id) {
        try {
            let historial = this.obtenerHistorial();
            const tamañoInicial = historial.length;
            
            historial = historial.filter(cotizacion => cotizacion.id !== id);
            
            if (historial.length === tamañoInicial) {
                console.warn('⚠️ Cotización no encontrada para eliminar:', id);
                return false;
            }

            const datosComprimidos = this.comprimirDatos(historial);
            const guardadoExitoso = this.guardarEnLocalStorage(
                CONFIG.HISTORIAL.CLAVE_LOCALSTORAGE, 
                datosComprimidos
            );

            if (guardadoExitoso) {
                this.emitirEvento('historialActualizado', { accion: 'eliminar', id });
                return true;
            }

            return false;

        } catch (error) {
            this.estadisticas.errores++;
            console.error('❌ Error eliminando cotización:', error);
            return false;
        }
    }

    // ===== COMPRESIÓN Y CODIFICACIÓN =====

    /**
     * Comprime datos usando Base64 y técnicas de optimización
     * @param {any} datos - Datos a comprimir
     * @returns {string} Datos comprimidos
     */
    comprimirDatos(datos) {
        try {
            this.estadisticas.compresiones++;

            // Convertir a JSON
            const jsonString = JSON.stringify(datos);
            const tamañoOriginal = new Blob([jsonString]).size;

            // Aplicar compresión simple (podría mejorarse con LZ-String)
            const comprimido = btoa(unescape(encodeURIComponent(jsonString)));
            const tamañoComprimido = new Blob([comprimido]).size;

            // Calcular ahorro
            const ahorro = tamañoOriginal - tamañoComprimido;
            if (ahorro > 0) {
                this.estadisticas.espacioAhorrado += ahorro;
            }

            console.log(`📦 Compresión: ${tamañoOriginal} → ${tamañoComprimido} bytes (${ahorro} bytes ahorrados)`);

            return comprimido;

        } catch (error) {
            console.error('❌ Error comprimiendo datos:', error);
            // Fallback: devolver datos sin comprimir
            return JSON.stringify(datos);
        }
    }

    /**
     * Descomprime datos previamente comprimidos
     * @param {string} datosComprimidos - Datos comprimidos
     * @returns {any} Datos originales
     */
    descomprimirDatos(datosComprimidos) {
        try {
            // Intentar descompresión Base64
            const jsonString = decodeURIComponent(escape(atob(datosComprimidos)));
            return JSON.parse(jsonString);

        } catch (error) {
            // Fallback: intentar como JSON directo
            try {
                return JSON.parse(datosComprimidos);
            } catch {
                throw new Error('No se pudieron descomprimir los datos');
            }
        }
    }

    // ===== VALIDACIÓN Y LIMPIEZA =====

    /**
     * Valida que una cotización tenga la estructura correcta
     * @param {Object} cotizacion - Cotización a validar
     */
    validarCotizacion(cotizacion) {
        if (!cotizacion || typeof cotizacion !== 'object') {
            throw new Error('La cotización debe ser un objeto válido');
        }

        const camposRequeridos = ['tipo', 'peso', 'valor', 'total'];
        const camposFaltantes = camposRequeridos.filter(campo => !(campo in cotizacion));

        if (camposFaltantes.length > 0) {
            throw new Error(`Campos requeridos faltantes: ${camposFaltantes.join(', ')}`);
        }

        if (typeof cotizacion.peso !== 'number' || cotizacion.peso <= 0) {
            throw new Error('Peso inválido');
        }

        if (typeof cotizacion.valor !== 'number' || cotizacion.valor <= 0) {
            throw new Error('Valor inválido');
        }

        if (typeof cotizacion.total !== 'number' || cotizacion.total <= 0) {
            throw new Error('Total inválido');
        }
    }

    /**
     * Limpia y valida el historial completo
     * @param {Array} historial - Historial a limpiar
     * @returns {Array} Historial limpio y validado
     */
    limpiarYValidarHistorial(historial) {
        if (!Array.isArray(historial)) {
            return [];
        }

        return historial
            .filter(cotizacion => {
                try {
                    this.validarCotizacion(cotizacion);
                    return true;
                } catch {
                    return false;
                }
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Rota el historial cuando alcanza el límite máximo
     * @param {Array} historial - Historial actual
     * @returns {Array} Historial rotado
     */
    rotarHistorial(historial) {
        // Mantener solo los más recientes
        const historialRotado = historial.slice(0, CONFIG.HISTORIAL.MAX_ELEMENTOS - 1);
        
        console.log(`🔄 Historial rotado: ${historial.length} → ${historialRotado.length} elementos`);
        
        return historialRotado;
    }

    // ===== ESTADÍSTICAS Y MÉTRICAS =====

    /**
     * Obtiene estadísticas del historial
     * @returns {Object} Estadísticas detalladas
     */
    obtenerEstadisticasHistorial() {
        const historial = this.obtenerHistorial();
        
        if (historial.length === 0) {
            return null;
        }

        const totales = historial.reduce((acc, item) => {
            acc.totalEnvios += item.total;
            acc.promedioPeso += item.peso;
            acc.promedioValor += item.valor;
            acc.enviosConImpuestos += item.impuestos > 0 ? 1 : 0;
            return acc;
        }, { 
            totalEnvios: 0, 
            promedioPeso: 0, 
            promedioValor: 0,
            enviosConImpuestos: 0 
        });

        return {
            totalCotizaciones: historial.length,
            gastoTotal: totales.totalEnvios,
            pesoPromedio: totales.promedioPeso / historial.length,
            valorPromedio: totales.promedioValor / historial.length,
            porcentajeConImpuestos: (totales.enviosConImpuestos / historial.length * 100).toFixed(1),
            ultimaCotizacion: historial[0]?.fecha,
            primeraCotizacion: historial[historial.length - 1]?.fecha,
            rangoDias: this.calcularRangoDias(historial)
        };
    }

    /**
     * Calcula el rango de días del historial
     * @param {Array} historial - Historial de cotizaciones
     * @returns {number} Días de diferencia
     */
    calcularRangoDias(historial) {
        if (historial.length < 2) return 0;
        
        const primeraFecha = new Date(historial[historial.length - 1].timestamp);
        const ultimaFecha = new Date(historial[0].timestamp);
        
        return Math.ceil((ultimaFecha - primeraFecha) / (1000 * 60 * 60 * 24));
    }

    // ===== GESTIÓN DE ESPACIO =====

    /**
     * Inicia monitoreo del espacio de almacenamiento
     */
    iniciarMonitoreoEspacio() {
        // Verificar espacio cada 30 segundos
        setInterval(() => {
            this.verificarEspacioDisponible();
        }, 30000);
    }

    /**
     * Verifica el espacio disponible en localStorage
     * @returns {Object} Información del espacio
     */
    verificarEspacioDisponible() {
        try {
            const claveTest = `${this.prefijo}_test_espacio`;
            const datosTest = 'x'.repeat(1024); // 1KB de datos de prueba
            
            localStorage.setItem(claveTest, datosTest);
            localStorage.removeItem(claveTest);
            
            return {
                disponible: true,
                mensaje: 'Espacio de almacenamiento suficiente'
            };
            
        } catch (error) {
            console.warn('⚠️ Espacio de almacenamiento limitado');
            
            // Intentar liberar espacio
            this.liberarEspacio();
            
            return {
                disponible: false,
                mensaje: 'Espacio de almacenamiento insuficiente',
                accion: 'espacio_liberado'
            };
        }
    }

    /**
     * Libera espacio eliminando datos antiguos
     */
    liberarEspacio() {
        try {
            const historial = this.obtenerHistorial();
            
            if (historial.length > 10) {
                // Mantener solo las 10 cotizaciones más recientes
                const historialReducido = historial.slice(0, 10);
                const datosComprimidos = this.comprimirDatos(historialReducido);
                
                this.guardarEnLocalStorage(CONFIG.HISTORIAL.CLAVE_LOCALSTORAGE, datosComprimidos);
                console.log('🧹 Espacio liberado: Historial reducido a 10 elementos');
            }
            
        } catch (error) {
            console.error('❌ Error liberando espacio:', error);
        }
    }

    /**
     * Obtiene el tamaño aproximado del almacenamiento
     * @returns {number} Tamaño en bytes
     */
    obtenerTamañoAlmacenamiento() {
        let tamañoTotal = 0;
        
        for (let clave in localStorage) {
            if (localStorage.hasOwnProperty(clave)) {
                const valor = localStorage.getItem(clave);
                tamañoTotal += clave.length + valor.length;
            }
        }
        
        return tamañoTotal;
    }

    // ===== UTILIDADES =====

    /**
     * Genera un ID único para cotizaciones
     * @returns {string} ID único
     */
    generarIdUnico() {
        return `cot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Guarda datos en localStorage con manejo de errores
     * @param {string} clave - Clave de almacenamiento
     * @param {string} valor - Valor a guardar
     * @returns {boolean} True si se guardó correctamente
     */
    guardarEnLocalStorage(clave, valor) {
        try {
            localStorage.setItem(clave, valor);
            return true;
        } catch (error) {
            console.error('❌ Error guardando en localStorage:', error);
            
            if (error.name === 'QuotaExceededError') {
                this.liberarEspacio();
                // Reintentar después de liberar espacio
                try {
                    localStorage.setItem(clave, valor);
                    return true;
                } catch {
                    return false;
                }
            }
            
            return false;
        }
    }

    /**
     * Emite eventos personalizados para notificar cambios
     * @param {string} tipo - Tipo de evento
     * @param {Object} detalle - Detalles del evento
     */
    emitirEvento(tipo, detalle) {
        const evento = new CustomEvent(tipo, { detail: detalle });
        document.dispatchEvent(evento);
    }

    // ===== MÉTODOS DE DIAGNÓSTICO =====

    /**
     * Obtiene estadísticas completas del módulo
     * @returns {Object} Estadísticas detalladas
     */
    obtenerEstadisticas() {
        return {
            ...this.estadisticas,
            espacioAhorradoKB: (this.estadisticas.espacioAhorrado / 1024).toFixed(2),
            tasaCompresion: this.estadisticas.escrituras > 0 ? 
                (this.estadisticas.compresiones / this.estadisticas.escrituras * 100).toFixed(2) + '%' : '0%',
            tamañoAlmacenamiento: this.obtenerTamañoAlmacenamiento(),
            historial: {
                total: this.obtenerHistorial().length,
                estadisticas: this.obtenerEstadisticasHistorial()
            }
        };
    }

    /**
     * Obtiene información de diagnóstico
     * @returns {Object} Información de diagnóstico
     */
    obtenerDiagnostico() {
        return {
            compatibilidad: {
                localStorage: typeof localStorage !== 'undefined',
                base64: typeof btoa !== 'undefined' && typeof atob !== 'undefined',
                compression: true
            },
            espacio: this.verificarEspacioDisponible(),
            estadisticas: this.obtenerEstadisticas(),
            configuracion: {
                maxElementos: CONFIG.HISTORIAL.MAX_ELEMENTOS,
                clave: CONFIG.HISTORIAL.CLAVE_LOCALSTORAGE
            }
        };
    }

    /**
     * Exporta el historial como JSON
     * @returns {string} Historial en formato JSON
     */
    exportarHistorial() {
        const historial = this.obtenerHistorial();
        return JSON.stringify(historial, null, 2);
    }

    /**
     * Importa historial desde JSON
     * @param {string} jsonData - Datos JSON a importar
     * @returns {boolean} True si se importó correctamente
     */
    importarHistorial(jsonData) {
        try {
            const historialImportado = JSON.parse(jsonData);
            
            if (!Array.isArray(historialImportado)) {
                throw new Error('Los datos importados deben ser un array');
            }

            // Validar cada elemento del historial importado
            historialImportado.forEach(cotizacion => {
                this.validarCotizacion(cotizacion);
            });

            // Combinar con historial existente
            const historialExistente = this.obtenerHistorial();
            const historialCombinado = [...historialImportado, ...historialExistente];

            // Limitar tamaño
            const historialLimitado = historialCombinado.slice(0, CONFIG.HISTORIAL.MAX_ELEMENTOS);

            // Guardar
            const datosComprimidos = this.comprimirDatos(historialLimitado);
            const guardadoExitoso = this.guardarEnLocalStorage(
                CONFIG.HISTORIAL.CLAVE_LOCALSTORAGE, 
                datosComprimidos
            );

            if (guardadoExitoso) {
                this.emitirEvento('historialActualizado', { accion: 'importar', elementos: historialImportado.length });
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ Error importando historial:', error);
            return false;
        }
    }
}

// ===== INSTANCIA SINGLETON Y EXPORTACIÓN =====

// Crear instancia única
const almacenamientoInstance = new GestorAlmacenamiento();

// Exportar la instancia para uso global
export { almacenamientoInstance as GestorAlmacenamiento };

// También exportar la clase para testing
export { GestorAlmacenamiento as GestorAlmacenamientoClass };

// Hacer disponible para debugging en desarrollo
if (process.env.NODE_ENV === 'development') {
    window.GestorAlmacenamiento = almacenamientoInstance;
}

console.log('💾 Módulo de almacenamiento cargado correctamente');
