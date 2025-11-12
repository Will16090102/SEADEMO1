// ==========================================================================
// SEA EXPRESS - MÓDULO DE CONFIGURACIÓN
// Configuración centralizada y gestión de variables de entorno
// ==========================================================================

/**
 * Configuración centralizada de SEA Express
 * Todas las constantes y configuraciones del sistema se gestionan aquí
 */
const CONFIG = {
    // ===== INFORMACIÓN DE LA EMPRESA =====
    EMPRESA: {
        NOMBRE: 'SEA Express',
        LEMA: 'Elígelo y es tuyo',
        TELEFONO: '+51 912 140 295',
        EMAIL: 'info@seaexpress.com',
        SITIO_WEB: 'https://seaexpress.com',
        DIRECCION: 'Lima, Perú'
    },

    // ===== CONFIGURACIÓN DE PRECIOS Y TARIFAS =====
    PRECIOS: {
        // Tarifas de envío
        COSTO_POR_KILO: 15,           // USD por kilogramo
        DESADUANAJE: 8,               // Costo fijo de desaduanaje
        MINIMO_ENVIO: 12,             // Mínimo de envío (pesos menores a 1kg)
        
        // Configuración de impuestos
        IMPUESTOS: {
            LIMITE: 200,              // Límite para aplicar impuestos (USD)
            PORCENTAJE: 0.25,         // 25% de impuestos sobre el excedente
            DESCRIPCION: 'IGV + Impuesto de Importación'
        },
        
        // Seguros opcionales
        SEGUROS: {
            BASICO: {
                PORCENTAJE: 0.01,     // 1% del valor declarado
                MINIMO: 5,            // Mínimo USD 5
                DESCRIPCION: 'Seguro básico contra pérdida'
            },
            COMPLETO: {
                PORCENTAJE: 0.02,     // 2% del valor declarado
                MINIMO: 10,           // Mínimo USD 10
                DESCRIPCION: 'Seguro completo contra pérdida y daños'
            }
        },
        
        // Servicios adicionales
        SERVICIOS_ADICIONALES: {
            EMBALAJE_PREMIUM: 15,
            RECOLECCION_DOMICILIO: 20,
            ENTREGA_EXPRESS: 25,
            ALMACENAMIENTO_EXTENDIDO: 5 // por día
        }
    },

    // ===== CONFIGURACIÓN DE API Y SERVICIOS EXTERNOS =====
    API: {
        // API principal para scraping de productos
        URL: 'https://tranquil-gold-area.glitch.me/api/amazon',
        TIMEOUT: 10000, // 10 segundos
        RETRY_ATTEMPTS: 2,
        RETRY_DELAY: 1000,
        
        // Headers comunes para todas las requests
        HEADERS: {
            'Content-Type': 'application/json',
            'X-Client': 'sea-express-web',
            'X-Version': '1.0.0',
            'Accept': 'application/json'
        },
        
        // Endpoints específicos
        ENDPOINTS: {
            AMAZON_SCRAPER: '/amazon',
            COTIZACION: '/cotizacion',
            HISTORIAL: '/historial'
        }
    },

    // ===== CONFIGURACIÓN DE WHATSAPP =====
    WHATSAPP: {
        NUMERO: '51912140295',
        MENSAJE_BASE: '¡Hola SEA Express! 👋\n\nQuiero aprovechar mi *descuento especial* para este envío:\n\n',
        PLANTILLAS: {
            COTIZACION: `
📦 *Producto:* {producto}
💰 *Valor del producto:* {valor}
⚖️ *Peso:* {peso}
🚚 *Costo de envío:* {costoEnvio}
🛃 *Desaduanaje:* {desaduanaje}
💵 *Impuestos:* {impuestos}
🔖 *Total envío:* {envioTotal}
💲 *Costo total:* {total}

¡Por favor contáctame para coordinar mi envío! 🚀
            `,
            CONSULTA: `
¡Hola SEA Express! 👋

Tengo una consulta sobre:
{consulta}

Mi pedido es:
{detalles}

¿Podrían ayudarme con esto?
            `
        }
    },

    // ===== CONFIGURACIÓN DE ALMACENAMIENTO =====
    HISTORIAL: {
        MAX_ELEMENTOS: 50,
        CLAVE_LOCALSTORAGE: 'sea_express_historial_v2',
        COMPRESION_HABILITADA: true,
        ENCRYPTION_HABILITADO: false,
        
        // Configuración de limpieza automática
        LIMPIEZA_AUTOMATICA: {
            HABILITADA: true,
            INTERVALO: 7 * 24 * 60 * 60 * 1000, // 1 semana
            MANTENER_ULTIMOS: 20
        }
    },

    // ===== CONFIGURACIÓN DE UI/UX =====
    UI: {
        // Animaciones
        ANIMACIONES: {
            DURACION_ENTRADA: 500,
            DURACION_SALIDA: 300,
            DURACION_CARGA: 1000,
            HABILITADAS: true
        },
        
        // Notificaciones
        NOTIFICACIONES: {
            DURACION: 5000,
            POSICION: 'top-right',
            MAX_SIMULTANEAS: 3
        },
        
        // Modo oscuro
        MODO_OSCURO: {
            AUTO: true,
            PREDETERMINADO: 'system' // 'light', 'dark', 'system'
        },
        
        // Responsive breakpoints
        BREAKPOINTS: {
            MOVIL: 768,
            TABLET: 1024,
            ESCRITORIO: 1200
        },
        
        // Accesibilidad
        ACCESIBILIDAD: {
            REDUCED_MOTION: true,
            HIGH_CONTRAST: false,
            FONT_SIZE: 'normal' // 'small', 'normal', 'large'
        }
    },

    // ===== CONFIGURACIÓN DE VALIDACIÓN =====
    VALIDACION: {
        // Límites de entrada
        LIMITES: {
            PESO: {
                MIN: 0.1,
                MAX: 1000,
                DEFAULT: 1
            },
            VALOR: {
                MIN: 1,
                MAX: 100000,
                DEFAULT: 100
            },
            PRODUCTO: {
                LONGITUD_MAX: 100
            },
            ENLACE: {
                LONGITUD_MAX: 500
            }
        },
        
        // Expresiones regulares para validación
        REGEX: {
            URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
            EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            TELEFONO: /^[\+]?[1-9][\d]{0,15}$/,
            MONEDA: /^\d+(\.\d{1,2})?$/,
            PESO: /^\d+(\.\d{1,2})?$/
        },
        
        // Mensajes de error
        MENSAJES_ERROR: {
            PESO_INVALIDO: 'El peso debe ser un número entre 0.1 y 1000 kg',
            VALOR_INVALIDO: 'El valor debe ser un número entre 1 y 100,000 USD',
            PRODUCTO_INVALIDO: 'La descripción del producto no puede exceder los 100 caracteres',
            ENLACE_INVALIDO: 'Por favor ingresa un enlace válido',
            CAMPOS_REQUERIDOS: 'Por favor completa todos los campos requeridos'
        }
    },

    // ===== CONFIGURACIÓN DE ANALYTICS Y TRACKING =====
    ANALYTICS: {
        // Google Analytics
        GA_TRACKING_ID: 'G-XXXXXXXXXX', // Reemplazar con ID real
        
        // Eventos a trackear
        EVENTOS: {
            CALCULO_REALIZADO: 'calculo_realizado',
            WHATSAPP_CLIC: 'whatsapp_clic',
            HISTORIAL_LIMPIADO: 'historial_limpiado',
            ERROR: 'error',
            EXCEPCION: 'excepcion'
        },
        
        // Dimensiones personalizadas
        DIMENSIONES: {
            TIPO_CALCULO: 'dimension1',
            USUARIO_RECURRENTE: 'dimension2',
            MODO_OSCURO: 'dimension3'
        }
    },

    // ===== CONFIGURACIÓN DE PERFORMANCE =====
    PERFORMANCE: {
        // Cache
        CACHE: {
            DURACION: 5 * 60 * 1000, // 5 minutos
            MAX_ELEMENTOS: 100,
            HABILITADO: true
        },
        
        // Lazy loading
        LAZY_LOAD: {
            IMAGENES: true,
            COMPONENTES: true,
            UMBRAL: 0.1
        },
        
        // Preload de recursos críticos
        PRELOAD: {
            CSS_CRITICO: true,
            FUENTES: true,
            IMAGENES_CRITICAS: true
        }
    },

    // ===== CONFIGURACIÓN DE IDIOMAS E INTERNACIONALIZACIÓN =====
    I18N: {
        IDIOMA_PREDETERMINADO: 'es',
        IDIOMAS_SOPORTADOS: ['es', 'en'],
        
        TEXTO: {
            es: {
                TITULO: 'Cotiza tu envío USA-Perú en segundos',
                DESCRIPCION: 'Simplemente ingresa el valor, peso y tipo de producto.',
                CALCULAR: 'Calcular',
                RESULTADOS: 'Resumen de Cotización',
                // ... más textos en español
            },
            en: {
                TITULO: 'Quote your USA-Peru shipment in seconds',
                DESCRIPCION: 'Simply enter the value, weight and product type.',
                CALCULAR: 'Calculate',
                RESULTADOS: 'Quote Summary',
                // ... más textos en inglés
            }
        }
    },

    // ===== CONFIGURACIÓN DE ENTORNO =====
    ENTORNO: {
        MODO: 'production', // 'development', 'staging', 'production'
        DEBUG: false,
        LOG_LEVEL: 'error', // 'debug', 'info', 'warn', 'error'
        
        // URLs por entorno
        URLS: {
            development: 'http://localhost:3000',
            staging: 'https://staging.seaexpress.com',
            production: 'https://seaexpress.com'
        },
        
        // Características por entorno
        CARACTERISTICAS: {
            development: {
                LOG_DETALLADO: true,
                HERRAMIENTAS_DESARROLLO: true,
                MOCK_API: true
            },
            staging: {
                LOG_DETALLADO: true,
                HERRAMIENTAS_DESARROLLO: false,
                MOCK_API: false
            },
            production: {
                LOG_DETALLADO: false,
                HERRAMIENTAS_DESARROLLO: false,
                MOCK_API: false
            }
        }
    },

    // ===== CONFIGURACIÓN DE SEGURIDAD =====
    SEGURIDAD: {
        // Headers de seguridad
        HEADERS: {
            CSP: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://tranquil-gold-area.glitch.me https://www.google-analytics.com;",
            HSTS: 'max-age=31536000; includeSubDomains',
            X_FRAME_OPTIONS: 'DENY',
            X_CONTENT_TYPE_OPTIONS: 'nosniff'
        },
        
        // Validación de entrada
        SANITIZACION: {
            HABILITADA: true,
            NIVEL: 'alto' // 'bajo', 'medio', 'alto'
        },
        
        // Rate limiting
        RATE_LIMITING: {
            MAX_REQUESTS: 100,
            VENTANA_TIEMPO: 15 * 60 * 1000 // 15 minutos
        }
    },

    // ===== CONFIGURACIÓN DE MANTENIMIENTO Y MONITOREO =====
    MANTENIMIENTO: {
        // Health checks
        HEALTH_CHECK: {
            INTERVALO: 30000, // 30 segundos
            TIMEOUT: 5000
        },
        
        // Monitoreo de errores
        MONITOREO_ERRORES: {
            HABILITADO: true,
            PROVIDER: 'console', // 'console', 'sentry', 'logrocket'
            SENTRY_DSN: '' // Configurar si se usa Sentry
        },
        
        // Métricas de performance
        METRICAS: {
            WEB_VITALS: true,
            CUSTOM_METRICS: true
        }
    }
};

// ===== VALIDACIÓN DE CONFIGURACIÓN =====

/**
 * Valida la configuración y aplica ajustes según el entorno
 */
class ValidadorConfig {
    static validar() {
        try {
            // Validar configuraciones críticas
            this.validarConfiguracionesCriticas();
            
            // Ajustar según el entorno
            this.ajustarPorEntorno();
            
            // Aplicar overrides desde variables de entorno
            this.aplicarVariablesEntorno();
            
            console.log('✅ Configuración validada correctamente');
            
        } catch (error) {
            console.error('❌ Error en configuración:', error);
            throw error;
        }
    }
    
    static validarConfiguracionesCriticas() {
        const criticas = [
            'API.URL',
            'PRECIOS.COSTO_POR_KILO',
            'PRECIOS.DESADUANAJE',
            'WHATSAPP.NUMERO'
        ];
        
        criticas.forEach(ruta => {
            const valor = this.obtenerValorPorRuta(CONFIG, ruta);
            if (valor === undefined || valor === null || valor === '') {
                throw new Error(`Configuración crítica faltante: ${ruta}`);
            }
        });
    }
    
    static ajustarPorEntorno() {
        const entorno = CONFIG.ENTORNO.MODO;
        const caracteristicas = CONFIG.ENTORNO.CARACTERISTICAS[entorno];
        
        // Aplicar características del entorno
        if (caracteristicas) {
            CONFIG.ENTORNO.DEBUG = caracteristicas.LOG_DETALLADO;
            CONFIG.ENTORNO.LOG_LEVEL = caracteristicas.LOG_DETALLADO ? 'debug' : 'error';
            
            // URL base según entorno
            CONFIG.EMPRESA.SITIO_WEB = CONFIG.ENTORNO.URLS[entorno];
        }
        
        // Configuraciones específicas de desarrollo
        if (entorno === 'development') {
            CONFIG.PERFORMANCE.CACHE.DURACION = 60000; // 1 minuto en desarrollo
            CONFIG.UI.ANIMACIONES.DURACION_ENTRADA = 100; // Animaciones más rápidas
        }
    }
    
    static aplicarVariablesEntorno() {
        // Overrides desde variables de entorno (si están disponibles)
        if (typeof process !== 'undefined' && process.env) {
            // Ejemplo: process.env.REACT_APP_API_URL podría sobreescribir CONFIG.API.URL
        }
        
        // Overrides desde meta tags
        const metaConfig = document.querySelector('meta[name="sea-express-config"]');
        if (metaConfig) {
            try {
                const configExtra = JSON.parse(metaConfig.getAttribute('content'));
                this.mezclarConfiguraciones(CONFIG, configExtra);
            } catch (error) {
                console.warn('⚠️ No se pudo parsear la configuración desde meta tags');
            }
        }
    }
    
    static obtenerValorPorRuta(objeto, ruta) {
        return ruta.split('.').reduce((acc, parte) => acc && acc[parte], objeto);
    }
    
    static mezclarConfiguraciones(objetoBase, objetoExtra) {
        Object.keys(objetoExtra).forEach(key => {
            if (objetoBase[key] && typeof objetoBase[key] === 'object' && !Array.isArray(objetoBase[key])) {
                this.mezclarConfiguraciones(objetoBase[key], objetoExtra[key]);
            } else {
                objetoBase[key] = objetoExtra[key];
            }
        });
    }
}

// ===== MÉTODOS DE UTILIDAD =====

/**
 * Utilidades para trabajar con la configuración
 */
class UtilidadesConfig {
    /**
     * Obtiene un valor de configuración por ruta
     * @param {string} ruta - Ruta de la configuración (ej: 'API.URL')
     * @param {any} valorDefault - Valor por defecto si no existe
     * @returns {any} Valor de la configuración
     */
    static obtener(ruta, valorDefault = null) {
        return ruta.split('.').reduce((acc, parte) => {
            if (acc && acc.hasOwnProperty(parte)) {
                return acc[parte];
            }
            console.warn(`⚠️ Configuración no encontrada: ${ruta}`);
            return valorDefault;
        }, CONFIG);
    }
    
    /**
     * Establece un valor de configuración
     * @param {string} ruta - Ruta de la configuración
     * @param {any} valor - Valor a establecer
     */
    static establecer(ruta, valor) {
        const partes = ruta.split('.');
        const ultimaParte = partes.pop();
        const objetoPadre = partes.reduce((acc, parte) => {
            if (!acc[parte]) acc[parte] = {};
            return acc[parte];
        }, CONFIG);
        
        objetoPadre[ultimaParte] = valor;
    }
    
    /**
     * Obtiene la configuración completa
     * @returns {Object} Configuración completa
     */
    static obtenerCompleta() {
        return JSON.parse(JSON.stringify(CONFIG)); // Deep clone
    }
    
    /**
     * Obtiene configuración para entorno actual
     * @returns {Object} Configuración del entorno actual
     */
    static obtenerConfiguracionEntorno() {
        return {
            entorno: CONFIG.ENTORNO.MODO,
            debug: CONFIG.ENTORNO.DEBUG,
            urlBase: CONFIG.ENTORNO.URLS[CONFIG.ENTORNO.MODO],
            caracteristicas: CONFIG.ENTORNO.CARACTERISTICAS[CONFIG.ENTORNO.MODO]
        };
    }
    
    /**
     * Verifica si una característica está habilitada
     * @param {string} caracteristica - Nombre de la característica
     * @returns {boolean} True si está habilitada
     */
    static estaHabilitado(caracteristica) {
        const rutas = {
            'cache': 'PERFORMANCE.CACHE.HABILITADO',
            'animaciones': 'UI.ANIMACIONES.HABILITADAS',
            'modo_oscuro': 'UI.MODO_OSCURO.AUTO',
            'compresion': 'HISTORIAL.COMPRESION_HABILITADA'
        };
        
        const ruta = rutas[caracteristica];
        return ruta ? this.obtener(ruta, false) : false;
    }
}

// ===== INICIALIZACIÓN =====

// Validar configuración al cargar
try {
    ValidadorConfig.validar();
} catch (error) {
    console.error('❌ Error crítico en configuración:', error);
    // En producción, podríamos cargar una configuración de respaldo
}

// ===== EXPORTACIÓN =====

export { CONFIG, UtilidadesConfig, ValidadorConfig };

// Hacer disponible globalmente para debugging
if (typeof window !== 'undefined' && CONFIG.ENTORNO.MODO === 'development') {
    window.SEAExpressConfig = CONFIG;
    window.SEAExpressConfigUtils = UtilidadesConfig;
}

console.log('⚙️ Módulo de configuración cargado correctamente');
