function openModal() {
    document.getElementById("modal").style.display = "block";
    document.getElementById("modal-overlay").style.display = "block";
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
    document.getElementById("modal-overlay").style.display = "none";
}

function openVideoCall() {
    closeModal();
    const win = window.open("", "_blank", "width=800,height=600");
    win.document.write(`
        <div style="display: flex; justify-content: space-between; width: 80%; height: 70vh; background: white; border-radius: 10px; padding: 20px;">
            <div style="flex: 2; background: gray; display: flex; align-items: center; justify-content: center; color: white;">
                Videollamada en curso...
            </div>
            <div style="flex: 1; background: #f4f4f4; padding: 10px; overflow-y: auto;">
                Simulación de chat...
            </div>
        </div>
    `);
}
