// Variables para manejo de videollamada
let localStream;
let callTimerInterval;
let callSeconds = 0;
let isMicOn = true;
let isCameraOn = true;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function() {
    // Asignar eventos a los botones de entrar a consulta
    const entrarButtons = document.querySelectorAll('.btn-video:not(.disabled)');
    entrarButtons.forEach(button => {
        button.addEventListener('click', function() {
            openVideoCall();
        });
        initDoctorButtons();
    
        // Si estamos en la vista de doctor (por ejemplo, si se guardó en el localStorage)
        if (localStorage.getItem('currentView') === 'doctor') {
            toggleUserView(); // Cambiar a vista doctor
        }
    });

    // Evento para botón en el modal
    const modalEntrarButton = document.querySelector('#modal .btn-primary');
    if (modalEntrarButton) {
        modalEntrarButton.addEventListener('click', openVideoCall);
    }

    // Asignar eventos a los controles de la videollamada
    const micButton = document.querySelector('.btn-mic');
    if (micButton) {
        micButton.addEventListener('click', toggleMic);
    }

    const cameraButton = document.querySelector('.btn-camera');
    if (cameraButton) {
        cameraButton.addEventListener('click', toggleCamera);
    }

    const endCallButton = document.querySelector('.btn-end-call');
    if (endCallButton) {
        endCallButton.addEventListener('click', endVideoCall);
    }

    // Asignar evento al botón de envío de mensajes
    const sendButton = document.querySelector('.chat-input button');
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    // Permitir enviar mensaje con Enter
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // Asignar eventos a las pestañas
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.textContent.toLowerCase().trim();
            if (tabName === 'chat') {
                switchTab('chat');
            } else if (tabName === 'prescripción') {
                switchTab('prescription');
            }
        });
    });

    // Asignar eventos para los modales
    setupModalEvents();
});

// Configurar eventos para los modales
function setupModalEvents() {
    // Evento para abrir modal principal
    const citaFichas = document.querySelectorAll('.ficha');
    citaFichas.forEach(ficha => {
        ficha.addEventListener('click', function(e) {
            // Evitar que se abra el modal si se hizo clic en un botón de acción
            if (!e.target.closest('.cita-acciones')) {
                openModal();
            }
        });
    });

    // Botones para cerrar modales
    const closeButtons = document.querySelectorAll('.btn-close, .btn-secondary');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    // Cerrar modal al hacer clic en el overlay
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }

    // Botones para reagendar citas
    const reagendarButtons = document.querySelectorAll('.btn-reagendar');
    reagendarButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Evitar que se abra el modal principal
            openReagendarModal();
        });
    });
}

// Añadir esta función al archivo JavaScript
function openModal() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('consulta-modal'); // Asumiendo que tienes un modal con este ID
    
    if (modalOverlay && modal) {
        modalOverlay.style.display = 'block';
        modal.style.display = 'block';
    } else {
        console.error("Modal o overlay no encontrado");
    }
    
    // Si no existe el modal de consulta, redirigir directamente a videollamada
    if (!modal) {
        openVideoCall();
    }
}

// Asegúrate de tener un modal en tu HTML con ID 'consulta-modal'
// O añade este HTML a tu documento
document.body.insertAdjacentHTML('beforeend', `
    <div id="consulta-modal" class="modal">
        <div class="modal-header">
            <h3>Consulta Virtual</h3>
            <button onclick="closeModal()" class="btn-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <p>¿Deseas entrar a la consulta?</p>
            <div class="modal-actions">
                <button onclick="openVideoCall()" class="btn-primary">
                    <i class="fas fa-video"></i> Entrar a la consulta
                </button>
                <button onclick="closeModal()" class="btn-secondary">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
        </div>
    </div>
`);

// Función para cerrar cualquier modal
function closeModal() {
    // Ocultar todos los modales
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Ocultar overlay
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// Función para abrir modal de reagendar
function openReagendarModal() {
    closeModal(); // Cerrar cualquier otro modal abierto
    
    const reagendarModal = document.getElementById('reagendarModal');
    if (reagendarModal) {
        reagendarModal.style.display = 'block';
        document.getElementById('modal-overlay').style.display = 'block';
        
        // Configurar selección de horarios
        const timeSlots = document.querySelectorAll('.time-slot');
        timeSlots.forEach(slot => {
            slot.addEventListener('click', function() {
                timeSlots.forEach(s => s.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
    }
}

// Función para confirmar reagendamiento
function confirmReagendarCita() {
    const newDate = document.getElementById('newDate')?.value;
    const selectedSlot = document.querySelector('.time-slot.selected');
    
    if (!newDate) {
        alert('Por favor, selecciona una fecha.');
        return;
    }
    
    if (!selectedSlot) {
        alert('Por favor, selecciona una hora disponible.');
        return;
    }
    
    // Mostrar mensaje de éxito
    alert(`Cita reagendada correctamente para el ${newDate} a las ${selectedSlot.textContent}.`);
    closeModal();
}

// Función para cerrar modal de reagendar
function closeReagendarModal() {
    document.getElementById('reagendarModal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}

// Función para abrir videollamada y activar cámara
function openVideoCall() {
    closeModal();
    
    // Mostrar el contenedor de videollamada
    const videocallContainer = document.getElementById('videocallContainer');
    if (videocallContainer) {
        videocallContainer.style.display = 'block';
    }
    
    // Verificar soporte para getUserMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Solicitar permisos de cámara y micrófono
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(function(stream) {
                console.log("Cámara y micrófono activados");
                localStream = stream;
                
                // Mostrar video local
                const selfVideo = document.getElementById('selfVideo');
                if (selfVideo) {
                    selfVideo.srcObject = stream;
                    selfVideo.play().catch(err => {
                        console.error("Error reproduciendo video:", err);
                    });
                }
                
                // Ocultar placeholder y mostrar video
                const selfPlaceholder = document.getElementById('selfPlaceholder');
                if (selfPlaceholder) {
                    selfPlaceholder.classList.add('hidden');
                }
                if (selfVideo) {
                    selfVideo.classList.remove('hidden');
                }
                
                // Iniciar tiempo de llamada
                startCallTimer();
                
                // Añadir mensaje inicial del doctor si no existe
                const chatMessages = document.getElementById('chatMessages');
                if (chatMessages && chatMessages.children.length === 0) {
                    simulateInitialDoctorMessage();
                }
            })
            .catch(function(error) {
                console.error("Error accediendo a la cámara y/o micrófono:", error);
                alert("No se pudo acceder a la cámara y/o micrófono. Por favor, verifica los permisos del navegador.");
                
                // Mostrar placeholders en caso de error
                const selfPlaceholder = document.getElementById('selfPlaceholder');
                const selfVideo = document.getElementById('selfVideo');
                
                if (selfPlaceholder) {
                    selfPlaceholder.classList.remove('hidden');
                }
                if (selfVideo) {
                    selfVideo.classList.add('hidden');
                }
                
                // Iniciar tiempo de llamada de todos modos
                startCallTimer();
                
                // Añadir mensaje inicial del doctor
                simulateInitialDoctorMessage();
            });
    } else {
        console.error("getUserMedia no está soportado en este navegador");
        alert("Tu navegador no soporta acceso a cámara y micrófono. Por favor, usa un navegador más reciente.");
        
        // Mostrar placeholders
        const selfPlaceholder = document.getElementById('selfPlaceholder');
        const selfVideo = document.getElementById('selfVideo');
        
        if (selfPlaceholder) {
            selfPlaceholder.classList.remove('hidden');
        }
        if (selfVideo) {
            selfVideo.classList.add('hidden');
        }
        
        // Iniciar tiempo de llamada de todos modos
        startCallTimer();
        
        // Añadir mensaje inicial del doctor
        simulateInitialDoctorMessage();
    }
}

// Función para terminar la videollamada
function endVideoCall() {
    const videocallContainer = document.getElementById('videocallContainer');
    if (videocallContainer) {
        videocallContainer.style.display = 'none';
    }
    
    stopCallTimer();
    
    // Detener todas las pistas del stream local
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
}

// Funciones para controlar micrófono y cámara
function toggleMic() {
    if (!localStream) return;
    
    const micBtn = document.querySelector('.btn-mic');
    if (!micBtn) return;
    
    localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        isMicOn = track.enabled;
    });
    
    if (isMicOn) {
        micBtn.classList.add('active');
        micBtn.classList.remove('muted');
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    } else {
        micBtn.classList.remove('active');
        micBtn.classList.add('muted');
        micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    }
}

function toggleCamera() {
    if (!localStream) return;
    
    const cameraBtn = document.querySelector('.btn-camera');
    if (!cameraBtn) return;
    
    localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        isCameraOn = track.enabled;
    });
    
    const selfPlaceholder = document.getElementById('selfPlaceholder');
    
    if (isCameraOn) {
        cameraBtn.classList.add('active');
        cameraBtn.classList.remove('off');
        cameraBtn.innerHTML = '<i class="fas fa-video"></i>';
        if (selfPlaceholder) {
            selfPlaceholder.classList.add('hidden');
        }
    } else {
        cameraBtn.classList.remove('active');
        cameraBtn.classList.add('off');
        cameraBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
        if (selfPlaceholder) {
            selfPlaceholder.classList.remove('hidden');
        }
    }
}

// Funciones para controlar el tiempo de llamada
function startCallTimer() {
    callSeconds = 0;
    
    // Limpiar cualquier temporizador existente
    if (callTimerInterval) {
        clearInterval(callTimerInterval);
    }
    
    callTimerInterval = setInterval(updateCallTimer, 1000);
    updateCallTimer(); // Actualizar inmediatamente para mostrar 00:00:00
}

function updateCallTimer() {
    const hours = Math.floor(callSeconds / 3600);
    const minutes = Math.floor((callSeconds % 3600) / 60);
    const seconds = callSeconds % 60;
    
    const timeString = 
        (hours > 0 ? String(hours).padStart(2, '0') + ':' : '') + 
        String(minutes).padStart(2, '0') + ':' + 
        String(seconds).padStart(2, '0');
    
    const timerElement = document.querySelector('.call-timer');
    if (timerElement) {
        timerElement.textContent = timeString;
    }
    
    callSeconds++;
}

function stopCallTimer() {
    if (callTimerInterval) {
        clearInterval(callTimerInterval);
        callTimerInterval = null;
    }
}

// Función para simular el primer mensaje del doctor
function simulateInitialDoctorMessage() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    // Obtener la hora actual
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    // Mensaje inicial
    const initialMessage = "Hola, bienvenido a la consulta. ¿Cómo puedo ayudarte hoy?";
    
    // Crear elemento de mensaje
    const messageElement = document.createElement('div');
    messageElement.className = 'message doctor';
    messageElement.innerHTML = `
        <span class="message-name">Dr. Carlos Martínez</span>
        <div class="message-bubble">${initialMessage}</div>
        <span class="message-time">${timeString}</span>
    `;
    
    // Agregar mensaje al chat
    chatMessages.appendChild(messageElement);
    
    // Scroll al final del chat
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Funciones para el chat
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;
    
    const message = messageInput.value.trim();
    if (message === '') return;
    
    // Obtener la hora actual
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    // Crear elemento de mensaje
    const messageElement = document.createElement('div');
    messageElement.className = 'message patient';
    messageElement.innerHTML = `
        <span class="message-name">Tú</span>
        <div class="message-bubble">${message}</div>
        <span class="message-time">${timeString}</span>
    `;
    
    // Agregar mensaje al chat
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.appendChild(messageElement);
        
        // Limpiar input
        messageInput.value = '';
        
        // Scroll al final del chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simular respuesta del médico después de un breve retraso
        setTimeout(() => {
            simulateDoctorResponse();
        }, 1500);
    }
}

function simulateDoctorResponse() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    // Mensajes posibles del médico
    const doctorResponses = [
        "Entiendo. ¿Podrías darme más detalles sobre tus síntomas?",
        "Gracias por la información. Basado en lo que me comentas, te recomendaré un tratamiento adecuado.",
        "¿Desde cuándo estás experimentando estos síntomas?",
        "¿Has tomado algún medicamento por tu cuenta?",
        "Voy a actualizar tu receta en la sección de prescripción. Por favor, revísala en un momento."
    ];
    
    // Seleccionar respuesta aleatoria
    const randomResponse = doctorResponses[Math.floor(Math.random() * doctorResponses.length)];
    
    // Obtener la hora actual
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    // Crear elemento de mensaje
    const messageElement = document.createElement('div');
    messageElement.className = 'message doctor';
    messageElement.innerHTML = `
        <span class="message-name">Dr. Carlos Martínez</span>
        <div class="message-bubble">${randomResponse}</div>
        <span class="message-time">${timeString}</span>
    `;
    
    // Agregar mensaje al chat
    chatMessages.appendChild(messageElement);
    
    // Scroll al final del chat
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Si es el último mensaje de la lista, actualizar la prescripción
    if (randomResponse.includes("actualizar tu receta")) {
        setTimeout(() => {
            updatePrescription();
        }, 1000);
    }
}

function updatePrescription() {
    // Actualizar la prescripción médica
    const diagnosticoElement = document.getElementById('diagnostico');
    if (diagnosticoElement) {
        diagnosticoElement.textContent = "Gastritis aguda";
    }
    
    // Actualizar medicamentos
    const medicamentosElement = document.getElementById('medicamentos');
    if (medicamentosElement) {
        medicamentosElement.innerHTML = `
            <li>Omeprazol 20mg - 1 cápsula en ayunas por 14 días</li>
            <li>Sucralfato suspensión - 10ml antes de cada comida por 7 días</li>
        `;
    }
    
    // Actualizar recomendaciones
    const recomendacionesElement = document.getElementById('recomendaciones');
    if (recomendacionesElement) {
        recomendacionesElement.innerHTML = `
            <li>Dieta blanda, evitar alimentos ácidos y picantes</li>
            <li>Evitar café, alcohol y tabaco durante el tratamiento</li>
            <li>Control en 15 días</li>
        `;
    }
    
    // Cambiar a la pestaña de prescripción
    switchTab('prescription');
}

// Función para cambiar entre pestañas
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    const targetTab = document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`);
    const targetContent = document.getElementById(`${tabName}Tab`);
    
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    if (targetContent) {
        targetContent.classList.add('active');
    }
}

// Funciones adicionales para mejorar la experiencia de usuario
function aplicarFiltros() {
    const fecha = document.getElementById('filterDate')?.value;
    const especialidad = document.getElementById('filterEspecialidad')?.value;
    
    console.log('Aplicando filtros - Fecha:', fecha, 'Especialidad:', especialidad);
    // En una implementación real, aquí se filtrarían las citas
    
    alert('Filtros aplicados correctamente');
}

// Evento para cerrar notificaciones y menús al hacer clic fuera
document.addEventListener('click', function(event) {
    // Cerrar panel de notificaciones
    const notificationsPanel = document.getElementById('notificationsPanel');
    const notificationsButton = document.querySelector('.notifications');
    
    if (notificationsPanel && notificationsPanel.style.display === 'block' &&
        notificationsButton && !notificationsButton.contains(event.target) &&
        !notificationsPanel.contains(event.target)) {
        notificationsPanel.style.display = 'none';
    }
    
    // Cerrar menú de perfil
    const profileMenu = document.getElementById('profileMenu');
    const profileButton = document.querySelector('.profile');
    
    if (profileMenu && profileMenu.style.display === 'block' &&
        profileButton && !profileButton.contains(event.target) &&
        !profileMenu.contains(event.target)) {
        profileMenu.style.display = 'none';
    }
});

// Funciones para notificaciones y perfil
function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    if (panel) {
        panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        
        // Cerrar menú de perfil si está abierto
        const profileMenu = document.getElementById('profileMenu');
        if (profileMenu) {
            profileMenu.style.display = 'none';
        }
    }
}

function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (menu) {
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        
        // Cerrar panel de notificaciones si está abierto
        const notificationsPanel = document.getElementById('notificationsPanel');
        if (notificationsPanel) {
            notificationsPanel.style.display = 'none';
        }
    }
}

// Función para mostrar formulario de login
function showLoginForm() {
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) {
        loginOverlay.style.display = 'flex';
    }
}

// Función para iniciar sesión
function login() {
    const cedula = document.getElementById('cedula')?.value;
    const email = document.getElementById('email')?.value;
    const password = document.getElementById('password')?.value;
    
    if (!cedula || !email || !password) {
        alert('Por favor, completa todos los campos.');
        return;
    }
    
    console.log('Autenticando usuario:', cedula, email);
    
    // En una implementación real, aquí se enviarían los datos al servidor
    // Por ahora, simplemente cerramos el formulario
    const loginOverlay = document.getElementById('loginOverlay');
    if (loginOverlay) {
        loginOverlay.style.display = 'none';
    }
}

// Función para alternar visibilidad de FAQ
function toggleFaq(element) {
    if (!element) return;
    
    const answer = element.nextElementSibling;
    const icon = element.querySelector('i');
    
    if (answer && icon) {
        answer.style.display = answer.style.display === 'block' ? 'none' : 'block';
        icon.className = answer.style.display === 'block' ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    }
}
// Funciones para cambiar entre secciones
function showCitas() {
    document.getElementById('citasList').style.display = 'block';
    document.getElementById('filterSection').style.display = 'block';
    document.getElementById('tratamientosSection').style.display = 'none';
    document.getElementById('helpSection').style.display = 'none';
    
    // Actualizar el menú activo
    document.querySelectorAll('.menu a').forEach(link => link.classList.remove('active'));
    document.querySelector('.menu a[onclick="showCitas()"]').classList.add('active');
}

function showTratamientos() {
    document.getElementById('citasList').style.display = 'none';
    document.getElementById('filterSection').style.display = 'none';
    document.getElementById('tratamientosSection').style.display = 'block';
    document.getElementById('helpSection').style.display = 'none';
    
    // Actualizar el menú activo
    document.querySelectorAll('.menu a').forEach(link => link.classList.remove('active'));
    document.querySelector('.menu a[onclick="showTratamientos()"]').classList.add('active');
    
    // Cargar los tratamientos (en una implementación real se cargarían desde el servidor)
    loadTratamientos();
}

function showHelp() {
    document.getElementById('citasList').style.display = 'none';
    document.getElementById('filterSection').style.display = 'none';
    document.getElementById('tratamientosSection').style.display = 'none';
    document.getElementById('helpSection').style.display = 'block';
    
    // Actualizar el menú activo
    document.querySelectorAll('.menu a').forEach(link => link.classList.remove('active'));
    document.querySelector('.menu a[onclick="showHelp()"]').classList.add('active');
}

// Función para cargar datos de tratamientos
function loadTratamientos() {
    const tratamientosList = document.querySelector('.tratamientos-list');
    if (!tratamientosList) return;
    
    // Limpiar lista existente
    tratamientosList.innerHTML = '';
    
    // Datos de ejemplo de tratamientos
    const tratamientos = [
        {
            fecha: '05/04/2025',
            especialidad: 'Medicina General',
            diagnostico: 'Gastritis aguda',
            prescripcion: 'Omeprazol 20mg, Sucralfato suspensión',
            indicaciones: 'Omeprazol: 1 cápsula en ayunas por 14 días. Sucralfato: 10ml antes de cada comida por 7 días.'
        },
        {
            fecha: '20/03/2025',
            especialidad: 'Cardiología',
            diagnostico: 'Hipertensión arterial leve',
            prescripcion: 'Losartán 50mg',
            indicaciones: 'Tomar 1 tableta cada 24 horas. Controlar presión arterial diariamente.'
        },
        {
            fecha: '10/02/2025',
            especialidad: 'Medicina General',
            diagnostico: 'Faringitis aguda',
            prescripcion: 'Amoxicilina 500mg, Ibuprofeno 400mg',
            indicaciones: 'Amoxicilina: 1 cápsula cada 8 horas por 7 días. Ibuprofeno: 1 tableta cada 8 horas si hay dolor.'
        }
    ];
    
    // Crear tarjetas de tratamientos
    tratamientos.forEach(tratamiento => {
        const card = document.createElement('div');
        card.className = 'tratamiento-card';
        card.innerHTML = `
            <div class="tratamiento-header">
                <h3>Consulta: ${tratamiento.fecha}</h3>
                <span class="especialidad">${tratamiento.especialidad}</span>
            </div>
            <div class="tratamiento-body">
                <p><strong>Diagnóstico:</strong> ${tratamiento.diagnostico}</p>
                <p><strong>Prescripción:</strong> ${tratamiento.prescripcion}</p>
                <p><strong>Indicaciones:</strong> ${tratamiento.indicaciones}</p>
            </div>
            <div class="tratamiento-footer">
                <button class="btn-download">
                    <i class="fas fa-download"></i> Descargar
                </button>
                <button class="btn-print">
                    <i class="fas fa-print"></i> Imprimir
                </button>
            </div>
        `;
        tratamientosList.appendChild(card);
    });
    
    // Configurar eventos para los botones de descarga e impresión
    setupTratamientosButtons();
}

// Configurar eventos para botones de tratamientos
function setupTratamientosButtons() {
    // Botones de descarga
    const downloadButtons = document.querySelectorAll('.btn-download');
    downloadButtons.forEach(button => {
        button.addEventListener('click', function() {
            alert('Descargando receta médica en formato PDF...');
            // En una implementación real, aquí se generaría y descargaría el PDF
        });
    });
    
    // Botones de impresión
    const printButtons = document.querySelectorAll('.btn-print');
    printButtons.forEach(button => {
        button.addEventListener('click', function() {
            alert('Enviando receta a impresión...');
            // En una implementación real, aquí se abriría el diálogo de impresión
        });
    });
    
    // Filtros de tratamientos
    const filterButton = document.querySelector('#tratamientosSection .btn-filtrar');
    if (filterButton) {
        filterButton.addEventListener('click', function() {
            const fecha = document.getElementById('filterTreatmentDate')?.value;
            const especialidad = document.getElementById('filterTreatmentType')?.value;
            
            alert(`Filtrando tratamientos por: Fecha: ${fecha || 'Todas'}, Especialidad: ${especialidad === 'all' ? 'Todas' : especialidad}`);
            // En una implementación real, aquí se filtrarían los tratamientos
        });
    }
}

// Mejorar sección de Ayuda con más preguntas frecuentes
function enhanceHelpSection() {
    const faqSection = document.querySelector('.faq-section');
    if (!faqSection) return;
    
    // Añadir más preguntas frecuentes
    const additionalFaqs = [
        {
            pregunta: '¿Cómo funciona una consulta virtual?',
            respuesta: 'La consulta virtual se realiza a través de videollamada dentro de la plataforma. Al llegar la hora de tu cita, haz clic en el botón "Entrar" de la cita correspondiente. Se abrirá una ventana de videollamada donde podrás interactuar con el médico en tiempo real. Durante la consulta también tendrás acceso a un chat y podrás ver la prescripción que el médico te indique.'
        },
        {
            pregunta: '¿Cómo puedo ver mis tratamientos anteriores?',
            respuesta: 'Para acceder a tus tratamientos anteriores, selecciona la opción "Tratamientos" en el menú principal. Ahí encontrarás un historial de todas tus consultas médicas con las prescripciones correspondientes. Puedes filtrar por fecha o especialidad para encontrar una consulta específica, y también tienes la opción de descargar o imprimir las recetas.'
        },
        {
            pregunta: '¿Qué hago si tengo problemas técnicos durante la consulta?',
            respuesta: 'Si experimentas problemas técnicos durante una consulta virtual, intenta lo siguiente: 1) Verifica tu conexión a internet. 2) Actualiza la página. 3) Asegúrate de haber permitido el acceso a tu cámara y micrófono. 4) Si el problema persiste, utiliza el chat integrado para comunicarte con el médico. Si no puedes resolver el problema, contacta a soporte técnico a través de la sección de Ayuda.'
        },
        {
            pregunta: '¿Cómo obtengo medicamentos recetados durante una consulta virtual?',
            respuesta: 'Las prescripciones médicas quedarán registradas en la sección "Tratamientos" después de finalizada la consulta. Puedes descargar o imprimir la receta y presentarla en cualquier farmacia autorizada. En algunos casos, dependiendo de tu plan de salud, puedes solicitar el envío a domicilio a través de la red de farmacias asociadas.'
        }
    ];
    
    // Añadir las nuevas preguntas al DOM
    additionalFaqs.forEach(faq => {
        const faqItem = document.createElement('div');
        faqItem.className = 'faq-item';
        faqItem.innerHTML = `
            <div class="faq-question" onclick="toggleFaq(this)">
                ${faq.pregunta}
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="faq-answer">
                ${faq.respuesta}
            </div>
        `;
        faqSection.appendChild(faqItem);
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Configuración inicial - mostrar sección de citas por defecto
    showCitas();
    
    // Mejorar la sección de ayuda
    enhanceHelpSection();
    
    // Los demás eventos ya están siendo configurados en la función setupModalEvents()
});

// Variables globales
let currentView = 'patient'; // 'patient' o 'doctor'
let doctorLocalStream;
let doctorCallTimerInterval;
let doctorCallSeconds = 0;
let isDoctorMicOn = true;
let isDoctorCameraOn = true;

function toggleUserView() {
    if (currentView === 'patient') {
        // Cambiar a vista de doctor
        document.body.style.background = '#f0f4f8';
        
        // Ocultar TODOS los elementos de la vista de paciente
        const pacienteHeader = document.querySelector('body > header');
        if (pacienteHeader) {
            pacienteHeader.style.display = 'none';
        }
        
        document.getElementById('citasList').style.display = 'none';
        document.getElementById('filterSection').style.display = 'none';
        document.getElementById('tratamientosSection').style.display = 'none';
        document.getElementById('helpSection').style.display = 'none';
        document.getElementById('videocallContainer').style.display = 'none';
        document.querySelector('.menu').style.display = 'none';
        
        // Mostrar la vista del doctor
        document.getElementById('doctorView').style.display = 'block';
        
        // Inicializar botones de la vista del doctor
        setTimeout(initDoctorButtons, 300);
        
        // Actualizar el botón
        document.getElementById('toggleViewBtn').innerHTML = '<i class="fas fa-sync-alt"></i> Cambiar a Vista Paciente';
        
        currentView = 'doctor';
        localStorage.setItem('currentView', 'doctor');
    } else {
        // Cambiar a vista de paciente
        document.body.style.background = '#f5f7fa';
        
        // Mostrar elementos de la vista de paciente
        const pacienteHeader = document.querySelector('body > header');
        if (pacienteHeader) {
            pacienteHeader.style.display = 'flex'; // O 'block' según sea el display original
        }
        document.querySelector('.menu').style.display = 'flex'; // Mostrar menú de paciente
        
        // Ocultar vista del doctor
        document.getElementById('doctorView').style.display = 'none';
        
        // Mostrar sección de citas
        showCitas();
        
        // Actualizar el botón
        document.getElementById('toggleViewBtn').innerHTML = '<i class="fas fa-sync-alt"></i> Cambiar a Vista Doctor';
        
        currentView = 'patient';
        localStorage.setItem('currentView', 'patient');
    }
}

// Funciones para las secciones del doctor
function showDoctorCitas() {
    document.getElementById('doctorConsultasList').style.display = 'block';
    document.getElementById('doctorFilterSection').style.display = 'block';
    
    // Actualizar el menú activo
    document.querySelectorAll('.doctor-menu a').forEach(link => link.classList.remove('active'));
    document.querySelector('.doctor-menu a[onclick="showDoctorCitas()"]').classList.add('active');
}

function showDoctorPacientes() {
    document.getElementById('doctorConsultasList').style.display = 'none';
    document.getElementById('doctorFilterSection').style.display = 'none';
    
    // Actualizar el menú activo
    document.querySelectorAll('.doctor-menu a').forEach(link => link.classList.remove('active'));
    document.querySelector('.doctor-menu a[onclick="showDoctorPacientes()"]').classList.add('active');
    
    // Aquí se mostraría la lista de pacientes (no implementado en este ejemplo)
    alert('Vista de Pacientes - Funcionalidad no implementada en este demo');
}

function showDoctorHistorial() {
    document.getElementById('doctorConsultasList').style.display = 'none';
    document.getElementById('doctorFilterSection').style.display = 'none';
    
    // Actualizar el menú activo
    document.querySelectorAll('.doctor-menu a').forEach(link => link.classList.remove('active'));
    document.querySelector('.doctor-menu a[onclick="showDoctorHistorial()"]').classList.add('active');
    
    // Aquí se mostraría el historial completo (no implementado en este ejemplo)
    alert('Vista de Historial Médico - Funcionalidad no implementada en este demo');
}

// Función para iniciar videollamada desde la vista del doctor
function openDoctorVideoCall(patientId) {
    console.log("Abriendo videollamada del doctor con paciente ID:", patientId);
    
    // Asegurarse de que el contenedor existe
    const doctorVideocallContainer = document.getElementById('doctorVideocallContainer');
    if (!doctorVideocallContainer) {
        console.error("No se encontró el contenedor de videollamada del doctor");
        return;
    }
    
    // Mostrar el contenedor
    doctorVideocallContainer.style.display = 'block';
    
    // Ocultar secciones del doctor
    const doctorConsultasList = document.getElementById('doctorConsultasList');
    const doctorFilterSection = document.getElementById('doctorFilterSection');
    
    if (doctorConsultasList) doctorConsultasList.style.display = 'none';
    if (doctorFilterSection) doctorFilterSection.style.display = 'none';
    
    // Solicitar acceso a cámara y micrófono
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(function(stream) {
                doctorLocalStream = stream;
                
                // Mostrar video del doctor
                const doctorVideo = document.getElementById('doctorSelfVideo');
                if (doctorVideo) {
                    doctorVideo.srcObject = stream;
                    doctorVideo.play().catch(err => console.error("Error reproduciendo video:", err));
                }
                
                // Ocultar placeholder
                document.getElementById('doctorSelfPlaceholder').classList.add('hidden');
                
                // Iniciar tiempo de llamada
                startDoctorCallTimer();
            })
            .catch(function(error) {
                console.error("Error accediendo a la cámara del doctor:", error);
                alert("No se pudo acceder a la cámara. Verifique los permisos del navegador.");
                
                // Mostrar placeholder en caso de error
                document.getElementById('doctorSelfPlaceholder').classList.remove('hidden');
                
                // Iniciar tiempo de llamada de todos modos
                startDoctorCallTimer();
            });
    } else {
        alert("Su navegador no soporta acceso a cámara y micrófono.");
        document.getElementById('doctorSelfPlaceholder').classList.remove('hidden');
        startDoctorCallTimer();
    }
}

// Función para finalizar videollamada del doctor
function endDoctorVideoCall() {
    document.getElementById('doctorVideocallContainer').style.display = 'none';
    
    // Mostrar de nuevo la lista de consultas
    document.getElementById('doctorConsultasList').style.display = 'block';
    document.getElementById('doctorFilterSection').style.display = 'block';
    
    // Detener el temporizador
    stopDoctorCallTimer();
    
    // Detener todas las pistas de video/audio
    if (doctorLocalStream) {
        doctorLocalStream.getTracks().forEach(track => track.stop());
        doctorLocalStream = null;
    }
}

// Funciones para controlar micrófono y cámara del doctor
function toggleDoctorMic() {
    if (!doctorLocalStream) return;
    
    const micBtn = document.querySelector('#doctorVideocallContainer .btn-mic');
    
    doctorLocalStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
        isDoctorMicOn = track.enabled;
    });
    
    if (isDoctorMicOn) {
        micBtn.classList.add('active');
        micBtn.classList.remove('muted');
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    } else {
        micBtn.classList.remove('active');
        micBtn.classList.add('muted');
        micBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    }
}

function toggleDoctorCamera() {
    if (!doctorLocalStream) return;
    
    const cameraBtn = document.querySelector('#doctorVideocallContainer .btn-camera');
    
    doctorLocalStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        isDoctorCameraOn = track.enabled;
    });
    
    if (isDoctorCameraOn) {
        cameraBtn.classList.add('active');
        cameraBtn.classList.remove('off');
        cameraBtn.innerHTML = '<i class="fas fa-video"></i>';
        document.getElementById('doctorSelfPlaceholder').classList.add('hidden');
    } else {
        cameraBtn.classList.remove('active');
        cameraBtn.classList.add('off');
        cameraBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
        document.getElementById('doctorSelfPlaceholder').classList.remove('hidden');
    }
}

// Funciones para el tiempo de llamada
function startDoctorCallTimer() {
    doctorCallSeconds = 0;
    
    if (doctorCallTimerInterval) {
        clearInterval(doctorCallTimerInterval);
    }
    
    doctorCallTimerInterval = setInterval(updateDoctorCallTimer, 1000);
    updateDoctorCallTimer();
}

function updateDoctorCallTimer() {
    const hours = Math.floor(doctorCallSeconds / 3600);
    const minutes = Math.floor((doctorCallSeconds % 3600) / 60);
    const seconds = doctorCallSeconds % 60;
    
    const timeString = 
        (hours > 0 ? String(hours).padStart(2, '0') + ':' : '') + 
        String(minutes).padStart(2, '0') + ':' + 
        String(seconds).padStart(2, '0');
    
    const timerElement = document.querySelector('#doctorVideocallContainer .call-timer');
    if (timerElement) {
        timerElement.textContent = timeString;
    }
    
    doctorCallSeconds++;
}

function stopDoctorCallTimer() {
    if (doctorCallTimerInterval) {
        clearInterval(doctorCallTimerInterval);
        doctorCallTimerInterval = null;
    }
}

// Función para cambiar entre pestañas en la videollamada del doctor
function switchDoctorTab(tabName) {
    const tabs = document.querySelectorAll('#doctorVideocallContainer .tab');
    const tabContents = document.querySelectorAll('#doctorVideocallContainer .tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    document.querySelector(`#doctorVideocallContainer .tab:nth-child(${tabName === 'chat' ? 1 : tabName === 'prescription' ? 2 : 3})`).classList.add('active');
    document.getElementById(`doctor${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.add('active');
}

// Función para enviar mensaje como doctor
function sendDoctorMessage() {
    const messageInput = document.getElementById('doctorMessageInput');
    if (!messageInput) return;
    
    const message = messageInput.value.trim();
    if (message === '') return;
    
    // Obtener la hora actual
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    // Crear elemento de mensaje
    const messageElement = document.createElement('div');
    messageElement.className = 'message doctor';
    messageElement.innerHTML = `
        <span class="message-name">Dr. Carlos Martínez (Tú)</span>
        <div class="message-bubble">${message}</div>
        <span class="message-time">${timeString}</span>
    `;
    
    // Agregar mensaje al chat
    const chatMessages = document.getElementById('doctorChatMessages');
    if (chatMessages) {
        chatMessages.appendChild(messageElement);
        
        // Limpiar input
        messageInput.value = '';
        
        // Scroll al final del chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Simular respuesta del paciente después de un breve retraso
        setTimeout(() => {
            simulatePatientResponse();
        }, 2000);
    }
}

// Función para simular respuesta del paciente
function simulatePatientResponse() {
    const patientResponses = [
        "Entiendo doctor, seguiré sus indicaciones.",
        "¿Es necesario hacer algún tipo de estudio adicional?",
        "¿Cuándo debería ver mejoría con este tratamiento?",
        "Gracias por la explicación, doctor.",
        "¿Hay alguna restricción de alimentos que deba seguir?"
    ];
    
    const randomResponse = patientResponses[Math.floor(Math.random() * patientResponses.length)];
    
    // Obtener la hora actual
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    // Crear elemento de mensaje
    const messageElement = document.createElement('div');
    messageElement.className = 'message patient';
    messageElement.innerHTML = `
        <span class="message-name">Juan Pérez</span>
        <div class="message-bubble">${randomResponse}</div>
        <span class="message-time">${timeString}</span>
    `;
    
    // Agregar mensaje al chat
    const chatMessages = document.getElementById('doctorChatMessages');
    if (chatMessages) {
        chatMessages.appendChild(messageElement);
        
        // Scroll al final del chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Función para añadir campo de medicamento
function addMedicationField() {
    const medicationList = document.getElementById('medicationList');
    if (!medicationList) return;
    
    const medicationItem = document.createElement('div');
    medicationItem.className = 'medication-item';
    medicationItem.innerHTML = `
        <input type="text" placeholder="Nombre y dosis" class="medication-name">
        <input type="text" placeholder="Indicaciones" class="medication-instructions">
        <button class="remove-medication" onclick="removeMedicationField(this)"><i class="fas fa-times"></i></button>
    `;
    
    medicationList.appendChild(medicationItem);
}

// Función para eliminar campo de medicamento
function removeMedicationField(button) {
    const medicationItem = button.closest('.medication-item');
    if (medicationItem) {
        medicationItem.remove();
    }
}

// Función para guardar la prescripción
function savePrescription() {
    const diagnosis = document.getElementById('diagnosisInput').value.trim();
    const recommendations = document.getElementById('recommendationsInput').value.trim();
    const followUpDate = document.getElementById('followUpDate').value;
    
    if (!diagnosis) {
        alert('Por favor, ingrese un diagnóstico');
        return;
    }
    
    // Recopilar medicamentos
    const medications = [];
    const medicationItems = document.querySelectorAll('.medication-item');
    
    medicationItems.forEach(item => {
        const name = item.querySelector('.medication-name').value.trim();
        const instructions = item.querySelector('.medication-instructions').value.trim();
        
        if (name) {
            medications.push({ name, instructions });
        }
    });
    
    if (medications.length === 0) {
        alert('Por favor, añada al menos un medicamento');
        return;
    }
    
    // En una aplicación real, aquí se enviaría la prescripción al servidor
    console.log('Prescripción guardada:', { diagnosis, medications, recommendations, followUpDate });
    
    // Simulación de guardado exitoso
    alert('Prescripción guardada y enviada al paciente correctamente');
    
    // Actualizar la prescripción visible para el paciente
    updatePatientPrescription(diagnosis, medications, recommendations);
    
    // Cambiar a la pestaña de chat
    switchDoctorTab('chat');
    
    // Enviar mensaje automático al paciente
    const messageElement = document.createElement('div');
    messageElement.className = 'message doctor';
    messageElement.innerHTML = `
        <span class="message-name">Dr. Carlos Martínez (Tú)</span>
        <div class="message-bubble">He actualizado tu receta médica. Puedes verla en la sección de prescripción.</div>
        <span class="message-time">${new Date().getHours()}:${String(new Date().getMinutes()).padStart(2, '0')}</span>
    `;
    
    const chatMessages = document.getElementById('doctorChatMessages');
    if (chatMessages) {
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Función para actualizar la prescripción visible para el paciente
function updatePatientPrescription(diagnosis, medications, recommendations) {
    // Esta función simula la actualización de la prescripción que vería el paciente
    const diagnosticoElement = document.getElementById('diagnostico');
    if (diagnosticoElement) {
        diagnosticoElement.textContent = diagnosis;
    }
    
    const medicamentosElement = document.getElementById('medicamentos');
    if (medicamentosElement) {
        let medicationsHtml = '';
        medications.forEach(med => {
            medicationsHtml += `<li>${med.name} - ${med.instructions}</li>`;
        });
        medicamentosElement.innerHTML = medicationsHtml;
    }
    
    const recomendacionesElement = document.getElementById('recomendaciones');
    if (recomendacionesElement) {
        const recsArray = recommendations.split('\n').filter(rec => rec.trim() !== '');
        let recsHtml = '';
        
        if (recsArray.length > 0) {
            recsArray.forEach(rec => {
                recsHtml += `<li>${rec}</li>`;
            });
        } else {
            recsHtml = '<li>Sin recomendaciones específicas</li>';
        }
        
        recomendacionesElement.innerHTML = recsHtml;
    }
}

// Función para mostrar historial del paciente
function showPatientHistory(patientId) {
    alert(`Mostrando historial del paciente ID: ${patientId}`);
    // En una implementación real, aquí se cargaría el historial del paciente específico
}

// Aplicar filtros para la vista del doctor
function aplicarFiltrosDoctor() {
    const fecha = document.getElementById('doctorFilterDate')?.value;
    const estado = document.getElementById('doctorFilterStatus')?.value;
    
    alert(`Filtrando consultas para doctor por: Fecha: ${fecha || 'Todas'}, Estado: ${estado === 'all' ? 'Todos' : estado}`);
    // En una implementación real, aquí se filtrarían las consultas
}

// Añadir esta función a las inicializaciones del DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializaciones existentes...
    
    // Inicializar la vista del doctor
    const doctorMessageInput = document.getElementById('doctorMessageInput');
    if (doctorMessageInput) {
        doctorMessageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendDoctorMessage();
            }
        });
    }
});

// Función para asegurar que los campos de prescripción sean interactivos
function enablePrescriptionFields() {
    // Asegurar que los campos de entrada sean editables
    const diagnosisInput = document.getElementById('diagnosisInput');
    const recommendationsInput = document.getElementById('recommendationsInput');
    const followUpDate = document.getElementById('followUpDate');
    
    if (diagnosisInput) {
        diagnosisInput.removeAttribute('readonly');
        diagnosisInput.addEventListener('click', function(e) {
            e.stopPropagation(); // Evitar que el clic se propague
        });
    }
    
    if (recommendationsInput) {
        recommendationsInput.removeAttribute('readonly');
        recommendationsInput.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    if (followUpDate) {
        followUpDate.removeAttribute('readonly');
        followUpDate.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
    
    // También habilitar los campos de medicamentos existentes
    const medicationInputs = document.querySelectorAll('.medication-name, .medication-instructions');
    medicationInputs.forEach(input => {
        input.removeAttribute('readonly');
        input.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
}

// Mejorar la función switchDoctorTab para asegurar interactividad
function switchDoctorTab(tabName) {
    const tabs = document.querySelectorAll('#doctorVideocallContainer .tab');
    const tabContents = document.querySelectorAll('#doctorVideocallContainer .tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    document.querySelector(`#doctorVideocallContainer .tab:nth-child(${tabName === 'chat' ? 1 : tabName === 'prescription' ? 2 : 3})`).classList.add('active');
    document.getElementById(`doctor${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.add('active');
    
    // Si estamos cambiando a la pestaña de prescripción, asegurar que los campos sean interactivos
    if (tabName === 'prescription') {
        setTimeout(enablePrescriptionFields, 100); // Pequeño retraso para asegurar que el DOM esté listo
    }
}

// También modificar la función openDoctorVideoCall para incluir inicialización de campos
function openDoctorVideoCall(patientId) {
    // Código existente...
    
    // Asegurar que los campos de prescripción sean interactivos después de cargar
    setTimeout(enablePrescriptionFields, 500);
    
    // El resto del código existente...
}

// Añade al inicio del documento, después de cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicialización existente...
    
    // Inicializar vista de prescripción
    const prescriptionTab = document.querySelector('#doctorVideocallContainer .tab:nth-child(2)');
    if (prescriptionTab) {
        prescriptionTab.addEventListener('click', function() {
            switchDoctorTab('prescription');
        });
    }
    
    // Inicializar los campos existentes
    enablePrescriptionFields();
    
    // Asegurar que el botón para añadir medicamentos funcione
    const addMedicationBtn = document.querySelector('.add-medication');
    if (addMedicationBtn) {
        addMedicationBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addMedicationField();
            // Re-habilitar los campos después de añadir uno nuevo
            setTimeout(enablePrescriptionFields, 100);
        });
    }
    
    // Asegurar que el botón de guardar funcione
    const saveBtn = document.querySelector('.btn-save-prescription');
    if (saveBtn) {
        saveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            savePrescription();
        });
    }
});

// Función para inicializar botones de iniciar videollamada del doctor
function initDoctorButtons() {
    console.log("Inicializando botones del doctor");
    const iniciarButtons = document.querySelectorAll('.btn-iniciar');
    console.log("Botones encontrados:", iniciarButtons.length);
    
    iniciarButtons.forEach(button => {
        // Eliminar cualquier oyente anterior para evitar duplicados
        button.removeAttribute("onclick");
        
        button.addEventListener('click', function() {
            const patientId = this.getAttribute('data-patient-id') || 1;
            console.log("Iniciando videollamada con paciente ID:", patientId);
            openDoctorVideoCall(patientId);
        });
    });
}