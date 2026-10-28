import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const MASTER_SUPA_URL = "https://ajdimbptzoeqzrrioywt.supabase.co";
const MASTER_SUPA_KEY = "sb_publishable_aVydbrj88elb7XVq1yopFw_2U4MHgHv";

const supabaseMaster = createClient(MASTER_SUPA_URL, MASTER_SUPA_KEY);
const getHardwareID = () => btoa(navigator.userAgent + navigator.language);

// 1. Botón de pegado automático directo
const btnPegar = document.getElementById('btnPegarPortapapeles');
if (btnPegar) {
    btnPegar.addEventListener('click', async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const textoCopiado = await navigator.clipboard.readText();
                document.getElementById('tokenInput').value = textoCopiado.trim();
                const statusDiv = document.getElementById('statusMsg');
                if (statusDiv) {
                    statusDiv.className = "text-xs font-bold text-emerald-600";
                    statusDiv.innerText = "¡Código pegado con éxito!";
                }
            } else {
                alert("Tu navegador no permite lectura automática. Mantén presionado el cuadro de texto.");
            }
        } catch (err) {
            alert("No se pudo acceder al portapapeles. Mantén presionado el recuadro para pegar tu código.");
        }
    });
}

// 2. Proceso de activación exclusivo por Licencia (Sin contraseñas)
async function procesarActivacionEInstalacion() {
    const rawToken = document.getElementById('tokenInput').value.trim();
    const statusDiv = document.getElementById('statusMsg');
    if (!rawToken) return alert("Por favor, pega el código de licencia primero.");
    
    const btn = document.getElementById('btnActivarEInstalar');
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Verificando licencia...`;

    try {
        const data = JSON.parse(atob(rawToken));
        const hwID = getHardwareID();
        const activationId = data.clubId || data.activation_id;

        if (!activationId) {
            throw new Error("El token no contiene un ID de club válido.");
        }

        // Consulta directa a la tabla de licencias en Supabase Maestro
        const { data: empresaData, error: empresaError } = await supabaseMaster
            .from('licencias')
            .select('*')
            .eq('id', activationId)
            .single();

        if (empresaError || !empresaData) {
            throw new Error("El club o la licencia no existe en el sistema.");
        }

        let equiposLicencia = Array.isArray(empresaData.equipos) ? empresaData.equipos : [];
        let limiteStr = empresaData.limite_dispositivos || data.limite || "3";
        let limiteLicencia = (limiteStr === "Ilimitado") ? 999 : (parseInt(limiteStr) || 3);

        if (!equiposLicencia.includes(hwID) && equiposLicencia.length >= limiteLicencia) {
            alert("Error: Límite de dispositivos alcanzado para esta licencia.");
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-download text-sm"></i> Instalar Módulo y Comenzar`;
            return;
        }

        if (!equiposLicencia.includes(hwID)) {
            equiposLicencia.push(hwID);
            await supabaseMaster
                .from('licencias')
                .update({ equipos: equiposLicencia })
                .eq('id', activationId);
        }

        // Guardar la sesión automáticamente sin pedir credenciales ni claves
        localStorage.setItem('control_voley_supa_url', empresaData.supabase_url || data.supabaseUrl);
        localStorage.setItem('control_voley_supa_key', empresaData.supabase_key || data.supabaseKey);
        localStorage.setItem('control_voley_supa_bucket', empresaData.bucket || data.bucket || activationId);

        if (empresaData.nombre || data.clubNombre) {
            localStorage.setItem('control_voley_club_nombre', empresaData.nombre || data.clubNombre);
        }

        localStorage.setItem('youcontrol_empresa_id', activationId);
        localStorage.setItem('licencia_validada', 'true');

        // Acceso directo o prompt de instalación
        if (window.deferredPrompt) {
            statusDiv.className = "text-xs font-bold text-amber-600";
            statusDiv.innerText = "Confirmando instalación de la App...";

            window.deferredPrompt.prompt();
            const userChoice = await window.deferredPrompt.userChoice;
            window.deferredPrompt = null;

            if (userChoice.outcome === 'accepted') {
                statusDiv.className = "text-xs font-bold text-emerald-600";
                statusDiv.innerText = "¡App instalada! Entrando...";
                setTimeout(() => window.location.replace('index_stats.html'), 300);
            } else {
                alert("Debes confirmar la instalación para continuar.");
                btn.disabled = false;
                btn.innerHTML = `<i class="fas fa-download text-sm"></i> Instalar Módulo y Comenzar`;
            }
        } else {
            statusDiv.className = "text-xs font-bold text-emerald-600";
            statusDiv.innerText = "Licencia válida. Entrando...";
            setTimeout(() => window.location.replace('index_stats.html'), 300);
        }
        
    } catch (e) {
        console.error("Error al procesar activación:", e);
        alert("Código de licencia inválido: " + e.message);
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-download text-sm"></i> Instalar Módulo y Comenzar`;
    }
}

const btnActivar = document.getElementById('btnActivarEInstalar');
if (btnActivar) {
    btnActivar.addEventListener('click', procesarActivacionEInstalacion);
}
