// Carga las variables de entorno del archivo .env
require('dotenv').config(); 
const express = require('express');
const { Pool } = require('pg'); 
const cors = require('cors');
const path = require('path'); // Importa la librería 'path'

const app = express();
const port = process.env.PORT || 3000;

// Configuración de la conexión a PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

// Middlewares
app.use(cors()); 
app.use(express.json()); 

// ** CLAVE: Sirve archivos estáticos de la carpeta 'public' (Frontend) **
app.use(express.static(path.join(__dirname, 'public')));


// Test de conexión a la base de datos
pool.connect((err, client, done) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log('Conexión a la base de datos exitosa.');
        done();
    }
});

// =================================================================
// ============== IMPLEMENTACIÓN DE ENDPOINTS DE LA API ==============
// =================================================================

// 1. POST /clientes/registrar: Registrar un nuevo cliente
app.post('/clientes/registrar', async (req, res) => {
    const { nombre, email, telefono } = req.body;

    if (!nombre || !email || !telefono) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        // Verificar si el email ya existe
        const checkClient = await pool.query('SELECT id FROM clientes WHERE email = $1', [email]);
        if (checkClient.rows.length > 0) {
            return res.status(409).json({ message: 'El email ya está registrado.' });
        }

        // Insertar el nuevo cliente
        const result = await pool.query(
            'INSERT INTO clientes (nombre, email, telefono) VALUES ($1, $2, $3) RETURNING id, nombre',
            [nombre, email, telefono]
        );

        res.status(201).json({
            message: 'Cliente registrado exitosamente.',
            clienteId: result.rows[0].id,
            nombre: result.rows[0].nombre
        });

    } catch (error) {
        console.error('Error al registrar cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor al registrar.' });
    }
});

// 2. POST /clientes/login: Simular el acceso del cliente
app.post('/clientes/login', async (req, res) => {
    const { email, telefono } = req.body;

    if (!email || !telefono) {
        return res.status(400).json({ message: 'Email y teléfono son obligatorios.' });
    }

    try {
        // Buscar cliente por email y validar teléfono
        const result = await pool.query(
            'SELECT id, nombre FROM clientes WHERE email = $1 AND telefono = $2',
            [email, telefono]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // Acceso exitoso
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            clienteId: result.rows[0].id,
            nombre: result.rows[0].nombre
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Error interno del servidor al iniciar sesión.' });
    }
});

// 3. POST /ordenes: Registrar un nuevo pedido para un cliente
app.post('/ordenes', async (req, res) => {
    const { clienteId, platilloNombre, notas } = req.body;

    if (!clienteId || !platilloNombre) {
        return res.status(400).json({ message: 'Cliente ID y nombre del platillo son obligatorios.' });
    }

    try {
        // El estado por defecto es 'pending'
        const result = await pool.query(
            'INSERT INTO ordenes (cliente_id, platillo_nombre, notas) VALUES ($1, $2, $3) RETURNING id',
            [clienteId, platilloNombre, notas]
        );

        res.status(201).json({
            message: 'Orden creada exitosamente.',
            ordenId: result.rows[0].id
        });

    } catch (error) {
        console.error('Error al crear la orden:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear la orden.' });
    }
});

// 4. GET /ordenes/:clienteId: Listar todos los pedidos de un cliente
app.get('/ordenes/:clienteId', async (req, res) => {
    const { clienteId } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM ordenes WHERE cliente_id = $1 ORDER BY creado DESC',
            [clienteId]
        );

        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Error al obtener las órdenes:', error);
        res.status(500).json({ message: 'Error interno del servidor al listar órdenes.' });
    }
});

// 5. PUT /ordenes/:id/estado: Actualizar el estado de un pedido
app.put('/ordenes/:id/estado', async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Obtener el estado actual y verificar que la orden exista
        const currentOrder = await pool.query('SELECT estado FROM ordenes WHERE id = $1', [id]);
        if (currentOrder.rows.length === 0) {
            return res.status(404).json({ message: 'Orden no encontrada.' });
        }

        const currentState = currentOrder.rows[0].estado;
        let nextState;

        // 2. Determinar el siguiente estado en el flujo
        if (currentState === 'pending') {
            nextState = 'preparing';
        } else if (currentState === 'preparing') {
            nextState = 'delivered';
        } else if (currentState === 'delivered') {
            return res.status(400).json({ message: 'La orden ya fue entregada.' });
        } else {
            return res.status(400).json({ message: 'Estado de orden desconocido.' });
        }

        // 3. Actualizar el estado en la base de datos
        const updateResult = await pool.query(
            'UPDATE ordenes SET estado = $1 WHERE id = $2 RETURNING estado',
            [nextState, id]
        );

        res.status(200).json({
            message: `Estado actualizado a: ${nextState}`,
            nuevoEstado: nextState
        });

    } catch (error) {
        console.error('Error al actualizar el estado de la orden:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar estado.' });
    }
});

// =================================================================

// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});