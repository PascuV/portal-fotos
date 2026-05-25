let allPhotos = [];
let carouselPhotos = [];
let currentIndex = 0;
let carouselInterval = null;

async function loadData() {
  const gallery = document.getElementById('gallery');
  const emptyMsg = document.getElementById('empty-msg');
  const lastStrip = document.getElementById('last-photos-strip');

  try {
    const res = await fetch('/api/photos');
    const photos = await res.json();

    allPhotos = photos || [];

    if (allPhotos.length === 0) {
      emptyMsg.style.display = 'block';
      return;
    }

    // 1) Galería completa (pestaña "Todas las fotos")
    gallery.innerHTML = allPhotos.map(photo => `
      <div class="photo-card">
        <img src="${photo.url}" alt="Foto">
        <a href="${photo.url}" download class="download-btn">Descargar</a>
      </div>
    `).join('');

    // 2) Tira de últimas fotos en la sección Espejo
    const last = [...allPhotos]
      .sort((a, b) => new Date(b.uploaded) - new Date(a.uploaded))
      .slice(0, 10);

    lastStrip.innerHTML = last.map(p => `
      <div class="last-photo-item">
        <img src="${p.url}" alt="Foto reciente">
      </div>
    `).join('');

    // 3) Carrusel dentro del marco-espejo
    setupCarousel(allPhotos);
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

  // Mezclar aleatoriamente y tomar hasta 12
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

  prevBtn.addEventListener('click', () => {
    prev();
    restartAutoSlide();
  });

  nextBtn.addEventListener('click', () => {
    next();
    restartAutoSlide();
  });

  function startAutoSlide() {
    if (carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(next, 5000); // cada 5s
  }

  function restartAutoSlide() {
    startAutoSlide();
  }

  // Iniciar
  showCurrent();
  startAutoSlide();
}

function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const homeSection = document.getElementById('home-section');
  const allSection = document.getElementById('all-section');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.tab;
      if (target === 'home') {
        homeSection.classList.remove('hidden');
        allSection.classList.add('hidden');
      } else {
        homeSection.classList.add('hidden');
        allSection.classList.remove('hidden');
      }
    });
  });
}

// Inicializar
setupTabs();
loadData();
