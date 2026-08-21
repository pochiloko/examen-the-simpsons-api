const BASE_URL = 'https://thesimpsonsapi.com/api';
const CDN_URL = 'https://cdn.statically.io/img/thesimpsonsapi.com'; 

const contenedorPer = document.getElementById('contenedorpersonajes');
const mensajes = document.getElementById('mensajes');
const busquedaBarra = document.getElementById('busqueda__barra');
const contenedorFavs = document.getElementById('contenedorfavoritos');
const verFavs = document.getElementById('ver-favs');
const verTodo = document.getElementById('ver-todos');
const paginaAnt = document.getElementById('anterior__pag');
const paginaSig = document.getElementById('siguiente__pag');
const numeroPag = document.getElementById('pagina__numero');

let paginaActual = 1;
let personajesCargados = [];
let personajesFavoritos = [];
let textoBusqueda = '';
let totalPag = 1;

const tamanoPag = 20;

async function obtenerPersonajes() {
  try {

    let url = `${BASE_URL}/characters?page=${paginaActual}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('La página no responde');
    const data = await response.json();
    personajesCargados = data.results;
    totalPag = data.pages;
    return personajesCargados;

  } catch (error) {
    mensajes.textContent = 'No se pudo cargar la información';
    console.log(error);
    return [];
  }
}

async function obtenerTodosLosPersonajes() {//aca consulte mucho con la ia
  try {
    const personajesTodos = [];
    let url = `${BASE_URL}/characters?page=1`;
    let response = await fetch(url);
    if (!response.ok) throw new Error('Error en la carga');
    let data = await response.json();
    personajesTodos.push(...data.results);
    const totalPaginas = data.pages;
    for (let i = 2; i <= totalPaginas; i++) {
      url = `${BASE_URL}/characters?page=${i}`;
      response = await fetch(url);
      if (!response.ok) break;
      data = await response.json();
      personajesTodos.push(...data.results);
    }
    return personajesTodos;
  } catch (error) {
    mensajes.textContent = 'No se pudo cargar toda la información para la búsqueda';
    console.log(error);
    return [];
  }
}
function filtrarPorTexto(personajes, texto) {//aca tambien
  if (!texto.trim()) return personajes;
  const textoMinuscula = texto.trim().toLowerCase();
  return personajes.filter(p => {
    const nombre = p.name.toLowerCase();
    const estado = (p.status || '').toLowerCase();
    const ocupacion = (p.occupation || '').toLowerCase();
    const frases = p.phrases ? p.phrases.join(' ').toLowerCase() : '';
    return (nombre.includes(textoMinuscula) ||
            estado.includes(textoMinuscula) ||
            ocupacion.includes(textoMinuscula) ||
            frases.includes(textoMinuscula));
  });
}
function mostrarPersonajes() {
  contenedorPer.innerHTML = '';
  if (!personajesCargados || personajesCargados.length === 0) {
    contenedorPer.innerHTML = '<p>No se encontró el personaje.</p>';
    return;
  }
  personajesCargados.forEach(personaje => {
    const card = document.createElement('div');
    card.className = 'personaje_card';
    const esFavorito = personajesFavoritos.some(favId => String(favId) === String(personaje.id));
    const imgUrl = personaje.portrait_path ? CDN_URL + personaje.portrait_path : 'https://via.placeholder.com/150?text=No+Image';
    const frasesPrincipales = personaje.phrases && personaje.phrases.length > 3
      ? personaje.phrases.slice(1, 4).join(', ')
      : personaje.phrases ? personaje.phrases.join(', ') : 'Sin frases disponibles';
    card.innerHTML = `
      <button class="fav-btn ${esFavorito ? 'active' : ''}" data-id="${personaje.id}" aria-label="Marcar como favorito">&#9733;</button>
      <img src="${imgUrl}" alt="Foto de ${personaje.name}"
      onerror="this.onerror=null;this.src='https://via.placeholder.com/150?text=No+Image';">
      <h3>${personaje.name}</h3>
      <p>Estado: ${personaje.status}</p>
      <p>Ocupación: ${personaje.occupation}</p>
      <p>Frases principales: ${frasesPrincipales}</p>
    `;
    contenedorPer.appendChild(card);
  });
  numeroPag.textContent = `Página ${paginaActual} de ${totalPag}`;
  document.querySelectorAll('.fav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      toggleFavorito(id);
      btn.classList.toggle('active');
    });
  });
}
function toggleFavorito(id) {
  id = String(id);
  const index = personajesFavoritos.indexOf(id);
  if (index === -1) {
    personajesFavoritos.push(id);
  } else {
    personajesFavoritos.splice(index, 1);
  }
  localStorage.setItem('favoritosSimpsons', JSON.stringify(personajesFavoritos));
}
async function obtenerPersonajePorId(id) {
  try {
    const url = `${BASE_URL}/characters/${id}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se encontró el personaje ' + id);
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}
async function mostrarFavoritos() {
  contenedorPer.innerHTML = '';
  if (!personajesFavoritos.length) {
    contenedorPer.innerHTML = '<p>No hay personajes favoritos guardados.</p>';
    return;
  }
  mensajes.textContent = 'Cargando favoritos...';
  const favoritosData = await Promise.all(personajesFavoritos.map(id => obtenerPersonajePorId(id)));
  personajesCargados = favoritosData.filter(p => p !== null);
  mostrarPersonajes();
  mensajes.textContent = '';
}
verFavs.addEventListener('click', () => {
  mostrarFavoritos();
  verFavs.style.display = 'none';
  verTodo.style.display = 'inline-block';
});
verTodo.addEventListener('click', async () => {
  mensajes.textContent = '';
  paginaActual = 1;
  textoBusqueda = '';
  busquedaBarra.value = '';
  const personajes = await obtenerPersonajes();
  personajesCargados = personajes;
  mostrarPersonajes();
  verFavs.style.display = 'inline-block';
  verTodo.style.display = 'none';
});
busquedaBarra.addEventListener('input', async (evento) => {
  textoBusqueda = evento.target.value;
  paginaActual = 1;
  mensajes.textContent = '';
  // Cuando hay texto, busca en todos los personajes
  if (textoBusqueda.trim().length > 0) {
    const personajes = await obtenerTodosLosPersonajes();
    const personajesFiltrados = filtrarPorTexto(personajes, textoBusqueda);
    personajesCargados = personajesFiltrados;
  } else {
    // Sin texto, carga personajes de la página actual normalmente
    const personajes = await obtenerPersonajes();
    personajesCargados = personajes;
  }
  mostrarPersonajes();
});
paginaAnt.addEventListener('click', async () => {
  if (paginaActual > 1) {
    paginaActual--;
    const personajes = await obtenerPersonajes();
    const personajesFiltrados = filtrarPorTexto(personajes, textoBusqueda);
    personajesCargados = personajesFiltrados;
    mostrarPersonajes();
  }
});
paginaSig.addEventListener('click', async () => {
  if (paginaActual < totalPag) {
    paginaActual++;
    const personajes = await obtenerPersonajes();
    const personajesFiltrados = filtrarPorTexto(personajes, textoBusqueda);
    personajesCargados = personajesFiltrados;
    mostrarPersonajes();
  }
});
window.onload = async () => {
  mensajes.textContent = '';
  const favsGuardados = localStorage.getItem('favoritosSimpsons');
  personajesFavoritos = favsGuardados ? JSON.parse(favsGuardados) : [];
  paginaActual = 1;
  textoBusqueda = '';
  busquedaBarra.value = '';
  const personajes = await obtenerPersonajes();
  personajesCargados = personajes;
  mostrarPersonajes();
  verFavs.style.display = 'inline-block';
  verTodo.style.display = 'none';
};