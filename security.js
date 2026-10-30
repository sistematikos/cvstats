// ==========================================
// CONTROL VOLEY - ESCUDO DE SEGURIDAD Y BLOQUEO
// ==========================================

// 0. Bloqueo de acceso web directo (Exigir instalación PWA)
(function() {
    const esLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const esPwaInstalada = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (!esPwaInstalada && !esLocal) {
        document.addEventListener("DOMContentLoaded", () => {
            document.body.innerHTML = `
                <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #030B1E; color: white; font-family: 'Plus Jakarta Sans', sans-serif; text-align: center; padding: 20px;">
                    <div style="max-width: 400px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 30px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
                        <div style="font-size: 40px; margin-bottom: 15px;">📱⚡</div>
                        <h2 style="font-size: 20px; font-weight: 900; margin-bottom: 10px; color: #00D2FF;">Acceso Restringido por Web</h2>
                        <p style="font-size: 13px; color: #94A3B8; line-height: 1.5; margin-bottom: 20px;">
                            Por seguridad, <b>Control Voley PRO</b> requiere estar instalada en tu dispositivo para poder utilizarse. No se permite el acceso directo desde el navegador web.
                        </p>
                        <div style="background: rgba(0, 85, 255, 0.15); border: 1px solid rgba(0, 85, 255, 0.3); padding: 15px; border-radius: 16px; font-size: 12px; color: #E2E8F0; text-align: left;">
                            <b>Cómo instalarla:</b><br>
                            • <b>En iPhone (Safari):</b> Toca el botón <i>Compartir</i> ⎋ y selecciona <b>"Añadir a inicio"</b> ➕.<br><br>
                            • <b>En Android / PC (Chrome):</b> Toca el menú de los 3 puntos ⋮ y selecciona <b>"Instalar aplicación"</b> o <b>"Añadir a la pantalla principal"</b>.
                        </div>
                    </div>
                </div>
            `;
        });
        throw new Error("Acceso web no autorizado. Debe instalar la PWA.");
    }
})();

// 1. Bloqueo de atajos de teclado para Inspección (F12, Ctrl+Shift+I, Ctrl+U, etc.)
document.addEventListener('keydown', function (e) {
    if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
    }
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 69)) {
        e.preventDefault();
        return false;
    }
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.keyCode === 85)) {
        e.preventDefault();
        return false;
    }
    if (e.ctrlKey && (e.key === 's' || e.key === 'S' || e.keyCode === 83)) {
        e.preventDefault();
        return false;
    }
});

// 2. Bloqueo total del Clic Derecho (excepto en inputs de texto/textareas para facilitar el pegado)
document.addEventListener('contextmenu', event => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return true; 
    }
    event.preventDefault();
    return false;
});

// 3. Validación de sesión activa del sistema (Excluyendo la pantalla principal de activación)
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    // Si estamos en la raíz o en el index.html principal, permitimos la activación
    if (path.endsWith('/') || path.endsWith('index.html')) {
        return;
    }

    const empresaID = localStorage.getItem('youcontrol_empresa_id');
    const licenciaValidada = localStorage.getItem('licencia_validada');
    
    // Si no hay licencia activa, redirige inmediatamente a la pantalla principal
    if (!empresaID || licenciaValidada !== 'true') {
        window.location.replace('index.html');
    }
});
