document.addEventListener('DOMContentLoaded', () => {

    // Cambia a tu URL de Render cuando hagas el despliegue
    //const API_BASE_URL = 'http://localhost:3000'; 
     const API_BASE_URL = 'https://restaurante-api-oik0.onrender.com';

    // Referencias a elementos y formularios
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const addOrderForm = document.getElementById('add-order-form');
    const logoutButton = document.getElementById('logout-button');
    const clientNameDisplay = document.getElementById('client-name-display');

    // --- Funciones de Utilidad ---

    function showOrdersPage(nombre) {
        document.getElementById('auth-section').style.display = 'none';
        document.getElementById('orders-section').style.display = 'block';
        clientNameDisplay.textContent = nombre;
        fetchOrders();
    }

    function showAuthPage() {
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('orders-section').style.display = 'none';
        clearForms();
    }

    function clearForms() {
        // Limpia formularios de autenticación
        document.getElementById('register-form').reset();
        document.getElementById('login-form').reset();
        // Limpia formulario de pedidos
        document.getElementById('add-order-form').reset();
    }


    // --- 1. Lógica de Registro ---

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nombre = document.getElementById('register-nombre').value;
            const email = document.getElementById('register-email').value;
            const telefono = document.getElementById('register-telefono').value;
            
            try {
                const response = await fetch(`${API_BASE_URL}/clientes/registrar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, email, telefono })
                });
                const data = await response.json();
                
                if (response.ok) {
                    alert('Registro exitoso! Por favor, inicia sesión.');
                    document.getElementById('register-form').reset();
                } else {
                    alert('Error en el registro: ' + data.message);
                }
            } catch (error) {
                console.error('Error al conectar con la API:', error);
                alert('Error al conectar con el servidor.');
            }
        });
    }

    // --- 2. Lógica de Login ---

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const telefono = document.getElementById('login-telefono').value;
            
            try {
                const response = await fetch(`${API_BASE_URL}/clientes/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, telefono })
                });
                const data = await response.json();
                
                if (response.ok) {
                    alert('Inicio de sesión exitoso.');
                    localStorage.setItem('clienteId', data.clienteId);
                    localStorage.setItem('clienteNombre', data.nombre);
                    showOrdersPage(data.nombre);
                } else {
                    alert('Error en el login: ' + data.message);
                }
            } catch (error) {
                console.error('Error al conectar con la API:', error);
                alert('Error al conectar con el servidor.');
            }
        });
    }

    // --- 3. Lógica para Crear Pedido ---

    if (addOrderForm) {
        addOrderForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const clienteId = localStorage.getItem('clienteId');
            const platilloNombre = document.getElementById('order-platillo').value;
            const notas = document.getElementById('order-notas').value;

            if (!clienteId) {
                alert('Por favor, inicia sesión para hacer un pedido.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/ordenes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clienteId, platilloNombre, notas })
                });
                const data = await response.json();
                
                if (response.ok) {
                    alert('Pedido creado exitosamente.');
                    document.getElementById('add-order-form').reset();
                    fetchOrders(); // Actualiza la lista
                } else {
                    alert('Error al crear el pedido: ' + data.message);
                }
            } catch (error) {
                console.error('Error al crear el pedido:', error);
                alert('Error al conectar con el servidor para crear el pedido.');
            }
        });
    }

    // --- 4. Lógica para Listar Pedidos ---

    async function fetchOrders() {
        const clienteId = localStorage.getItem('clienteId');
        if (!clienteId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/ordenes/${clienteId}`);
            const orders = await response.json();
            const ordersList = document.getElementById('orders-list');
            ordersList.innerHTML = '';
            
            if (orders.length === 0) {
                ordersList.innerHTML = '<p>No has realizado pedidos aún. ¡Crea uno!</p>';
                return;
            }

            orders.forEach(order => {
                const orderElement = document.createElement('div');
                orderElement.className = `order-item status-${order.estado}`; // Usa el estado para CSS
                
                // Formatear la fecha
                const createdDate = new Date(order.creado).toLocaleString();

                orderElement.innerHTML = `
                    <h4>Pedido #${order.id} - ${order.platillo_nombre}</h4>
                    <p>Notas: ${order.notas || 'Ninguna'}</p>
                    <p>Estado: <strong>${order.estado.toUpperCase()}</strong></p>
                    <small>Creado: ${createdDate}</small>
                    ${order.estado !== 'delivered' ? 
                        `<button class="status-button" data-id="${order.id}">Avanzar Estado</button>` : 
                        '<p>✅ Pedido Entregado</p>'
                    }
                `;
                ordersList.appendChild(orderElement);
            });

            // Añadir eventos a los botones de avanzar estado
            document.querySelectorAll('.status-button').forEach(button => {
                button.addEventListener('click', handleStatusUpdate);
            });

        } catch (error) {
            console.error('Error al obtener los pedidos:', error);
            document.getElementById('orders-list').innerHTML = '<p>Error al cargar los pedidos.</p>';
        }
    }


    // --- 5. Lógica para Actualizar Estado del Pedido ---
    
    async function handleStatusUpdate(e) {
        const orderId = e.target.getAttribute('data-id');

        try {
            const response = await fetch(`${API_BASE_URL}/ordenes/${orderId}/estado`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            
            if (response.ok) {
                alert(`Estado actualizado a: ${data.nuevoEstado.toUpperCase()}`);
                fetchOrders(); // Recargar la lista para mostrar el nuevo estado
            } else {
                alert('Error al actualizar el estado: ' + data.message);
            }
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            alert('Error al conectar con el servidor.');
        }
    }

    // --- 6. Lógica de Cerrar Sesión ---
    
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('clienteId');
            localStorage.removeItem('clienteNombre');
            showAuthPage();
            alert('Sesión cerrada exitosamente.');
        });
    }

    // --- Comprobación Inicial ---
    
    const clienteId = localStorage.getItem('clienteId');
    const clienteNombre = localStorage.getItem('clienteNombre');
    if (clienteId && clienteNombre) {
        showOrdersPage(clienteNombre);
    } else {
        showAuthPage();
    }
});