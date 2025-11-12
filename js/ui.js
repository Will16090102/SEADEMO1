// ==========================================================================
// SEA EXPRESS - MÓDULO DE INTERFAZ DE USUARIO
// Maneja toda la interacción con el DOM, animaciones y estados de UI
// ==========================================================================

import { CONFIG } from './config.js';

/**
 * Clase para gestión completa de la interfaz de usuario
 */
class GestorUI {
    constructor() {
        this.elementos = {};
        this.estados = {
            calculadoraVisible: false,
            resultadosVisibles: false,
            loading: false,
            modoOscuro: false,
            animacionesActivadas: true
        };
        this.ultimaCotizacion = null;
        this.notificacionesActivas = new Set();
        
        this.inicializarModoOscuro();
        this.configurarObservadores();
    }

    /**
     * Inicializa la UI y cachea todos los elementos del DOM
     */
    inicializar() {
        try {
            this.cachearElementos();
            this.configurarAccesibilidad();
            this.configurarAnimaciones();
            this.configurarEventosGlobales();
            this.mostrarEstadoInicial();
            
            console.log('🎨 UI inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando UI:', error);
        }
    }

    // ===== CACHE Y CONFIGURACIÓN DE ELEMENTOS =====

    /**
     * Cachea todos los elementos del DOM para acceso rápido
     */
    cachearElementos() {
        // Elementos de la calculadora
        this.elementos.calculadora = {
            // Inputs
            valorInput: document.getElementById('valor'),
            pesoInput: document.getElementById('peso'),
            productoInput: document.getElementById('producto'),
            enlaceInput: document.getElementById('enlace-producto'),
            
            // Botones
            btnCalcular: document.getElementById('btn-calcular'),
            btnCalcularEnlace: document.getElementById('btn-calcular-enlace'),
            
            // Tabs
            manualTab: document.getElementById('manual-tab'),
            enlaceTab: document.getElementById('enlace-tab'),
            manualTabBtn: document.getElementById('manualTab'),
            enlaceTabBtn: document.getElementById('enlaceTab'),
            
            // Contenedores
            calculadoraArea: document.getElementById('calculadoraArea'),
            calculatorWrapper: document.querySelector('.calculator-wrapper')
        };

        // Elementos de resultados
        this.elementos.resultados = {
            section: document.getElementById('result-section'),
            content: document.getElementById('result-content'),
            productoInfo: document.getElementById('producto-info'),
            valorResult: document.getElementById('valor-result'),
            pesoResult: document.getElementById('peso-result'),
            desaduanaje: document.getElementById('desaduanaje'),
            costoEnvio: document.getElementById('costo-envio'),
            impuestos: document.getElementById('impuestos'),
            envioTotal: document.getElementById('envio-total'),
            total: document.getElementById('total'),
            whatsappLink: document.getElementById('whatsapp-link')
        };

        // Elementos de historial
        this.elementos.historial = {
            container: document.getElementById('historial-container'),
            list: document.getElementById('historial-list'),
            clearBtn: document.getElementById('clear-historial-btn')
        };

        // Elementos generales
        this.elementos.generales = {
            mainContainer: document.querySelector('.main-container'),
            featuresSection: document.querySelector('.features-section'),
            testimonial: document.querySelector('.testimonial')
        };

        // Validar que todos los elementos críticos existan
        this.validarElementosCriticos();
    }

    /**
     * Valida que los elementos críticos existan en el DOM
     */
    validarElementosCriticos() {
        const elementosCriticos = [
            this.elementos.calculadora.valorInput,
            this.elementos.calculadora.pesoInput,
            this.elementos.resultados.section
        ];

        elementosCriticos.forEach((elemento, index) => {
            if (!elemento) {
                console.warn(`⚠️ Elemento crítico #${index} no encontrado en el DOM`);
            }
        });
    }

    /**
     * Configura mejoras de accesibilidad
     */
    configurarAccesibilidad() {
        // Mejorar labels y descripciones
        this.mejorarLabelsFormulario();
        
        // Configurar navegación por teclado
        this.configurarNavegacionTeclado();
        
        // Configurar anuncios para screen readers
        this.configurarAnnouncer();
        
        // Mejorar contraste si es necesario
        this.ajustarContraste();
    }

    // ===== GESTIÓN DE RESULTADOS =====

    /**
     * Muestra los resultados de la cotización
     * @param {Object} cotizacion - Objeto de cotización a mostrar
     */
    mostrarResultados(cotizacion) {
        try {
            this.ultimaCotizacion = cotizacion;
            
            // Actualizar contenido de resultados
            this.actualizarContenidoResultados(cotizacion);
            
            // Mostrar sección con animación
            this.mostrarSeccionResultados();
            
            // Scroll suave a resultados
            this.scrollSuaveAResultados();
            
            // Anunciar para screen readers
            this.announceParaScreenReader(
                `Cotización calculada. Total: $${cotizacion.total.toFixed(2)}`
            );
            
            // Tracking de visualización
            this.trackEvent('ui', 'resultados_mostrados', {
                total: cotizacion.total,
                tiene_impuestos: cotizacion.impuestos > 0
            });

        } catch (error) {
            console.error('❌ Error mostrando resultados:', error);
            this.mostrarNotificacion('Error al mostrar los resultados', 'error');
        }
    }

    /**
     * Actualiza el contenido de los resultados
     */
    actualizarContenidoResultados(cotizacion) {
        const { resultados } = this.elementos;

        // Información del producto
        if (cotizacion.producto) {
            resultados.productoInfo.innerHTML = this.crearHTMLProductoInfo(cotizacion.producto);
            resultados.productoInfo.style.display = 'block';
        } else {
            resultados.productoInfo.style.display = 'none';
        }

        // Valores numéricos
        resultados.valorResult.textContent = this.formatearMoneda(cotizacion.valor);
        resultados.pesoResult.textContent = this.formatearPeso(cotizacion.peso);
        resultados.desaduanaje.textContent = this.formatearMoneda(cotizacion.desaduanaje);
        resultados.costoEnvio.textContent = this.formatearMoneda(cotizacion.costoEnvio);
        resultados.impuestos.textContent = this.formatearMoneda(cotizacion.impuestos);
        resultados.envioTotal.textContent = this.formatearMoneda(cotizacion.envioTotal);
        resultados.total.textContent = this.formatearMoneda(cotizacion.total);

        // Destacar si hay impuestos
        if (cotizacion.impuestos > 0) {
            resultados.impuestos.classList.add('destacado');
        } else {
            resultados.impuestos.classList.remove('destacado');
        }
    }

    /**
     * Muestra la sección de resultados con animación
     */
    mostrarSeccionResultados() {
        const { resultados, calculadora } = this.elementos;
        
        // Mostrar sección
        resultados.section.classList.add('visible');
        calculadora.calculadoraArea.classList.add('has-result');
        
        // Animación de entrada
        this.animarEntradaResultados();
        
        this.estados.resultadosVisibles = true;
    }

    /**
     * Oculta la sección de resultados
     */
    ocultarResultados() {
        const { resultados, calculadora } = this.elementos;
        
        resultados.section.classList.remove('visible');
        calculadora.calculadoraArea.classList.remove('has-result');
        
        this.estados.resultadosVisibles = false;
    }

    // ===== GESTIÓN DE FORMULARIOS =====

    /**
     * Muestra estado de loading en un botón
     * @param {HTMLElement} boton - Botón a mostrar en estado loading
     * @param {boolean} mostrar - Si mostrar u ocultar loading
     */
    mostrarLoading(boton, mostrar = true) {
        if (!boton) return;

        if (mostrar) {
            const textoOriginal = boton.innerHTML;
            boton.dataset.originalText = textoOriginal;
            boton.innerHTML = this.crearSpinnerLoading() + ' Calculando...';
            boton.disabled = true;
            this.estados.loading = true;
        } else {
            const textoOriginal = boton.dataset.originalText;
            if (textoOriginal) {
                boton.innerHTML = textoOriginal;
            }
            boton.disabled = false;
            this.estados.loading = false;
        }
    }

    /**
     * Resalta un input con error
     * @param {HTMLElement} input - Input a resaltar
     * @param {string} mensaje - Mensaje de error (opcional)
     */
    resaltarError(input, mensaje = '') {
        if (!input) return;

        // Agregar clase de error
        input.classList.add('input-error');
        
        // Mostrar mensaje de error si se proporciona
        if (mensaje) {
            this.mostrarErrorInput(input, mensaje);
        }

        // Scroll al input con error
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Focus para corrección fácil
        input.focus();

        // Auto-remover el error después de 3 segundos
        setTimeout(() => {
            input.classList.remove('input-error');
            this.removerErrorInput(input);
        }, 3000);
    }

    /**
     * Limpia todos los formularios
     */
    limpiarFormularios() {
        const { calculadora } = this.elementos;
        
        if (calculadora.valorInput) calculadora.valorInput.value = '';
        if (calculadora.pesoInput) calculadora.pesoInput.value = '';
        if (calculadora.productoInput) calculadora.productoInput.value = '';
        if (calculadora.enlaceInput) calculadora.enlaceInput.value = '';
        
        this.ocultarResultados();
    }

    // ===== GESTIÓN DE HISTORIAL =====

    /**
     * Renderiza el historial de cotizaciones
     */
    renderizarHistorial() {
        try {
            const { historial } = this.elementos;
            const historialData = []; // Esto vendría del módulo de almacenamiento
            
            if (!historialData || historialData.length === 0) {
                historial.container.style.display = 'none';
                return;
            }

            historial.container.style.display = 'block';
            historial.list.innerHTML = '';

            historialData.forEach((item, index) => {
                const elementoHistorial = this.crearElementoHistorial(item, index);
                historial.list.appendChild(elementoHistorial);
            });

            // Animación de entrada para nuevos elementos
            this.animarEntradaHistorial();

        } catch (error) {
            console.error('❌ Error renderizando historial:', error);
        }
    }

    /**
     * Crea un elemento de historial
     */
    crearElementoHistorial(item, index) {
        const li = document.createElement('li');
        li.className = 'historial-item';
        li.style.animationDelay = `${index * 0.1}s`;
        
        li.innerHTML = `
            <div class="historial-header">
                <span class="historial-tipo">${item.tipo === "manual" ? "📝 Manual" : "🔗 Enlace"}</span>
                <span class="historial-fecha">${this.formatearFecha(item.fecha)}</span>
            </div>
            <div class="historial-producto">
                <strong>Producto:</strong> ${this.sanitizarHTML(item.producto || "Sin descripción")}
            </div>
            <div class="historial-datos">
                <span class="historial-valor">Valor: ${this.formatearMoneda(item.valor)}</span>
                <span class="historial-peso">Peso: ${this.formatearPeso(item.peso)}</span>
            </div>
            <div class="historial-total">
                <strong>Total:</strong> <span class="total-destacado">${this.formatearMoneda(item.total)}</span>
            </div>
        `;

        // Agregar evento de click para reutilizar
        li.addEventListener('click', () => this.reutilizarCotizacion(item));
        
        return li;
    }

    // ===== NOTIFICACIONES Y MENSAJES =====

    /**
     * Muestra una notificación al usuario
     * @param {string} mensaje - Mensaje a mostrar
     * @param {string} tipo - Tipo de notificación (error, success, warning, info)
     * @param {number} duracion - Duración en milisegundos
     */
    mostrarNotificacion(mensaje, tipo = 'info', duracion = 5000) {
        try {
            // Crear elemento de notificación
            const notificacion = this.crearElementoNotificacion(mensaje, tipo);
            
            // Agregar al DOM
            document.body.appendChild(notificacion);
            
            // Animación de entrada
            this.animarEntradaNotificacion(notificacion);
            
            // Trackear notificación
            this.trackEvent('ui', 'notificacion_mostrada', { tipo, mensaje });
            
            // Auto-eliminar después del tiempo especificado
            if (duracion > 0) {
                setTimeout(() => {
                    this.eliminarNotificacion(notificacion);
                }, duracion);
            }
            
            // Agregar a conjunto de notificaciones activas
            this.notificacionesActivas.add(notificacion);
            
            return notificacion;

        } catch (error) {
            console.error('❌ Error mostrando notificación:', error);
            // Fallback: alert básico
            alert(`${tipo.toUpperCase()}: ${mensaje}`);
        }
    }

    /**
     * Crea un elemento de notificación
     */
    crearElementoNotificacion(mensaje, tipo) {
        const notificacion = document.createElement('div');
        notificacion.className = `notification notification-${tipo}`;
        
        const iconos = {
            error: '❌',
            success: '✅',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        notificacion.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${iconos[tipo] || '💬'}</span>
                <span class="notification-message">${this.sanitizarHTML(mensaje)}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    &times;
                </button>
            </div>
        `;
        
        return notificacion;
    }

    /**
     * Elimina una notificación específica
     */
    eliminarNotificacion(notificacion) {
        this.animarSalidaNotificacion(notificacion);
        this.notificacionesActivas.delete(notificacion);
    }

    /**
     * Cierra todas las notificaciones
     */
    cerrarTodasNotificaciones() {
        this.notificacionesActivas.forEach(notificacion => {
            this.eliminarNotificacion(notificacion);
        });
    }

    // ===== ANIMACIONES Y TRANSICIONES =====

    /**
     * Configura el sistema de animaciones
     */
    configurarAnimaciones() {
        // Verificar preferencias de reducción de movimiento
        this.estados.animacionesActivadas = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Aplicar clases CSS según preferencias
        if (!this.estados.animacionesActivadas) {
            document.documentElement.classList.add('reduced-motion');
        }
    }

    /**
     * Animación de entrada para resultados
     */
    animarEntradaResultados() {
        if (!this.estados.animacionesActivadas) return;
        
        const { resultados } = this.elementos;
        
        resultados.section.style.transform = 'translateY(20px)';
        resultados.section.style.opacity = '0';
        
        requestAnimationFrame(() => {
            resultados.section.style.transition = 'all 0.5s ease-out';
            resultados.section.style.transform = 'translateY(0)';
            resultados.section.style.opacity = '1';
        });
    }

    /**
     * Animación de entrada para notificaciones
     */
    animarEntradaNotificacion(notificacion) {
        if (!this.estados.animacionesActivadas) {
            notificacion.style.opacity = '1';
            return;
        }
        
        notificacion.style.transform = 'translateX(100%)';
        notificacion.style.opacity = '0';
        
        requestAnimationFrame(() => {
            notificacion.style.transition = 'all 0.3s ease-out';
            notificacion.style.transform = 'translateX(0)';
            notificacion.style.opacity = '1';
        });
    }

    /**
     * Animación de salida para notificaciones
     */
    animarSalidaNotificacion(notificacion) {
        if (!this.estados.animacionesActivadas) {
            notificacion.remove();
            return;
        }
        
        notificacion.style.transform = 'translateX(100%)';
        notificacion.style.opacity = '0';
        
        setTimeout(() => {
            if (notificacion.parentElement) {
                notificacion.remove();
            }
        }, 300);
    }

    // ===== WHATSAPP INTEGRATION =====

    /**
     * Actualiza el enlace de WhatsApp con la cotización actual
     */
    actualizarEnlaceWhatsApp() {
        if (!this.ultimaCotizacion) return;
        
        const { resultados } = this.elementos;
        const mensaje = this.generarMensajeWhatsApp();
        const urlWhatsApp = `https://wa.me/${CONFIG.WHATSAPP.NUMERO}?text=${encodeURIComponent(mensaje)}`;
        
        resultados.whatsappLink.href = urlWhatsApp;
        
        // Trackear generación de enlace
        this.trackEvent('whatsapp', 'enlace_generado', {
            total: this.ultimaCotizacion.total
        });
    }

    /**
     * Genera el mensaje para WhatsApp
     */
    generarMensajeWhatsApp() {
        const cotizacion = this.ultimaCotizacion;
        let mensaje = CONFIG.WHATSAPP.MENSAJE_BASE;
        
        if (cotizacion.tipo === "manual") {
            mensaje += `📦 *Producto:* ${cotizacion.producto || "Sin descripción"}\n`;
        }
        
        mensaje += `💰 *Valor del producto:* ${this.formatearMoneda(cotizacion.valor)}\n`;
        mensaje += `⚖️ *Peso:* ${this.formatearPeso(cotizacion.peso)}\n`;
        mensaje += `🚚 *Costo de envío:* ${this.formatearMoneda(cotizacion.costoEnvio)}\n`;
        mensaje += `🛃 *Desaduanaje:* ${this.formatearMoneda(cotizacion.desaduanaje)}\n`;
        mensaje += `💵 *Impuestos:* ${this.formatearMoneda(cotizacion.impuestos)}\n`;
        mensaje += `🔖 *Total envío:* ${this.formatearMoneda(cotizacion.envioTotal)}\n`;
        mensaje += `💲 *Costo total:* ${this.formatearMoneda(cotizacion.total)}\n\n`;
        mensaje += "¡Por favor contáctame para coordinar mi envío! 🚀";
        
        return mensaje;
    }

    // ===== UTILIDADES Y HELPERS =====

    /**
     * Formatea moneda para display
     */
    formatearMoneda(valor) {
        return new Intl.NumberFormat('es-PE', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(valor);
    }

    /**
     * Formatea peso para display
     */
    formatearPeso(peso) {
        return new Intl.NumberFormat('es-PE', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 2
        }).format(peso) + ' kg';
    }

    /**
     * Formatea fecha para display
     */
    formatearFecha(fechaISO) {
        return new Date(fechaISO).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Sanitiza HTML para prevenir XSS
     */
    sanitizarHTML(texto) {
        const div = document.createElement('div');
        div.textContent = texto;
        return div.innerHTML;
    }

    /**
     * Crea spinner de loading
     */
    crearSpinnerLoading() {
        return '<div class="spinner"></div>';
    }

    /**
     * Crea HTML para información del producto
     */
    crearHTMLProductoInfo(producto) {
        return `
            <div class="result-item producto-info">
                <strong>Producto:</strong>
                <span class="producto-nombre">${this.sanitizarHTML(producto)}</span>
            </div>
        `;
    }

    // ===== ACCESIBILIDAD =====

    /**
     * Configura el announcer para screen readers
     */
    configurarAnnouncer() {
        if (!document.getElementById('sr-announcer')) {
            const announcer = document.createElement('div');
            announcer.id = 'sr-announcer';
            announcer.className = 'sr-only';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            document.body.appendChild(announcer);
        }
    }

    /**
     * Anuncia mensajes para screen readers
     */
    announceParaScreenReader(mensaje) {
        const announcer = document.getElementById('sr-announcer');
        if (announcer) {
            // Limpiar y establecer nuevo mensaje
            announcer.textContent = '';
            setTimeout(() => {
                announcer.textContent = mensaje;
            }, 100);
        }
    }

    /**
     * Configura navegación por teclado
     */
    configurarNavegacionTeclado() {
        document.addEventListener('keydown', (e) => {
            // Escape cierra notificaciones
            if (e.key === 'Escape') {
                this.cerrarTodasNotificaciones();
            }
            
            // Navegación entre secciones con Tab
            if (e.key === 'Tab' && !e.shiftKey) {
                this.manejarNavegacionTab(e);
            }
        });
    }

    // ===== MODO OSCURO =====

    /**
     * Inicializa el modo oscuro basado en preferencias del sistema
     */
    inicializarModoOscuro() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.estados.modoOscuro = prefersDark;
        
        if (prefersDark) {
            document.documentElement.classList.add('modo-oscuro');
        }
        
        // Escuchar cambios en las preferencias
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            this.estados.modoOscuro = e.matches;
            document.documentElement.classList.toggle('modo-oscuro', e.matches);
        });
    }

    // ===== OBSERVADORES Y EVENTOS =====

    /**
     * Configura observadores de mutación del DOM
     */
    configurarObservadores() {
        // Observar cambios en elementos críticos
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    this.verificarElementosPerdidos();
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Configura eventos globales de la UI
     */
    configurarEventosGlobales() {
        // Click fuera de notificaciones las cierra
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notification')) {
                this.cerrarTodasNotificaciones();
            }
        });
        
        // Resize optimizations
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.manejarResize();
            }, 250);
        });
    }

    // ===== MÉTODOS DE DIAGNÓSTICO =====

    /**
     * Obtiene el estado actual de la UI
     */
    obtenerEstado() {
        return {
            estados: this.estados,
            elementosCacheados: Object.keys(this.elementos).length,
            notificacionesActivas: this.notificacionesActivas.size,
            ultimaCotizacion: this.ultimaCotizacion ? 'presente' : 'ausente',
            accesibilidad: {
                announcer: !!document.getElementById('sr-announcer'),
                reducedMotion: !this.estados.animacionesActivadas
            }
        };
    }

    /**
     * Muestra estado inicial de la aplicación
     */
    mostrarEstadoInicial() {
        this.announceParaScreenReader('Calculadora de envíos SEA Express cargada correctamente');
    }

    // ===== MÉTODOS DE DEPURACIÓN =====

    /**
     * Verifica elementos perdidos en el DOM
     */
    verificarElementosPerdidos() {
        // Implementación para verificar que los elementos cacheados sigan en el DOM
    }

    /**
     * Maneja el evento resize
     */
    manejarResize() {
        // Optimizaciones para diferentes tamaños de pantalla
    }

    /**
     * Trackea eventos de UI
     */
    trackEvent(categoria, accion, parametros = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', accion, {
                event_category: categoria,
                ...parametros
            });
        }
    }
}

// ===== INSTANCIA SINGLETON Y EXPORTACIÓN =====

// Crear instancia única
const uiInstance = new GestorUI();

// Exportar la instancia para uso global
export { uiInstance as GestorUI };

// También exportar la clase para testing
export { GestorUI as GestorUIClass };

// Hacer disponible para debugging en desarrollo
if (process.env.NODE_ENV === 'development') {
    window.GestorUI = uiInstance;
}

console.log('🎨 Módulo de UI cargado correctamente');
