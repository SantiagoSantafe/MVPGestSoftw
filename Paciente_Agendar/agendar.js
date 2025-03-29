function openPaymentModal() {
    document.getElementById("paymentModal").style.display = "flex";
}

function closePaymentModal() {
    document.getElementById("paymentModal").style.display = "none";
}

function confirmPayment() {
    const selectedMethod = document.querySelector('input[name="pago"]:checked');
    if (selectedMethod) {
        alert(`Pago confirmado con método: ${selectedMethod.value}`);
        closePaymentModal();
        window.location.href = "../Paciente_Principal/index.html";
    } else {
        alert("Por favor, selecciona un método de pago.");
    }
}
