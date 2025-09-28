-- Base de Datos: restaurante_ordenes_db

-- Tabla: clientes
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(50) NOT NULL
);

-- Tabla: ordenes
CREATE TABLE ordenes (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE CASCADE,
    platillo_nombre VARCHAR(255) NOT NULL,
    notas TEXT,
    estado VARCHAR(50) DEFAULT 'pending' NOT NULL,
    creado TIMESTAMP DEFAULT NOW(),
    -- Restricción para asegurar que el estado solo pueda ser uno de los valores permitidos
    CONSTRAINT check_estado_valido CHECK (estado IN ('pending', 'preparing', 'delivered'))
);

-- Insertar un cliente de prueba
INSERT INTO clientes (nombre, email, telefono) VALUES
('Juan Perez', 'juan.perez@ejemplo.com', '555-1234');