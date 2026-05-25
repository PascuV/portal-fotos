let allPhotos = [];
let carouselPhotos = [];
let currentIndex = 0;
let carouselInterval = null;

let adminUnlocked = false;
const ADMIN_PASSWORD = 'escalon2026';

async function loadData() {
  const gallery = document.getElementById('gallery');
  const emptyMsg = document.getElementById('empty-msg');
  const lastStrip = document.getElementById('last-photos-strip');

  try {
    const res = await fetch('/api/photos');
    const photos = await res.json();

    allPhotos = photos || [];

    // Galería "Todas las fotos"
    if (!allPhotos.length) {
      emptyMsg.style.display = 'block';
      gallery.innerHTML = '';
    } else {
      emptyMsg.style.display = 'none';
      gallery.innerHTML = allPhotos.map(photo => `
        <div class="photo-card">
          <img src="${photo.url}" alt="Foto">
          <a href="${photo.url}" download class="download-btn">Descargar</a>
        </div>
      `).join('');
    }

    // Tira últimas fotos (máx 10)
    if (lastStrip) {
      const last = [...allPhotos]
        .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded))
        .slice(0, 10);

      lastStrip.innerHTML = last.map(p => `
        <div class="last-photo-item">
          <img src="${p.url}" alt="Foto reciente">
        </div>
      `).join('');
    }

    // Carrusel / Espejo
    setupCarousel(allPhotos);

    // Si ya está desbloqueado el admin, refrescar su galería
    if (adminUnlocked) {
      renderAdminGallery();
    }
  } catch (err) {
    console.error(err);
    gallery.innerHTML = '<p class="error">Error cargando las fotos</p>';
  }
}

function setupCarousel(photos) {
  const imgEl = document.getElementById('carousel-image');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');

  if (!imgEl || !photos || photos.length === 0) return;

  const shuffled = [...photos].sort(() => Math.random() - 0.5);
  carouselPhotos = shuffled.slice(0, Math.min(12, shuffled.length));
  currentIndex = 0;

  function showCurrent() {
    const photo = carouselPhotos[currentIndex];
    imgEl.src = photo.url;
  }

  function next() {
    currentIndex = (currentIndex + 1) % carouselPhotos.length;
    showCurrent();
  }

  function prev() {
    currentIndex = (currentIndex - 1 + carouselPhotos.length) % carouselPhotos.length;
    showCurrent();
  }

  if (prevBtn && nextBtn) {
    prevBtn.onclick = () => {
      prev();
      restartAutoSlide();
    };
    nextBtn.onclick = () => {
      next();
      restartAutoSlide();
    };
  }

  function startAutoSlide() {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(next, 5000);
  }

  function restartAutoSlide() {
    startAutoSlide();
  }

  showCurrent();
  startAutoSlide();
}

function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const homeSection = document.getElementById('home-section');
  const allSection = document.getElementById('all-section');
  const adminSection = document.getElementById('admin-section');
  const adminHeaderLink = document.getElementById('admin-header-link');

  // Pestañas Espejo / Todas las fotos
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.tab;
      if (target === 'home') {
        homeSection.classList.remove('hidden');
        allSection.classList.add('hidden');
        adminSection.classList.add('hidden');
      } else if (target === 'all') {
        homeSection.classList.add('hidden');
        allSection.classList.remove('hidden');
        adminSection.classList.add('hidden');
      }
    });
  });

  // Botón "Administrar" del header
  if (adminHeaderLink) {
    adminHeaderLink.addEventListener('click', () => {
      // Quitar el activo de las pestañas porque estamos en vista "especial"
      tabs.forEach(t => t.classList.remove('active'));

      homeSection.classList.add('hidden');
      allSection.classList.add('hidden');
      adminSection.classList.remove('hidden');
    });
  }
}


/* ADMINISTRACIÓN */

function setupAdmin() {
  const passInput = document.getElementById('admin-password');
  const loginBtn = document.getElementById('admin-login-btn');
  const loginMsg = document.getElementById('admin-login-msg');
  const adminContent = document.getElementById('admin-content');

  if (!passInput || !loginBtn || !loginMsg || !adminContent) return;

  loginBtn.addEventListener('click', () => {
    const val = passInput.value.trim();
    if (!val) {
      loginMsg.textContent = 'Introduce la contraseña.';
      loginMsg.classList.remove('ok');
      loginMsg.classList.add('error');
      return;
    }

    if (val === ADMIN_PASSWORD) {
      adminUnlocked = true;
      loginMsg.textContent = 'Acceso permitido.';
      loginMsg.classList.remove('error');
      loginMsg.classList.add('ok');
      adminContent.classList.remove('hidden');
      renderAdminGallery();
    } else {
      adminUnlocked = false;
      adminContent.classList.add('hidden');
      loginMsg.textContent = 'Contraseña incorrecta.';
      loginMsg.classList.remove('ok');
      loginMsg.classList.add('error');
    }
  });
}

function renderAdminGallery() {
  const adminGallery = document.getElementById('admin-gallery');
  const adminEmptyMsg = document.getElementById('admin-empty-msg');
  const passInput = document.getElementById('admin-password');

  if (!adminGallery || !adminEmptyMsg) return;

  if (!allPhotos.length) {
    adminEmptyMsg.style.display = 'block';
    adminGallery.innerHTML = '';
    return;
  }

  adminEmptyMsg.style.display = 'none';

  adminGallery.innerHTML = allPhotos.map(photo => {
  // Por si el backend no mandara filename, lo sacamos de la URL
  const fname = photo.filename || (photo.url ? photo.url.split('/').pop() : '');
  return `
    <div class="photo-card admin-photo-card" data-filename="${fname}">
      <button class="admin-delete-btn" type="button">Eliminar</button>
      <img src="${photo.url}" alt="Foto">
      <a href="${photo.url}" download class="download-btn">Descargar</a>
    </div>
  `;
}).join('');

  adminGallery.querySelectorAll('.admin-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const card = e.target.closest('.admin-photo-card');
      const filename = card.getAttribute('data-filename');
      const password = passInput.value.trim();

      if (!password || password !== ADMIN_PASSWORD) {
        alert('Contraseña de administración no válida.');
        return;
      }

      const confirmDelete = confirm('¿Seguro que quieres eliminar esta foto? Esta acción no se puede deshacer.');
      if (!confirmDelete) return;

      try {
        const resp = await fetch('/api/photos/' + encodeURIComponent(filename) + '?key=' + encodeURIComponent(password), {
          method: 'DELETE'
        });
        const data = await resp.json();

        if (!resp.ok || !data.success) {
          alert('Error al borrar la foto: ' + (data.error || 'desconocido'));
          return;
        }

        // Eliminar del array local
        allPhotos = allPhotos.filter(p => p.filename !== filename);
        // Volver a renderizar todo lo que depende de allPhotos
        renderAdminGallery();
        loadData(); // refresca galería y carrusel
      } catch (err) {
        console.error(err);
        alert('Error al comunicar con el servidor.');
      }
    });
  });
}

/* INIT */

setupTabs();
setupAdmin();
loadData();
