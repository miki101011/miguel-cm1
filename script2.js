
// ================================
// IndexedDB: Inicialización y CRUD
// ================================

const DB_NAME = 'miBaseDatos';
const DB_VERSION = 1;
let db;

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onerror = function (event) {
  console.error('Error abriendo IndexedDB:', event.target.error);
};

request.onsuccess = function (event) {
  db = event.target.result;
  console.log('Base de datos abierta correctamente.');
};

request.onupgradeneeded = function (event) {
  db = event.target.result;

  if (!db.objectStoreNames.contains('usuarios')) {
    db.createObjectStore('usuarios', { keyPath: 'id', autoIncrement: true });
  }

  if (!db.objectStoreNames.contains('productos')) {
    db.createObjectStore('productos', { keyPath: 'id', autoIncrement: true });
  }

  if (!db.objectStoreNames.contains('pedidos')) {
    const store = db.createObjectStore('pedidos', { keyPath: 'id', autoIncrement: true });
    store.createIndex('idUsuario', 'idUsuario', { unique: false });
    store.createIndex('idProducto', 'idProducto', { unique: false });
  }
};

function agregarDato(storeName, data) {
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  const request = store.add(data);

  request.onsuccess = () => console.log('Agregado a', storeName, data);
  request.onerror = (e) => console.error('Error al agregar en', storeName, e.target.error);
}

function obtenerTodos(storeName, callback) {
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  const request = store.getAll();

  request.onsuccess = () => callback(request.result);
  request.onerror = (e) => console.error('Error al leer de', storeName, e.target.error);
}

function actualizarDato(storeName, data) {
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  const request = store.put(data);

  request.onsuccess = () => console.log('Actualizado en', storeName, data);
  request.onerror = (e) => console.error('Error al actualizar en', storeName, e.target.error);
}

function eliminarDato(storeName, id) {
  const transaction = db.transaction([storeName], 'readwrite');
  const store = transaction.objectStore(storeName);
  const request = store.delete(id);

  request.onsuccess = () => console.log('Eliminado de', storeName, id);
  request.onerror = (e) => console.error('Error al eliminar de', storeName, e.target.error);
}

function agregarUsuario() {
  const nombre = document.getElementById("nombreUsuario").value;
  const correo = document.getElementById("correoUsuario").value;
  agregarDato("usuarios", { nombre, correo });
}

function agregarProducto() {
  const nombre = document.getElementById("nombreProducto").value;
  const precio = parseFloat(document.getElementById("precioProducto").value);
  agregarDato("productos", { nombre, precio });
}

function agregarPedido() {
  const idUsuario = parseInt(document.getElementById("idUsuarioPedido").value);
  const idProducto = parseInt(document.getElementById("idProductoPedido").value);
  const cantidad = parseInt(document.getElementById("cantidadPedido").value);
  agregarDato("pedidos", { idUsuario, idProducto, cantidad });
}

function mostrarUsuarios() {
  const trans = db.transaction("usuarios", "readonly");
  const store = trans.objectStore("usuarios");
  const tabla = document.getElementById("tablaUsuarios");
  tabla.innerHTML = "";

  store.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      const usuario = cursor.value;
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${usuario.id}</td>
        <td>${usuario.nombre}</td>
        <td>${usuario.correo}</td>
        <td>
          <button class="btn btn-sm btn-warning me-2" onclick="editarFormulario('usuarios', ${usuario.id})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarDato('usuarios', ${usuario.id})">Eliminar</button>
        </td>
      `;
      tabla.appendChild(fila);
      cursor.continue();
    }
  };
}

function mostrarProductos() {
  const trans = db.transaction("productos", "readonly");
  const store = trans.objectStore("productos");
  const tabla = document.getElementById("tablaProductos");
  tabla.innerHTML = "";

  store.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      const producto = cursor.value;
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${producto.id}</td>
        <td>${producto.nombre}</td>
        <td>${producto.precio}</td>
        <td>
          <button class="btn btn-sm btn-warning me-2" onclick="editarFormulario('productos', ${producto.id})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarDato('productos', ${producto.id})">Eliminar</button>
        </td>
      `;
      tabla.appendChild(fila);
      cursor.continue();
    }
  };
}

function mostrarPedidos() {
  const tabla = document.getElementById("tablaPedidos");
  tabla.innerHTML = "";

  const trans = db.transaction(["pedidos", "usuarios", "productos"], "readonly");
  const pedidosStore = trans.objectStore("pedidos");
  const usuariosStore = trans.objectStore("usuarios");
  const productosStore = trans.objectStore("productos");

  pedidosStore.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      const pedido = cursor.value;

      const reqUsuario = usuariosStore.get(pedido.idUsuario);
      const reqProducto = productosStore.get(pedido.idProducto);

      reqUsuario.onsuccess = () => {
        reqProducto.onsuccess = () => {
          const usuario = reqUsuario.result;
          const producto = reqProducto.result;

          const fila = document.createElement("tr");
          fila.innerHTML = `
            <td>${usuario ? usuario.nombre : \`ID ${pedido.idUsuario}\`}</td>
            <td>${producto ? producto.nombre : \`ID ${pedido.idProducto}\`}</td>
            <td>${pedido.cantidad}</td>
            <td>
              <button class="btn btn-sm btn-warning me-2" onclick="editarFormulario('pedidos', ${pedido.id})">Editar</button>
              <button class="btn btn-sm btn-danger" onclick="eliminarDato('pedidos', ${pedido.id})">Eliminar</button>
            </td>
          `;
          tabla.appendChild(fila);

          cursor.continue();
        };
      };
    }
  };
}

function editarFormulario(storeName, id) {
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  const request = store.get(id);
  request.onsuccess = () => {
    const data = request.result;
    let campos = '';
    for (let key in data) {
      if (key !== 'id') {
        campos += `<input id="edit-${key}" class="form-control mb-2" value="${data[key]}" />`;
      }
    }
    const contenedor = document.getElementById("output");
    contenedor.innerHTML = `
      <h5>Editando en ${storeName}</h5>
      ${campos}
      <button class="btn btn-success" onclick="guardarEdicion('${storeName}', ${id})">Guardar</button>
    `;
  };
}

function guardarEdicion(storeName, id) {
  const data = { id };
  const contenedor = document.getElementById("output");
  const inputs = contenedor.querySelectorAll("input[id^='edit-']");
  inputs.forEach(input => {
    const key = input.id.replace("edit-", "");
    data[key] = isNaN(input.value) ? input.value : Number(input.value);
  });
  actualizarDato(storeName, data);
  mostrarConCursor(storeName);
}

function mostrarConCursor(storeName) {
  const transaction = db.transaction([storeName], 'readonly');
  const store = transaction.objectStore(storeName);
  const request = store.openCursor();
  const contenedor = document.getElementById("output");
  contenedor.innerHTML = `<h5>${storeName.charAt(0).toUpperCase() + storeName.slice(1)}:</h5>`;

  request.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      const item = cursor.value;
      contenedor.innerHTML += `
        <div class="mb-3 p-2 border border-light rounded">
          <pre>${JSON.stringify(item, null, 2)}</pre>
          <button class="btn btn-sm btn-warning me-2" onclick="editarFormulario('${storeName}', ${item.id})">Editar</button>
          <button class="btn btn-sm btn-danger" onclick="eliminarDato('${storeName}', ${item.id})">Eliminar</button>
        </div>`;
      cursor.continue();
    }
  };
}
