import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const MASTER_SUPA_URL = "https://ajdimbptzoeqzrrioywt.supabase.co";
const MASTER_SUPA_KEY = "sb_publishable_aVydbrj88elb7XVq1yopFw_2U4MHgHv";

const supabaseMaster = createClient(MASTER_SUPA_URL, MASTER_SUPA_KEY);
const getHardwareID = () => btoa(navigator.userAgent + navigator.language);

// 1. Pegado automático
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
                    statusDiv.innerText = "¡Código de licencia incorporado con éxito!";
                }
            } else {
                alert("Tu navegador no permite lectura automática. Mantén presionado el cuadro de texto.");
            }
        } catch (err) {
            alert("No se pudo acceder al portapapeles. Mantén presionado el recuadro para pegar tu código.");
        }
    });
}

// 2. Proceso de activación e Instalación forzada
async function procesarActivacionEInstalacion() {
    const rawToken = document.getElementById('tokenInput').value.trim();
    const statusDiv = document.getElementById('statusMsg');
    if (!rawToken) return alert("Por favor, ingresa o pega el código de licencia primero.");
    
    const btn = document.getElementById('btnActivarEInstalar');
    btn.disabled = true;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Validando licencia...`;

    // SI EXISTE EL PROMPT DE INSTALACIÓN, LO LANZAMOS DE INMEDIATO EN EL CLIC DEL USUARIO
    let pwaInstaladaEnEsteClic = false;
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        const choiceResult = await window.deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
            pwaInstaladaEnEsteClic = true;
        } else {
            alert("Debes aceptar la instalación de la aplicación para poder ingresar al sistema.");
            btn.disabled = false;
            btn.innerHTML = `<i class="fas fa-download text-sm"></i> Instalar Módulo y Comenzar`;
            return;
        }
        window.deferredPrompt = null;
    }

    try {
        const data = JSON.parse(atob(rawToken));
        const hwID = getHardwareID();
        const activationId = data.clubId || data.activation_id;

        if (!activationId) {
            throw new Error("El formato del código de licencia no es válido.");
        }

        const { data: empresaData, error: empresaError } = await supabaseMaster
            .from('licencias')
            .select('*')
            .eq('id', activationId)
            .single();

        if (empresaError || !empresaData) {
            throw new Error("La licencia ingresada no se encuentra registrada o está inactiva.");
        }

        let equiposLicencia = Array.isArray(empresaData.equipos) ? empresaData.equipos : [];
        let limiteStr = empresaData.limite_dispositivos || data.limite || "3";
        let limiteLicencia = (limiteStr === "Ilimitado") ? 999 : (parseInt(limiteStr) || 3);

        if (!equiposLicencia.includes(hwID) && equiposLicencia.length >= limiteLicencia) {
            alert("Error: Se ha alcanzado el límite máximo de dispositivos autorizados para esta licencia.");
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

        localStorage.setItem('control_voley_supa_url', empresaData.supabase_url || data.supabaseUrl);
        localStorage.setItem('control_voley_supa_key', empresaData.supabase_key || data.supabaseKey);
        localStorage.setItem('control_voley_supa_bucket', empresaData.bucket || data.bucket || activationId);

        if (empresaData.nombre || data.clubNombre) {
            localStorage.setItem('control_voley_club_nombre', empresaData.nombre || data.clubNombre);
        }

        localStorage.setItem('youcontrol_empresa_id', activationId);
        localStorage.setItem('licencia_validada', 'true');

        statusDiv.className = "text-xs font-bold text-emerald-600";
        statusDiv.innerText = "¡Licencia validada y App configurada! Entrando...";
        
        setTimeout(() => {
            window.location.replace('index_stats.html');
        }, 300);

    } catch (e) {
        console.error("Error en el proceso de activación:", e);
        alert("Código de licencia incorrecto o error de red: " + e.message);
        btn.disabled = false;
        btn.innerHTML = `<i class="fas fa-download text-sm"></i> Instalar Módulo y Comenzar`;
        if (statusDiv) statusDiv.innerText = "";
    }
}

const btnActivar = document.getElementById('btnActivarEInstalar');
if (btnActivar) {
    btnActivar.addEventListener('click', procesarActivacionEInstalacion);
}
