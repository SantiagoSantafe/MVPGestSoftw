// Funciones para mostrar/ocultar paneles de notificaciones y perfil
function toggleNotifications() {
    const panel = document.getElementById('notificationsPanel');
    if (panel.style.display === 'block') {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'block';
        document.getElementById('profileMenu').style.display = 'none';
    }
}

function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (menu.style.display === 'block') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'block';
        document.getElementById('notificationsPanel').style.display = 'none';
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

// Funciones para modales de consulta
function openModal(citaId) {
    document.getElementById('modal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
    
    // Aquí se podría cargar la información específica de la cita según su ID
    console.log('Abriendo modal para la cita ID:', citaId);
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}

// Funciones para modal de cancelación
function openCancelModal(citaId) {
    document.getElementById('cancelModal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
    
    // Aquí se podría cargar la información específica de la cita a cancelar
    // Por ahora usamos datos de ejemplo
    if (citaId === 2) {
        document.getElementById('cancelDate').textContent = '18/04/2025';
        document.getElementById('cancelTime').textContent = '10:15';
        document.getElementById('cancelDoctor').textContent = 'Dra. Laura Sánchez';
    }
    
    console.log('Abriendo modal de cancelación para la cita ID:', citaId);
}

function closeCancelModal() {
    document.getElementById('cancelModal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}

function confirmCancelCita() {
    const reason = document.getElementById('cancelReason').value;
    if (!reason.trim()) {
        alert('Por favor, indica el motivo de la cancelación.');
        return;
    }
    
    // Aquí se enviaría la solicitud al servidor para cancelar la cita
    console.log('Cita cancelada. Motivo:', reason);
    
    // Mostrar notificación
    alert('Cita cancelada correctamente. Recibirás un reembolso en breve.');
    
    closeCancelModal();
}

// Funciones para modal de reagendar
function openReagendarModal(citaId) {
    document.getElementById('reagendarModal').style.display = 'block';
    document.getElementById('modal-overlay').style.display = 'block';
    
    // Aquí se podría cargar la información específica de la cita a reagendar
    if (citaId === 2) {
        document.getElementById('reagendarDoctor').textContent = 'Dra. Laura Sánchez - Cardiología';
    }
    
    console.log('Abriendo modal de reagendar para la cita ID:', citaId);
    
    // Agregar manejadores de eventos a los slots de tiempo
    const timeSlots = document.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
        slot.addEventListener('click', function() {
            timeSlots.forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

function closeReagendarModal() {
    document.getElementById('reagendarModal').style.display = 'none';
    document.getElementById('modal-overlay').style.display = 'none';
}

function confirmReagendarCita() {
    const newDate = document.getElementById('newDate').value;
    const selectedSlot = document.querySelector('.time-slot.selected');
    
    if (!newDate) {
        alert('Por favor, selecciona una fecha.');
        return;
    }
    
    if (!selectedSlot) {
        alert('Por favor, selecciona una hora disponible.');
        return;
    }
    
    const newTime = selectedSlot.textContent;
    
    // Aquí se enviaría la solicitud al servidor para reagendar la cita
    console.log('Cita reagendada para:', newDate, 'a las', newTime);
    
    // Mostrar notificación
    alert(`Cita reagendada correctamente para el ${newDate} a las ${newTime}.`);
    
    closeReagendarModal();
}

// Funciones para videollamada
function openVideoCall() {
    closeModal();
    document.getElementById('videocallContainer').style.display = 'block';
    
    // Iniciar tiempo de llamada
    startCallTimer();
}

function endVideoCall() {
    document.getElementById('videocallContainer').style.display = 'none';
    stopCallTimer();
}

let callTimerInterval;
let callSeconds = 0;

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

// Funciones para pestañas de videollamada
function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

// Funciones de login
function showLoginForm() {
    document.getElementById('loginOverlay').style.display = 'flex';
}

function login() {
    const cedula = document.getElementById('cedula').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!cedula || !email || !password) {
        alert('Por favor, completa todos los campos.');
        return;
    }
    
    // Aquí se enviaría la solicitud al servidor para validar las credenciales
    console.log('Iniciando sesión con:', cedula, email);
    
    // Ocultar el formulario de login
    document.getElementById('loginOverlay').style.display = 'none';
}

// Funciones para FAQs
function toggleFaq(element) {
    const answer = element.nextElementSibling;
    const icon = element.querySelector('i');
    
    if (answer.style.display === 'block') {
        answer.style.display = 'none';
        icon.className = 'fas fa-chevron-down';
    } else {
        answer.style.display = 'block';
        icon.className = 'fas fa-chevron-up';
    }
}

// Funciones para filtros
function aplicarFiltros() {
    const fecha = document.getElementById('filterDate').value;
    const especialidad = document.getElementById('filterEspecialidad').value;
    
    console.log('Filtrando por fecha:', fecha, 'y especialidad:', especialidad);
    
    // Aquí se implementaría la lógica para filtrar las citas
    alert('Filtros aplicados correctamente.');
}

// Cerrar paneles al hacer clic fuera de ellos
document.addEventListener('click', function(event) {
    const notificationsPanel = document.getElementById('notificationsPanel');
    const profileMenu = document.getElementById('profileMenu');
    const notificationsButton = document.querySelector('.notifications');
    const profileButton = document.querySelector('.profile');
    
    if (notificationsPanel.style.display === 'block' && 
        !notificationsPanel.contains(event.target) && 
        !notificationsButton.contains(event.target)) {
        notificationsPanel.style.display = 'none';
    }
    
    if (profileMenu.style.display === 'block' && 
        !profileMenu.contains(event.target) && 
        !profileButton.contains(event.target)) {
        profileMenu.style.display = 'none';
    }
});

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar la sección de citas por defecto
    showCitas();
});