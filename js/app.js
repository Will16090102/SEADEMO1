// ==========================================================================
// SEA EXPRESS - APLICACIÓN PRINCIPAL
// Coordina todos los módulos y funcionalidades
// ==========================================================================

import { CONFIG } from './config.js';
import { CalculadoraEnvio } from './calculator.js';
import { GestorHistorial } from './storage.js';
import { GestorUI } from './ui.js';

/**
 * Clase principal de la aplicación SEA Express
 * Coordina todos los módulos y funcionalidades
 */
class SEAExpressApp {
    constructor() {
        this.ui = new GestorUI();
        this.estaInicializado = false;
        this.performanceMetrics = {
            inicioCarga: performance.now(),
            domListo: null,
            appLista: null
        };
    }

    /**
     * Inicializa la aplicación completa
     */
    async inicializar() {
        try {
            // Medir performance
            this.performanceMetrics.domListo = performance.now();

            // Inicializar UI primero
            this.ui.inicializar();
            
            // Configurar event listeners
            this.configurarEventListeners();
            
            // Cargar datos iniciales
            await this.cargarDatosIniciales();
            
            // Configurar características adicionales
            this.configurarCaracteristicasAvanzadas();
            
            // Marcar como inicializado
            this.estaInicializado = true;
            this.performanceMetrics.appLista = performance.now();
            
            // Registrar métricas
            this.registrarMetricasPerformance();
            
            console.log('🚀 SEA Express App inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando la aplicación:', error);
            this.ui.mostrarNotificacion(
                'Error al cargar la aplicación. Por favor, recarga la página.',
                'error'
            );
        }
    }

    /**
     * Configura todos los event listeners de la aplicación
     */
    configurarEventListeners() {
        const { elementos } = this.ui;

        // ===== EVENTOS DE FORMULARIO =====
        
        // Calculadora manual - Enter key support
        if (elementos.valorInput) {
            elementos.valorInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.calcularManual();
            });
            
            elementos.valorInput.addEventListener('blur', (e) => {
                this.validarInputNumerico(e.target, 1, 100000, 'valor');
            });
        }

        if (elementos.pesoInput) {
            elementos.pesoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.calcularManual();
            });
            
            elementos.pesoInput.addEventListener('blur', (e) => {
                this.validarInputNumerico(e.target, 0.1, 1000, 'peso');
            });
        }

        if (elementos.productoInput) {
            elementos.productoInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.calcularManual();
            });
        }

        // Calculadora por enlace - Enter key support
        if (elementos.enlaceInput) {
            elementos.enlaceInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.calcularPorEnlace();
            });
        }

        // ===== EVENTOS DE INTERFAZ =====
        
        // Limpiar formularios al cambiar tabs
        document.addEventListener('tabCambiado', (e) => {
            this.limpiarFormularios();
        });

        // Cerrar notificaciones al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notification')) {
                this.cerrarNotificaciones();
            }
        });

        // ===== EVENTOS DE PERFORMANCE =====
        
        // Precargar recursos cuando el usuario interactúa
        document.addEventListener('mouseover', this.precargarRecursos.bind(this), { once: true });
        document.addEventListener('touchstart', this.precargarRecursos.bind(this), { once: true });

        // Optimizar para conexiones lentas
        if (navigator.connection) {
            navigator.connection.addEventListener('change', this.ajustarParaConexion.bind(this));
        }

        console.log('✅ Event listeners configurados');
    }

    /**
     * Carga los datos iniciales de la aplicación
     */
    async cargarDatosIniciales() {
        try {
            // Cargar historial de cotizaciones
            this.ui.renderizarHistorial();
            
            // Verificar estado del servicio API
            await this.verificarEstadoServicio();
            
            // Cargar estadísticas si existen
            this.mostrarEstadisticasRapidas();
            
        } catch (error) {
            console.warn('⚠️ Error cargando datos iniciales:', error);
        }
    }

    /**
     * Configura características avanzadas de la aplicación
     */
    configurarCaracteristicasAvanzadas() {
        // Easter Egg
        this.configurarEasterEgg();
        
        // Service Worker (si está disponible)
        this.registrarServiceWorker();
        
        // Analytics básico
        this.configurarAnalytics();
        
        // Offline detection
        this.configurarDeteccionOffline();
        
        // Gestión de memoria
        this.configurarGestionMemoria();
    }

    // ===== MÉTODOS PRINCIPALES DE LA APLICACIÓN =====

    /**
     * Calcula el envío de forma manual
     */
    async calcularManual() {
        // Validar que estemos en la página correcta
        if (!this.ui.elementos.valorInput) {
            console.warn('⚠️ Calculadora manual no disponible en esta página');
            return;
        }

        const btn = document.getElementById('btn-calcular');
        
        try {
            // Iniciar tracking
            this.trackEvent('calculadora', 'calculo_manual_iniciado');
            
            this.ui.mostrarLoading(btn, true);
            this.ui.ocultarResultados();

            const peso = parseFloat(this.ui.elementos.pesoInput.value);
            const valor = parseFloat(this.ui.elementos.valorInput.value);
            const producto = this.ui.elementos.productoInput.value.trim();

            // Validación de datos
            if (!this.validarDatosEntrada(peso, valor)) {
                this.trackEvent('calculadora', 'calculo_manual_error_validacion');
                return;
            }

            // Mostrar animación de cálculo
            this.ui.mostrarAnimacionCalculo();

            // Pequeño delay para mejor UX
            await this.delay(300);

            // Realizar cálculo
            const cotizacion = CalculadoraEnvio.calcular(peso, valor, producto);
            
            // Mostrar resultados
            this.ui.mostrarResultados(cotizacion);
            this.ui.actualizarEnlaceWhatsApp();

            // Guardar en historial
            const guardadoExitoso = GestorHistorial.guardar(cotizacion);
            if (guardadoExitoso) {
                this.ui.renderizarHistorial();
            }

            // Tracking de éxito
            this.trackEvent('calculadora', 'calculo_manual_exitoso', {
                valor: valor,
                peso: peso,
                total: cotizacion.total
            });

            // Mostrar sugerencias basadas en el cálculo
            this.mostrarSugerencias(cotizacion);

        } catch (error) {
            console.error('❌ Error en cálculo manual:', error);
            this.ui.mostrarNotificacion(error.message, 'error');
            this.ui.resaltarError(this.ui.elementos.pesoInput);
            
            // Tracking de error
            this.trackEvent('calculadora', 'calculo_manual_error', {
                error: error.message
            });
            
        } finally {
            this.ui.mostrarLoading(btn, false);
        }
    }

    /**
     * Calcula el envío usando enlace de producto
     */
    async calcularPorEnlace() {
        if (!this.ui.elementos.enlaceInput) {
            console.warn('⚠️ Calculadora por enlace no disponible en esta página');
            return;
        }

        const btn = document.getElementById('btn-calcular-enlace');
        
        try {
            this.trackEvent('calculadora', 'calculo_enlace_iniciado');
            
            this.ui.mostrarLoading(btn, true);
            this.ui.ocultarResultados();

            const enlace = this.ui.elementos.enlaceInput.value.trim();

            if (!this.validarEnlace(enlace)) {
                throw new Error('Por favor ingresa un enlace válido de Amazon');
            }

            // Mostrar estado de conexión
            this.ui.mostrarNotificacion('Conectando con Amazon...', 'info');

            const datosProducto = await CalculadoraEnvio.calcularPorEnlace(enlace);

            // Autorellenar formulario manual
            this.ui.elementos.pesoInput.value = datosProducto.peso;
            this.ui.elementos.valorInput.value = datosProducto.valor;
            this.ui.elementos.productoInput.value = datosProducto.producto;

            // Calcular con los datos obtenidos
            await this.calcularManual();

            this.trackEvent('calculadora', 'calculo_enlace_exitoso');

        } catch (error) {
            console.error('❌ Error en cálculo por enlace:', error);
            this.ui.mostrarNotificacion(error.message, 'error');
            this.ui.resaltarError(this.ui.elementos.enlaceInput);
            
            this.trackEvent('calculadora', 'calculo_enlace_error', {
                error: error.message
            });
            
        } finally {
            this.ui.mostrarLoading(btn, false);
        }
    }

    /**
     * Cambia entre pestañas de la calculadora
     */
    switchTab(tabName) {
        try {
            // Ocultar todos los contenidos de tabs
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Desactivar todos los botones de tabs
            document.querySelectorAll('.tab-button').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Activar tab seleccionado
            const tabContent = document.getElementById(`${tabName}-tab`);
            const tabButton = document.getElementById(`${tabName}Tab`);
            
            if (tabContent && tabButton) {
                tabContent.classList.add('active');
                tabButton.classList.add('active');
                
                // Disparar evento personalizado
                const event = new CustomEvent('tabCambiado', {
                    detail: { tab: tabName }
                });
                document.dispatchEvent(event);
                
                this.trackEvent('interfaz', 'cambio_tab', { tab: tabName });
            }
            
            this.ui.ocultarResultados();
            
        } catch (error) {
            console.error('❌ Error cambiando tab:', error);
        }
    }

    /**
     * Limpia el historial de cotizaciones
     */
    limpiarHistorial() {
        if (confirm("¿Estás seguro de que quieres borrar todo el historial de cotizaciones?")) {
            try {
                const exito = GestorHistorial.limpiar();
                
                if (exito) {
                    this.ui.renderizarHistorial();
                    this.ui.mostrarNotificacion('Historial limpiado correctamente', 'success');
                    this.trackEvent('historial', 'limpiado');
                } else {
                    throw new Error('No se pudo limpiar el historial');
                }
            } catch (error) {
                this.ui.mostrarNotificacion('Error al limpiar el historial', 'error');
            }
        }
    }

    // ===== MÉTODOS DE VALIDACIÓN =====

    /**
     * Valida los datos de entrada para el cálculo
     */
    validarDatosEntrada(peso, valor) {
        if (isNaN(peso) || peso <= 0) {
            this.ui.mostrarNotificacion('Por favor ingresa un peso válido (mínimo 0.1 kg)', 'error');
            this.ui.resaltarError(this.ui.elementos.pesoInput);
            return false;
        }

        if (isNaN(valor) || valor <= 0) {
            this.ui.mostrarNotificacion('Por favor ingresa un valor declarado válido (mínimo $1)', 'error');
            this.ui.resaltarError(this.ui.elementos.valorInput);
            return false;
        }

        if (peso > 1000) {
            this.ui.mostrarNotificacion('El peso máximo permitido es 1000 kg', 'warning');
            this.ui.resaltarError(this.ui.elementos.pesoInput);
            return false;
        }

        if (valor > 100000) {
            this.ui.mostrarNotificacion('El valor máximo permitido es $100,000', 'warning');
            this.ui.resaltarError(this.ui.elementos.valorInput);
            return false;
        }

        return true;
    }

    /**
     * Valida un enlace de Amazon
     */
    validarEnlace(enlace) {
        if (!enlace) {
            throw new Error('Por favor ingresa un enlace');
        }

        // Validación básica de URL
        try {
            new URL(enlace);
        } catch {
            throw new Error('El enlace no tiene un formato válido');
        }

        // Validar que sea de Amazon
        if (!enlace.includes('amazon.') && !enlace.includes('amazon.com')) {
            throw new Error('Por favor ingresa un enlace válido de Amazon');
        }

        return true;
    }

    /**
     * Valida inputs numéricos en tiempo real
     */
    validarInputNumerico(input, min, max, tipo) {
        const valor = parseFloat(input.value);
        
        if (isNaN(valor) || valor < min) {
            input.value = min;
        } else if (valor > max) {
            input.value = max;
            this.ui.mostrarNotificacion(`El ${tipo} máximo permitido es ${max}`, 'warning');
        }
    }

    // ===== MÉTODOS DE UTILIDAD =====

    /**
     * Delay para mejor UX
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Limpia los formularios
     */
    limpiarFormularios() {
        if (this.ui.elementos.valorInput) this.ui.elementos.valorInput.value = '';
        if (this.ui.elementos.pesoInput) this.ui.elementos.pesoInput.value = '';
        if (this.ui.elementos.productoInput) this.ui.elementos.productoInput.value = '';
        if (this.ui.elementos.enlaceInput) this.ui.elementos.enlaceInput.value = '';
        
        this.ui.ocultarResultados();
    }

    /**
     * Cierra todas las notificaciones
     */
    cerrarNotificaciones() {
        document.querySelectorAll('.notification').forEach(notif => {
            if (!notif.classList.contains('persistent')) {
                notif.remove();
            }
        });
    }

    // ===== MÉTODOS AVANZADOS =====

    /**
     * Verifica el estado del servicio API
     */
    async verificarEstadoServicio() {
        try {
            const response = await fetch(CONFIG.API.URL, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                console.log('✅ Servicio API disponible');
            }
        } catch (error) {
            console.warn('⚠️ Servicio API no disponible:', error);
        }
    }

    /**
     * Muestra sugerencias basadas en la cotización
     */
    mostrarSugerencias(cotizacion) {
        const sugerencias = [];
        
        if (cotizacion.peso > 5) {
            sugerencias.push('💡 Considera dividir tu envío en paquetes más pequeños para ahorrar en costos');
        }
        
        if (cotizacion.valor > 500) {
            sugerencias.push('🛡️ Te recomendamos agregar seguro a tu envío por el alto valor');
        }
        
        if (cotizacion.impuestos > 0) {
            sugerencias.push('💰 Recuerda que los impuestos se aplican a productos mayores a $200');
        }
        
        if (sugerencias.length > 0) {
            setTimeout(() => {
                sugerencias.forEach((sugerencia, index) => {
                    setTimeout(() => {
                        this.ui.mostrarNotificacion(sugerencia, 'info');
                    }, index * 1000);
                });
            }, 1000);
        }
    }

    /**
     * Muestra estadísticas rápidas
     */
    mostrarEstadisticasRapidas() {
        const estadisticas = GestorHistorial.obtenerEstadisticas();
        if (estadisticas) {
            console.log('📊 Estadísticas:', estadisticas);
        }
    }

    // ===== PERFORMANCE Y OPTIMIZACIÓN =====

    /**
     * Registra métricas de performance
     */
    registrarMetricasPerformance() {
        const metrics = this.performanceMetrics;
        const totalLoadTime = metrics.appLista - metrics.inicioCarga;
        const domReadyTime = metrics.domListo - metrics.inicioCarga;
        const appInitTime = metrics.appLista - metrics.domListo;

        console.log('📈 Métricas de Performance:', {
            'Tiempo total carga': `${totalLoadTime.toFixed(2)}ms`,
            'DOM Ready': `${domReadyTime.toFixed(2)}ms`,
            'Inicialización App': `${appInitTime.toFixed(2)}ms`
        });

        // Enviar a analytics si está disponible
        if (typeof gtag !== 'undefined') {
            gtag('event', 'performance_metrics', {
                load_time: totalLoadTime,
                dom_ready_time: domReadyTime,
                app_init_time: appInitTime
            });
        }
    }

    /**
     * Precarrega recursos cuando el usuario interactúa
     */
    precargarRecursos() {
        // Precarrega recursos que se usarán pronto
        const recursos = [
            './assets/logos/LOGOSEAE.png',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
        ];

        recursos.forEach(recurso => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = recurso;
            link.as = recurso.endsWith('.css') ? 'style' : 'image';
            document.head.appendChild(link);
        });
    }

    /**
     * Ajusta la aplicación según el tipo de conexión
     */
    ajustarParaConexion() {
        if (navigator.connection) {
            const conexion = navigator.connection;
            
            if (conexion.saveData || conexion.effectiveType === 'slow-2g') {
                // Modo ahorro de datos
                this.ui.activarModoAhorroDatos();
            }
        }
    }

    // ===== CARACTERÍSTICAS AVANZADAS =====

    /**
     * Configura el Easter Egg
     */
    configurarEasterEgg() {
        const easterEggSequence = ['h', 'h', 'p', 'p'];
        let inputBuffer = [];
        
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            
            if (key === 'h' || key === 'p') {
                inputBuffer.push(key);
                if (inputBuffer.length > 4) inputBuffer.shift();
                
                if (inputBuffer.join('') === easterEggSequence.join('')) {
                    const emptyInputs = Array.from(document.querySelectorAll('input[type="text"], input[type="number"]'))
                        .every(input => input.value === "");
                    
                    if (emptyInputs) {
                        this.mostrarEasterEgg();
                    }
                    inputBuffer = [];
                }
            } else {
                inputBuffer = [];
            }
        });
    }

    /**
     * Muestra el Easter Egg
     */
    mostrarEasterEgg() {
        this.ui.mostrarNotificacion(
            '🎮 ¡Easter Egg desbloqueado! Todos tenemos luz y oscuridad en nuestro interior. Lo que importa es qué parte elegimos potenciar.',
            'info'
        );
        
        this.trackEvent('easter_egg', 'activado');
    }

    /**
     * Registra el Service Worker
     */
    async registrarServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('✅ Service Worker registrado:', registration);
            } catch (error) {
                console.log('❌ Service Worker no registrado:', error);
            }
        }
    }

    /**
     * Configura analytics básico
     */
    configurarAnalytics() {
        // Tracking de eventos básico
        window.trackEvent = this.trackEvent.bind(this);
    }

    /**
     * Trackea eventos de la aplicación
     */
    trackEvent(categoria, accion, parametros = {}) {
        console.log('📊 Evento:', { categoria, accion, ...parametros });
        
        // Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', accion, {
                event_category: categoria,
                ...parametros
            });
        }
        
        // Console en desarrollo
        if (process.env.NODE_ENV === 'development') {
            console.log(`🎯 ${categoria} - ${accion}`, parametros);
        }
    }

    /**
     * Configura detección de estado offline
     */
    configurarDeteccionOffline() {
        window.addEventListener('online', () => {
            this.ui.mostrarNotificacion('Conexión restaurada', 'success');
        });

        window.addEventListener('offline', () => {
            this.ui.mostrarNotificacion('Estás trabajando sin conexión', 'warning');
        });
    }

    /**
     * Configura gestión de memoria
     */
    configurarGestionMemoria() {
        // Limpiar cache periódicamente
        setInterval(() => {
            CalculadoraEnvio.limpiarCache();
        }, 5 * 60 * 1000); // Cada 5 minutos
    }

    // ===== MÉTODOS PÚBLICOS =====

    /**
     * Obtiene el estado de la aplicación
     */
    obtenerEstado() {
        return {
            inicializado: this.estaInicializado,
            performance: this.performanceMetrics,
            ui: this.ui ? 'activo' : 'inactivo'
        };
    }

    /**
     * Reinicia la aplicación
     */
    reiniciar() {
        this.limpiarFormularios();
        this.cerrarNotificaciones();
        console.log('🔄 Aplicación reiniciada');
    }
}

// ===== INICIALIZACIÓN Y EXPORTACIÓN =====

// Crear instancia global de la aplicación
const SEAApp = new SEAExpressApp();

// Exportar para uso en otros módulos
export { SEAApp };

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SEAApp.inicializar().catch(console.error);
    });
} else {
    SEAApp.inicializar().catch(console.error);
}

// Hacer disponible globalmente para event handlers del HTML
window.SEAApp = SEAApp;

// Funciones globales para HTML (backward compatibility)
window.switchTab = (tabName) => SEAApp.switchTab(tabName);
window.calcular = () => SEAApp.calcularManual();
window.calcularPorEnlace = () => SEAApp.calcularPorEnlace();
window.limpiarHistorial = () => SEAApp.limpiarHistorial();

console.log('📦 SEA Express App cargado');
