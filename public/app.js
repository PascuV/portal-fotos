let carouselPhotos = [];
let currentIndex = 0;
let carouselInterval = null;

async function loadData() {
  const gallery = document.getElementById('gallery');
  const emptyMsg = document.getElementById('empty-msg');

  try {
    const res = await fetch('/api/photos');
    const photos = await res.json();

    if (!photos || photos.length === 0) {
      emptyMsg.style.display = 'block';
      return;
    }

    // Galería completa
    gallery.innerHTML = photos.map(photo => `
      <div class="photo-card">
        <img src="${photo.url}" alt="Foto" loading="lazy">
        <a href="${photo.url}" download class="download-btn">⬇ Descargar</a>
      </div>
    `).join('');

    // Carrusel
    setupCarousel(photos);
  } catch (err) {
    console.error(err);
    gallery.innerHTML = '<p class="error">Error cargando las fotos</p>';
  }
}

function setupCarousel(photos) {
  const imgEl = document.getElementById('carousel-image');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');

  if (!imgEl || photos.length === 0) return;

  // Mezclar aleatoriamente y tomar hasta 10
  const shuffled = [...photos].sort(() => Math.random() - 0.5);
  carouselPhotos = shuffled.slice(0, Math.min(10, shuffled.length));
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

loadData();
