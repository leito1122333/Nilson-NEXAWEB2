// Cargar variables de entorno
require('dotenv').config(); // Para usar variables de .env

// Modulos requeridos
const express = require('express'); // Framework web
const { createClient } = require('@supabase/supabase-js'); // Conexión a supabase
const session = require('express-session');

// CONFIGURACIÓN PRINCIPAL
const app = express(); // Crea la app
const port = 3000; // Puerto del servidor

// Conexión a Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,  // URL de Supabase desde el archivo .env
    process.env.SUPABASE_KEY   // Clave de Supabase desde el archivo .env
);

// Middlewares (funciones que procesan peticiones)
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({  
    // Configurar sesiones 
    secret: process.env.SESSION_SECRET, // Clave para cifrar la sesión desde el archivo .env
    resave: false, // Guardar si no hay cambios 
    saveUninitialized: true // Guardar sesión aunque no tenga cambios
}));

// Configurar motor de plantillas (EJS)
app.set('view engine', 'ejs');
app.set('views', './views'); // Carpeta de las vistas

app.get('/', (req, res)=>{
    res.render('login', {error:null});
});

// Procesar el formulario de login
app.post('/login', async (req, res) => {
    const { identificacion, contrasena } = req.body; // Datos del formulario

    try {
        // Consultar a Supabase
        const { data, error } = await supabase
            .from('usuarios') // Tabla 'usuarios'
            .select('*') // Seleccionar todo
            .eq('Identificacion', identificacion) // Buscar por identificación
            .eq('Contrasena', contrasena) // Y contraseña
            .eq('Estado', true) // Solo usuarios activos
            .single(); // Esperar UN solo resultado

        // ❌ Si hay error o no existe el usuario
        if (error || !data) {
            return res.render('login', {
                error: '❌ Credenciales incorrectas o usuario inactivo'
            });
        }
    } catch (err) {
        console.error("🛑 Error:", err);
        res.render('login', { error: '🚨 Error al iniciar sesión' });
    }

    // ✅ Guardar usuario en sesión
    req.session.user = data;
    res.redirect('/welcome'); // Redirigir a bienvenida
});

// Ruta para la página de bienvenida
app.get('/welcome', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login'); // Si no está logueado, redirigir al login
    }
    res.render('welcome', { user: req.session.user });
});

//cerrar sesion
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// 🌐 Iniciar servidor
app.listen(port, () => {
    console.log(`🐝 Servidor corriendo en http://localhost:${port}`);
});