// components.js - Carga dinámica de header y footer
class ComponentLoader {
    static async loadHeader() {
        try {
            const response = await fetch('components/header.html');
            const html = await response.text();
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                headerContainer.innerHTML = html;
            }
        } catch (error) {
            console.error('Error loading header:', error);
        }
    }

    static async loadFooter() {
        try {
            const response = await fetch('components/footer.html');
            const html = await response.text();
            const footerContainer = document.getElementById('footer-container');
            if (footerContainer) {
                footerContainer.innerHTML = html;
            }
        } catch (error) {
            console.error('Error loading footer:', error);
        }
    }

    static async loadAll() {
        await this.loadHeader();
        await this.loadFooter();
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    ComponentLoader.loadAll();
});
