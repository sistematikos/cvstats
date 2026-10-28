// ==========================================
// CONTROL VOLEY - ESCUDO DE SEGURIDAD Y BLOQUEO
// ==========================================

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

// 2. Bloqueo total del Clic Derecho (excepto en inputs de texto/textareas para permitir copiar/pegar licencias)
document.addEventListener('contextmenu', event => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return true; // Permite menú contextual en campos de texto para facilitar el pegado
    }
    event.preventDefault();
    return false;
});

// 3. Validación de sesión activa (Excluyendo la pantalla principal de activación)
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    // Si estamos en la raíz o en el index.html principal, permitimos la activación
    if (path.endsWith('/') || path.endsWith('index.html')) {
        return;
    }

    const empresaID = localStorage.getItem('youcontrol_empresa_id');
    const supaUrl = localStorage.getItem('control_voley_supa_url');
    
    if (!empresaID || !supaUrl) {
        window.location.replace('index.html');
    }
});
