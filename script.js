// === DATOS ===
let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [
    { usuario: 'admin', contraseña: '1234', rol: 'admin' },
    { usuario: 'user', contraseña: 'user123', rol: 'usuario' }
];
let productos = JSON.parse(localStorage.getItem('productos')) || [
    { id: '001', nombre: 'Arroz', categoria: 'cat1', cantidad: 10, precio: 4.00 }
];

// === ELEMENTOS GLOBALES Y MODALES ===
const logoutBtn = document.getElementById('logout-btn');

// 💡 Los modales se inicializan solo si sus elementos existen en la página actual
let modalEditar;
if (document.getElementById('modalEditar')) {
    modalEditar = new bootstrap.Modal(document.getElementById('modalEditar'));
}

let modalUsuario;
if (document.getElementById('modalAgregarUsuario')) {
    modalUsuario = new bootstrap.Modal(document.getElementById('modalAgregarUsuario'));
}


// === AUTENTICACIÓN Y REDIRECCIÓN ===

/**
 * Verifica el estado de autenticación y maneja las redirecciones.
 */
function checkAuth() {
    const isAuthenticated = localStorage.getItem('sesionIniciada') === 'true';
    // Comprueba si la URL actual termina en 'index.html' o es la raíz de la web (/)
    const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');

    if (!isAuthenticated) {
        // Si NO está autenticado, y NO estamos en la página de login, redirigir al login.
        if (!isLoginPage) {
            window.location.href = 'index.html';
        }
    } else {
        // Si SÍ está autenticado, y estamos en la página de login, redirigir a home.
        if (isLoginPage) {
            window.location.href = 'home.html';
        }
        // Mostrar el botón de logout en cualquier página autenticada
        if (logoutBtn) {
            logoutBtn.classList.remove('hidden');
        }
    }
}

// Llama a la verificación al cargar la página
document.addEventListener('DOMContentLoaded', checkAuth);


// === LOGIN ===
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.onsubmit = e => {
        e.preventDefault();
        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value;
        const valido = usuarios.find(u => u.usuario === user && u.contraseña === pass);

        if (valido) {
            localStorage.setItem('sesionIniciada', 'true');
            localStorage.setItem('usuarioActual', user);
            alert('¡Inicio de sesión exitoso!');
            
            // Redirección inmediata a home.html
            window.location.href = 'home.html';
            
        } else {
            alert('Credenciales incorrectas');
        }
    };
}


// === LOGOUT ===
if (logoutBtn) {
    logoutBtn.onclick = () => {
        if (confirm('¿Cerrar sesión?')) {
            localStorage.removeItem('sesionIniciada');
            localStorage.removeItem('usuarioActual');
            // Redirige al login. checkAuth se encargará de confirmar el cierre.
            window.location.href = 'index.html'; 
        }
    };
}

// === PRODUCTOS (CRUD) ===

function generarId() {
    const max = productos.reduce((m, p) => p.id > m ? p.id : m, '000');
    return String(parseInt(max) + 1).padStart(3, '0');
}

// Función para guardar los datos en localStorage
function guardar() {
    localStorage.setItem('productos', JSON.stringify(productos));
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
}

// Lógica de Renderizado y Eventos (Productos.html)
function renderizarTabla(filtro = '') {
    const tablaBody = document.querySelector('#productos tbody');
    if (!tablaBody) return; // Salir si no estamos en productos.html

    tablaBody.innerHTML = '';
    const filtrados = productos.filter(p =>
        p.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
        p.id.includes(filtro) ||
        (filtro.startsWith('cat') && p.categoria === filtro)
    );
    
    filtrados.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${p.id}</td>
            <td>${p.nombre}</td>
            <td>${p.categoria === 'cat1' ? 'Categoría A' : 'Categoría B'}</td>
            <td>${p.cantidad}</td>
            <td>$${parseFloat(p.precio).toFixed(2)}</td>
            <td>
                <button class="btn btn-warning btn-sm editar" data-id="${p.id}">Editar</button>
                <button class="btn btn-danger btn-sm eliminar" data-id="${p.id}">Eliminar</button>
            </td>
        `;
        tablaBody.appendChild(tr);
    });
    
    // Asignación de eventos de click
    document.querySelectorAll('.editar').forEach(b => b.onclick = abrirEditar);
    document.querySelectorAll('.eliminar').forEach(b => b.onclick = eliminarProducto);
}

function abrirEditar(e) {
    if (!modalEditar) return;
    const id = e.target.dataset.id;
    const p = productos.find(x => x.id === id);
    document.getElementById('edit-id').value = p.id;
    document.getElementById('edit-nombre').value = p.nombre;
    document.getElementById('edit-categoria').value = p.categoria;
    document.getElementById('edit-cantidad').value = p.cantidad;
    document.getElementById('edit-precio').value = p.precio;
    modalEditar.show();
}

function eliminarProducto(e) {
    if (confirm('¿Eliminar producto?')) {
        productos = productos.filter(p => p.id !== e.target.dataset.id);
        guardar();
        renderizarTabla();
    }
}

// Eventos de la página productos.html
if (document.getElementById('form-editar')) {
    document.getElementById('form-editar').onsubmit = e => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const p = productos.find(x => x.id === id);
        p.nombre = document.getElementById('edit-nombre').value.trim();
        p.categoria = document.getElementById('edit-categoria').value;
        p.cantidad = parseInt(document.getElementById('edit-cantidad').value);
        p.precio = parseFloat(document.getElementById('edit-precio').value).toFixed(2);
        guardar();
        renderizarTabla();
        modalEditar.hide();
    };
}

// === BÚSQUEDA (Productos.html) ===
if (document.getElementById('form-buscar')) {
    const buscarInput = document.getElementById('buscar');
    document.getElementById('form-buscar').onsubmit = e => {
        e.preventDefault();
        renderizarTabla(buscarInput.value);
    };
    buscarInput.oninput = () => renderizarTabla(buscarInput.value);
    
    document.querySelectorAll('.cat-link').forEach(a => {
        a.onclick = e => {
            e.preventDefault();
            const cat = a.getAttribute('href').substring(1);
            // Si es 'cat3', limpia el input y muestra todos.
            if (cat === 'cat3') {
                buscarInput.value = '';
                renderizarTabla('');
            } else {
                // Si es cat1 o cat2, filtra por categoría
                buscarInput.value = cat; 
                renderizarTabla(cat);
            }
        };
    });
}


// === Lógica de AGREGAR (agregar.html) ===
if (document.getElementById('form-agregar')) {
    document.getElementById('form-agregar').onsubmit = e => {
        e.preventDefault();
        const nuevo = {
            id: generarId(),
            nombre: document.getElementById('nombre').value.trim(),
            categoria: document.getElementById('categoria').value,
            cantidad: parseInt(document.getElementById('cantidad').value),
            precio: parseFloat(document.getElementById('precio').value).toFixed(2)
        };
        productos.push(nuevo);
        guardar();
        e.target.reset();
        alert('¡Producto agregado! Redirigiendo a Productos...');
        // Redirigir al usuario a la vista de productos después de agregar
        window.location.href = 'productos.html';
    };
}

// === REPORTES (reportes.html) ===
if (document.getElementById('btn-generar-reporte')) {
    document.getElementById('btn-generar-reporte').onclick = () => {
        // Aseguramos que 'p.precio' se convierta a número antes de multiplicar
        const total = productos.reduce((s, p) => s + p.cantidad, 0);
        const valor = productos.reduce((s, p) => s + (p.cantidad * parseFloat(p.precio)), 0).toFixed(2);
        alert(`REPORTE DE INVENTARIO\n\nProductos únicos: ${productos.length}\nUnidades totales: ${total}\nValor total: $${valor}`);
    };
}


// === CONFIGURACIÓN (configuracion.html) ===

function cargarConfiguracion() {
    const lista = document.getElementById('lista-usuarios');
    if (!lista) return; // Salir si no estamos en configuracion.html
    
    lista.innerHTML = '';
    const usuarioActual = localStorage.getItem('usuarioActual');

    usuarios.forEach(u => {
        // No mostrar la opción de eliminar el usuario actualmente logueado
        if (u.usuario === usuarioActual) return; 

        const li = document.createElement('li');
        li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        li.innerHTML = `<span><strong>${u.usuario}</strong> (${u.rol})</span>
            <button class="btn btn-danger btn-sm eliminar-usuario" data-usuario="${u.usuario}">Eliminar</button>`;
        lista.appendChild(li);
    });

    // Asignación de eventos de eliminación
    document.querySelectorAll('.eliminar-usuario').forEach(b => {
        b.onclick = function() {
            if (confirm('¿Eliminar usuario? Esta acción es irreversible.')) {
                usuarios = usuarios.filter(x => x.usuario !== this.dataset.usuario);
                guardar();
                cargarConfiguracion();
            }
        };
    });
}

// Lógica de la página configuracion.html
if (document.getElementById('btn-agregar-usuario')) {
    document.getElementById('btn-agregar-usuario').onclick = () => modalUsuario.show();
}

if (document.getElementById('form-nuevo-usuario')) {
    document.getElementById('form-nuevo-usuario').onsubmit = e => {
        e.preventDefault();
        const user = document.getElementById('nuevo-usuario').value.trim();
        const pass = document.getElementById('nueva-contraseña').value;
        
        if (user && pass && !usuarios.some(u => u.usuario === user)) {
            usuarios.push({ usuario: user, contraseña: pass, rol: 'usuario' });
            guardar();
            cargarConfiguracion();
            modalUsuario.hide();
            e.target.reset();
        } else {
            alert('Error: El usuario ya existe o los datos son inválidos.');
        }
    };
}

if (document.getElementById('form-cambiar-pass')) {
    document.getElementById('form-cambiar-pass').onsubmit = e => {
        e.preventDefault();
        const nueva = document.getElementById('nueva-pass').value;
        const conf = document.getElementById('confirmar-pass').value;
        
        if (nueva === conf && nueva.length >= 4) {
            const actual = usuarios.find(u => u.usuario === localStorage.getItem('usuarioActual'));
            if(actual){
                actual.contraseña = nueva;
                guardar();
                alert('Contraseña actualizada con éxito.');
                e.target.reset();
            } else {
                 alert('Error: No se pudo encontrar el usuario actual.');
            }
        } else {
            alert('Error: Las contraseñas no coinciden o son demasiado cortas (mínimo 4 caracteres).');
        }
    };
}

if (document.getElementById('btn-limpiar-datos')) {
    document.getElementById('btn-limpiar-datos').onclick = () => {
        if (confirm('⚠️ ¡ADVERTENCIA! ¿Está seguro de BORRAR TODOS LOS DATOS de productos?')) {
            productos = [];
            guardar();
            alert('Datos de productos eliminados. La página Productos estará vacía.');
        }
    };
}


// === Carga Inicial Específica de Módulos (Después de la autenticación) ===
document.addEventListener('DOMContentLoaded', () => {
    // Si estamos en productos.html, cargamos la tabla
    if (document.querySelector('#productos tbody')) {
        renderizarTabla();
    }
    // Si estamos en configuracion.html, cargamos la lista de usuarios
    if (document.getElementById('lista-usuarios')) {
        cargarConfiguracion();
    }
});