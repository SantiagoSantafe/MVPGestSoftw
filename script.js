// Variables para manejo de videollamada
let localStream;
let callTimerInterval;
let callSeconds = 0;
let isMicOn = true;
let isCameraOn = true;

// Función para abrir videollamada y activar cámara
function openVideoCall() {
    closeModal();
    document.getElementById('videocallContainer').style.display = 'block';
    
    // Solicitar permisos de cámara y micrófono
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(function(stream) {
            localStream = stream;
            
            // Mostrar video local
            const selfVideo = document.getElementById('selfVideo');
            selfVideo.srcObject = stream;
            
            // Ocultar placeholder y mostrar video
            document.getElementById('selfPlaceholder').classList.add('hidden');
            selfVideo.classList.remove('hidden');
            
            // Iniciar tiempo de llamada
            startCallTimer();
        })
        .catch(function(error) {
            console.error("Error accediendo a la cámara y/o micrófono:", error);
            alert("No se pudo acceder a la cámara y/o micrófono. Por favor, verifica los permisos del navegador.");
            
            // Mostrar placeholders en caso de error
            document.getElementById('selfPlaceholder').classList.remove('hidden');
            document.getElementById('selfVideo').classList.add('hidden');
        });
}

// Función para terminar la videollamada
function endVideoCall() {
    document.getElementById('videocallContainer').style.display = 'none';
    stopCallTimer();
    
    // Detener todas las pistas del stream local
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
}

// Funciones para controlar micrófono y cámara
function toggleMic() {
    if (!localStream) return;
    
    const micBtn = document.querySelector('.btn-mic');
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
    localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
        isCameraOn = track.enabled;
    });
    
    if (isCameraOn) {
        cameraBtn.classList.add('active');
        cameraBtn.classList.remove('off');
        cameraBtn.innerHTML = '<i class="fas fa-video"></i>';
        document.getElementById('selfPlaceholder').classList.add('hidden');
    } else {
        cameraBtn.classList.remove('active');
        cameraBtn.classList.add('off');
        cameraBtn.innerHTML = '<i class="fas fa-video-slash"></i>';
        document.getElementById('selfPlaceholder').classList.remove('hidden');
    }
}

// Funciones para controlar el tiempo de llamada
function startCallTimer() {
    callSeconds = 0;
    callTimerInterval = setInterval(updateCallTimer, 1000);
}

function updateCallTimer() {
    callSeconds++;
    const hours = Math.floor(callSeconds / 3600);
    const minutes = Math.floor((callSeconds % 3600) / 60);
    const seconds = callSeconds % 60;
    
    const timeString = 
        (hours > 0 ? String(hours).padStart(2, '0') + ':' : '') + 
        String(minutes).padStart(2, '0') + ':' + 
        String(seconds).padStart(2, '0');
    
    document.querySelector('.call-timer').textContent = timeString;
}

function stopCallTimer() {
    clearInterval(callTimerInterval);
}

// Funciones para el chat
function sendMessage() {
    const messageInput = document.getElementById('messageInput');
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

function simulateDoctorResponse() {
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
    const chatMessages = document.getElementById('chatMessages');
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
    document.getElementById('diagnostico').textContent = "Gastritis aguda";
    
    // Actualizar medicamentos
    const medicamentosElement = document.getElementById('medicamentos');
    medicamentosElement.innerHTML = `
        <li>Omeprazol 20mg - 1 cápsula en ayunas por 14 días</li>
        <li>Sucralfato suspensión - 10ml antes de cada comida por 7 días</li>
    `;
    
    // Actualizar recomendaciones
    const recomendacionesElement = document.getElementById('recomendaciones');
    recomendacionesElement.innerHTML = `
        <li>Dieta blanda, evitar alimentos ácidos y picantes</li>
        <li>Evitar café, alcohol y tabaco durante el tratamiento</li>
        <li>Control en 15 días</li>
    `;
    
    // Cambiar a la pestaña de prescripción
    switchTab('prescription');
}

// Función para cambiar entre pestañas
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}