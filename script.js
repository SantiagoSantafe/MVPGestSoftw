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

// Función para abrir el modal principal
function openModal() {
    document.getElementById('modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
}

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