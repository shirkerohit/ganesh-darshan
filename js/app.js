// Ganpati Darshan (Mumbai) — interactive Leaflet map app.
// Pairs with js/data/mandals.js (defines window.MANDALS) and index.html.

(function () {
  'use strict';

  var mandals = window.MANDALS && window.MANDALS.length ? window.MANDALS : [];

  // ------------------------------------------------------------------
  // Local persistence (visited marks + trip stops)
  // ------------------------------------------------------------------
  var STORE_VISITED = 'gd_visited';
  var STORE_TRIP = 'gd_trip';

  function loadJson(key, fallback) {
    try {
      var v = JSON.parse(localStorage.getItem(key) || 'null');
      return v == null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }

  var visited = loadJson(STORE_VISITED, {});
  if (typeof visited !== 'object' || visited === null) visited = {};
  var trip = loadJson(STORE_TRIP, []);
  if (!Array.isArray(trip)) trip = [];

  function saveVisited() { try { localStorage.setItem(STORE_VISITED, JSON.stringify(visited)); } catch (e) {} }
  function saveTrip() { try { localStorage.setItem(STORE_TRIP, JSON.stringify(trip)); } catch (e) {} }

  function byId(id) {
    for (var i = 0; i < mandals.length; i++) if (mandals[i].id === id) return mandals[i];
    return null;
  }

  // Normalize the image field: string OR array of strings -> array.
  function imagesOf(m) {
    if (!m) return [];
    if (Array.isArray(m.image)) return m.image.filter(Boolean);
    return m.image ? [m.image] : [];
  }

  // ------------------------------------------------------------------
  // Map
  // ------------------------------------------------------------------
  var map = L.map('map', { zoomControl: false, worldCopyJump: false }).setView([19.08, 72.88], 12);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  L.control.zoom({ position: 'topright' }).addTo(map);

  map.setMinZoom(10);
  map.setMaxBounds([[18.7, 72.5], [19.5, 73.3]]);

  var markers = {};
  var icons = {};
  var latlngs = [];
  var items = {};
  var activeId = null;
  var currentMandal = null;
  var currentMode = 'driving';
  var locCircle = null;

  // ------------------------------------------------------------------
  // Escaping for user-facing strings
  // ------------------------------------------------------------------
  function esc(str) {
    return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ------------------------------------------------------------------
  // Markers (custom saffron pins, with visited check badge)
  // ------------------------------------------------------------------
  function makePinHtml(m, active, visitedFlag) {
    return '<div class="pin' + (active ? ' pin-active' : '') + '" role="button" aria-label="' + esc(m.name) + '">' +
      '<span class="pin-ring"></span>' +
      '<span class="pin-body">ॐ</span>' +
      '<span class="pin-tip"></span>' +
      (visitedFlag ? '<span class="pin-check">✓</span>' : '') +
      '</div>';
  }

  function makeIcon(m, active, visitedFlag) {
    return L.divIcon({
      className: 'pin-wrap',
      html: makePinHtml(m, active, visitedFlag),
      iconSize: [44, 50],
      iconAnchor: [22, 48],
    });
  }

  function isVisited(id) { return !!visited[id]; }

  function repaintMarkers() {
    Object.keys(markers).forEach(function (key) {
      var m = byId(Number(key));
      if (!m) return;
      markers[key].setIcon(makeIcon(m, Number(key) === activeId, isVisited(m.id)));
    });
  }

  function paintActive(id) {
    activeId = id;
    repaintMarkers();
    Object.keys(items).forEach(function (key) {
      var on = Number(key) === activeId;
      var btn = items[key];
      btn.classList.toggle('bg-saffron-50', on);
      btn.classList.toggle('border-l-saffron-600', on);
      btn.classList.toggle('ring-1', on);
      btn.classList.toggle('ring-saffron-200', on);
    });
  }

  function buildMarkers() {
    if (!mandals.length) return;
    mandals.forEach(function (m) {
      icons[m.id] = function (active, visitedFlag) { return makeIcon(m, active, visitedFlag); };
      var marker = L.marker([m.lat, m.lng], { icon: icons[m.id](false, isVisited(m.id)) }).addTo(map);
      marker.on('click', function () {
        openDetails(m.id);
        map.flyTo([m.lat, m.lng], 15, { duration: 0.8 });
      });
      markers[m.id] = marker;
      latlngs.push([m.lat, m.lng]);
    });
  }

  var activeCategory = null;

  // ------------------------------------------------------------------
  // Category chips (derived from data, shown below the search box)
  // ------------------------------------------------------------------
  function categoryCounts() {
    var counts = {};
    mandals.forEach(function (m) { counts[m.category] = (counts[m.category] || 0) + 1; });
    return Object.keys(counts)
      .map(function (k) { return { name: k, count: counts[k] }; })
      .sort(function (a, b) { return b.count - a.count || a.name.localeCompare(b.name); });
  }

  function paintChips() {
    document.querySelectorAll('#categoryChips button').forEach(function (b) {
      var isOn = b.dataset.cat === activeCategory;
      b.classList.toggle('bg-saffron-500', isOn);
      b.classList.toggle('border-saffron-600', isOn);
      b.classList.toggle('text-white', isOn);
      b.classList.toggle('shadow', isOn);
      b.classList.toggle('hover:bg-saffron-500', isOn);
      b.classList.toggle('bg-white', !isOn);
      b.classList.toggle('border-saffron-200', !isOn);
      b.classList.toggle('text-saffron-800', !isOn);
      b.classList.toggle('hover:bg-saffron-50', !isOn);
    });
  }

  function buildCategoryChips() {
    var box = document.getElementById('categoryChips');
    var cats = categoryCounts();
    if (cats.length < 2) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    box.classList.add('flex');
    box.innerHTML = '';
    cats.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.dataset.cat = c.name;
      b.className =
        'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold transition bg-white border-saffron-200 text-saffron-800 hover:bg-saffron-50';
      b.innerHTML = esc(c.name) + ' <span class="opacity-60">' + c.count + '</span>';
      b.addEventListener('click', function () {
        activeCategory = activeCategory === c.name ? null : c.name;
        paintChips();
        renderList(document.getElementById('search').value || '');
      });
      box.appendChild(b);
    });
  }

  // ------------------------------------------------------------------
  // Mandal list (searchable + category filter)
  // ------------------------------------------------------------------
  function renderList(filter) {
    var list = document.getElementById('mandalList');
    var q = (filter || '').trim().toLowerCase();
    var cat = activeCategory;
    var matched = mandals.filter(function (m) {
      var textOk = q ? (m.name + ' ' + m.area + ' ' + m.category).toLowerCase().indexOf(q) !== -1 : true;
      var catOk = !cat || m.category === cat;
      return textOk && catOk;
    });

    var status = document.getElementById('searchStatus');
    if (q && cat) {
      status.textContent = 'Showing ' + matched.length + ' of ' + mandals.length + ' · ' + cat;
    } else if (cat) {
      status.textContent = 'Showing ' + matched.length + ' of ' + mandals.length + ' · ' + cat;
    } else if (q) {
      status.textContent = 'Showing ' + matched.length + ' of ' + mandals.length + ' mandals';
    } else {
      status.textContent = 'Showing ' + mandals.length + ' of ' + mandals.length + ' mandals';
    }

    if (!matched.length && (q || cat)) {
      status.textContent = 'No mandals match' +
        (q ? ' “' + filter.trim() + '”' : '') +
        (cat ? ' in ' + cat : '') +
        '.';
      list.innerHTML =
        '<li class="px-4 py-12 text-center animate-fadeSlide">' +
        '<p class="font-deva text-4xl leading-none text-saffron-300">ॐ</p>' +
        '<p class="mt-3 text-sm font-semibold text-ink/60">No mandals found</p>' +
        '<p class="mt-1 text-xs text-ink/45">Try a different name, area or category.</p>' +
        '</li>';
      items = {};
      return;
    }
    items = {};
    list.innerHTML = '';
    matched.forEach(function (m) {
      var li = document.createElement('li');
      li.className = 'animate-fadeSlide py-0.5';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'w-full rounded-xl border-l-4 border-transparent px-3 py-2.5 text-left transition hover:bg-saffron-50 active:bg-saffron-100';
      btn.innerHTML =
        '<div class="flex items-start justify-between gap-2">' +
        '<div class="min-w-0">' +
        '<p class="truncate text-sm font-bold text-maroon-800">' + esc(m.name) + '</p>' +
        '<p class="mt-0.5 truncate text-[11px] text-ink/50">' + esc(m.area) + '</p>' +
        '</div>' +
        '<span class="shrink-0 rounded-full bg-saffron-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-saffron-800">' + esc(m.category) + '</span>' +
        '</div>' +
        '<div class="mt-1.5 flex flex-wrap items-center gap-1.5">' +
        '<span class="text-[10px] font-semibold text-ink/45">Est. ' + esc(m.established) + '</span>' +
        (m.approx
          ? '<span title="Approximate pin location" class="rounded-full bg-haldi-400/30 px-1.5 py-0.5 text-[9px] font-bold leading-none text-haldi-600 ring-1 ring-haldi-400/40">±</span>'
          : '') +
        (isVisited(m.id)
          ? '<span class="rounded-full bg-green-600 px-1.5 py-0.5 text-[9px] font-bold leading-none text-white">✓ Visited</span>'
          : '') +
        '</div>';
      btn.addEventListener('click', function () {
        openDetails(m.id);
        if (window.innerWidth < 1024) closeSidebar();
      });
      li.appendChild(btn);
      list.appendChild(li);
      items[m.id] = btn;
    });
    paintActive(activeId);
  }

  // ------------------------------------------------------------------
  // Details panel
  // ------------------------------------------------------------------
  function renderPhoto() {
    var photo = document.getElementById('detailPhoto');
    var imgs = imagesOf(currentMandal);
    updatePhotoCount();
    if (!imgs.length) { renderPhotoFallback(); return; }
    function render(i) {
      if (i >= imgs.length) { renderPhotoFallback(); return; }
      var img = new window.Image();
      img.className = 'h-full w-full object-cover';
      img.alt = currentMandal.name;
      img.loading = 'lazy';
      img.onerror = function () { render(i + 1); };
      img.src = imgs[i];
      photo.innerHTML = '';
      photo.appendChild(img);
      document.getElementById('btnPhotoExpand').classList.remove('hidden');
    }
    render(0);
  }

  function updatePhotoCount() {
    var pill = document.getElementById('detPhotoCount');
    var n = imagesOf(currentMandal).length;
    if (n > 1) {
      pill.textContent = '\u23F1 ' + n + ' photos';
      pill.classList.remove('hidden');
    } else {
      pill.classList.add('hidden');
    }
  }

  function renderPhotoFallback() {
    var photo = document.getElementById('detailPhoto');
    var name = currentMandal ? currentMandal.name : '';
    photo.innerHTML =
      '<div class="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-saffron-500 via-maroon-600 to-maroon-800">' +
      '<span class="font-deva text-6xl leading-none text-white/95" style="text-shadow:0 0 16px rgba(240,195,60,.6),0 0 42px rgba(240,195,60,.3),0 0 70px rgba(240,195,60,.2)">ॐ</span>' +
      '<span class="max-w-[90%] truncate px-2 text-xs font-semibold text-white/85">' + esc(name) + '</span>' +
      '</div>';
    document.getElementById('btnPhotoExpand').classList.add('hidden');
  }

  function directionsUrl(mode) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + currentMandal.lat + ',' + currentMandal.lng + '&travelmode=' + mode;
  }

  function syncDetailsVisited() {
    var btn = document.getElementById('btnVisited');
    var txt = document.getElementById('btnVisitedText');
    if (!currentMandal) { btn.classList.add('hidden'); return; }
    btn.classList.remove('hidden');
    var vis = isVisited(currentMandal.id);
    txt.textContent = vis ? 'Visited' : 'Mark as visited';
    btn.classList.toggle('visited-on', vis);
  }

  function openDetails(id) {
    var m = byId(id);
    if (!m) return;
    currentMandal = m;

    document.getElementById('detName').textContent = m.name;
    document.getElementById('detAreaText').textContent = m.area;
    document.getElementById('detCategory').textContent = m.category;
    document.getElementById('detEst').textContent = 'Est. ' + m.established;
    document.getElementById('detIdol').textContent = m.idol || '';
    document.getElementById('detDarshan').textContent = m.darshan || '';
    document.getElementById('detAarti').textContent = m.aarti || '';
    document.getElementById('detTips').textContent = m.tips || '';
    document.getElementById('detAddress').textContent = m.address || '';

    document.getElementById('detHistory').textContent = m.history || '';
    var hw = document.getElementById('detHistoryWrap');
    hw.classList.toggle('hidden', !(m.history && m.history.trim()));

    var hlw = document.getElementById('detHighlightsWrap');
    var hlist = document.getElementById('detHighlights');
    if (m.highlights && m.highlights.length) {
      hlist.innerHTML = m.highlights.map(function (h) {
        return '<li class="flex items-start gap-2.5 rounded-xl border border-saffron-200 bg-cream/60 p-3">' +
          '<svg class="mt-0.5 h-4 w-4 shrink-0 text-saffron-700" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3l1.7 4.6L18.5 9l-4.8 1.4L12 15l-1.7-4.6L5.5 9l4.8-1.4L12 3Zm7 11 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/></svg>' +
          '<div class="min-w-0">' +
          '<p class="text-[13px] font-bold text-maroon-800">' + esc(h.title) + '</p>' +
          '<p class="mt-0.5 text-xs leading-relaxed text-ink/70">' + esc(h.detail) + '</p>' +
          '</div>' +
          '</li>';
      }).join('');
      hlw.classList.remove('hidden');
    } else {
      hlist.innerHTML = '';
      hlw.classList.add('hidden');
    }

    var approx = document.getElementById('detApprox');
    if (m.approx) approx.classList.remove('hidden'); else approx.classList.add('hidden');

    document.getElementById('btnOpenMaps').href = 'https://www.google.com/maps?q=' + m.lat + ',' + m.lng + '&hl=en';

    renderPhoto();
    syncDetailsVisited();
    paintActive(m.id);

    closeTrip();
    document.getElementById('details').classList.add('panel--open');
    if (window.innerWidth < 1024) closeSidebar();
  }

  function closeDetails() {
    document.getElementById('details').classList.remove('panel--open');
    if (activeId) paintActive(null);
    currentMandal = null;
  }

  // ------------------------------------------------------------------
  // Lightbox (full-screen photo gallery) — navigation stays within the
  // images of the single mandal being viewed (never mixes mandals).
  // ------------------------------------------------------------------
  var gallery = [];
  mandals.forEach(function (m) {
    var imgs = imagesOf(m);
    if (imgs.length) gallery.push({ id: m.id, name: m.name, area: m.area, images: imgs });
  });
  var galleryIndex = 0;
  var photoIndex = 0;

  function lbEl(id) { return document.getElementById(id); }

  function showLightboxAt(i, p) {
    if (!gallery.length) return;
    galleryIndex = ((i % gallery.length) + gallery.length) % gallery.length;
    var g = gallery[galleryIndex];
    var total = g.images.length;
    photoIndex = ((p % total) + total) % total;
    lbEl('lbImg').src = g.images[photoIndex];
    lbEl('lbImg').alt = g.name;
    lbEl('lbCaption').textContent = g.name + ' · ' + g.area +
      (total > 1 ? ' (' + (photoIndex + 1) + '/' + total + ')' : '');
    var multi = total > 1;
    lbEl('lbPrev').classList.toggle('hidden', !multi);
    lbEl('lbNext').classList.toggle('hidden', !multi);
  }

  function lightboxNav(dir) {
    var g = gallery[galleryIndex];
    if (!g || g.images.length < 2) return;
    showLightboxAt(galleryIndex, photoIndex + dir);
  }

  function openLightbox(id) {
    if (!gallery.length) return;
    var i = gallery.findIndex(function (x) { return x.id === id; });
    if (i < 0) return;
    showLightboxAt(i, 0);
    lbEl('lightbox').classList.remove('hidden');
    lbEl('lightbox').classList.add('flex');
  }

  function closeLightbox() {
    lbEl('lightbox').classList.add('hidden');
    lbEl('lightbox').classList.remove('flex');
  }

  // ------------------------------------------------------------------
  // Sidebar + trip drawer (mobile overlay pattern)
  // ------------------------------------------------------------------
  function syncBackdrop() {
    var any =
      document.getElementById('sidebar').classList.contains('sidebar--open') ||
      document.getElementById('tripPanel').classList.contains('trip--open');
    document.getElementById('backdrop').classList.toggle('backdrop--open', any);
  }

  function openSidebar() {
    document.getElementById('sidebar').classList.add('sidebar--open');
    syncBackdrop();
  }

  function closeSidebar() {
    document.getElementById('sidebar').classList.remove('sidebar--open');
    syncBackdrop();
  }

  function openTrip() {
    closeDetails();
    document.getElementById('tripPanel').classList.add('trip--open');
    syncBackdrop();
  }

  function closeTrip() {
    document.getElementById('tripPanel').classList.remove('trip--open');
    syncBackdrop();
  }

  // ------------------------------------------------------------------
  // Trip planner
  // ------------------------------------------------------------------
  function inTrip(id) { return trip.indexOf(id) !== -1; }

  function renderTripBadge() {
    var badge = document.getElementById('tripBadge');
    badge.textContent = trip.length;
    badge.classList.toggle('hidden', trip.length === 0);
  }

  function renderTripProgress() {
    var visCount = mandals.filter(function (m) { return isVisited(m.id); }).length;
    document.getElementById('tripVisitedCount').textContent = visCount + ' / ' + mandals.length + ' visited';
    document.getElementById('tripProgressBar').style.width =
      mandals.length ? Math.round((visCount / mandals.length) * 100) + '%' : '0%';
  }

  function renderTripList() {
    var list = document.getElementById('tripList');
    var count = document.getElementById('tripCount');
    var empty = document.getElementById('tripEmpty');
    count.textContent = trip.length;
    empty.classList.toggle('hidden', trip.length > 0);
    list.innerHTML = '';
    trip.forEach(function (id, idx) {
      var m = byId(id);
      if (!m) return;
      var vis = isVisited(id);
      var li = document.createElement('li');
      li.className = 'animate-fadeSlide';
      li.innerHTML =
        '<div class="flex items-center gap-2 rounded-xl border border-saffron-200 bg-white p-2.5">' +
        '<button type="button" data-vis="' + id + '" title="' + (vis ? 'Visited' : 'Mark visited') + '" class="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition ' +
          (vis ? 'border-green-600 bg-green-600 text-white' : 'border-saffron-300 bg-white text-transparent hover:border-saffron-400') + '">✓</button>' +
        '<div class="min-w-0 flex-1">' +
        '<p class="truncate text-[13px] font-bold text-maroon-800">' + esc(m.name) + '</p>' +
        '<p class="truncate text-[10px] text-ink/45">' + esc(m.area) + ' · Est. ' + m.established + '</p>' +
        '</div>' +
        '<div class="flex shrink-0 flex-col gap-0.5">' +
        '<button type="button" data-move="' + id + '" data-dir="-1" title="Move up" class="grid h-6 w-6 place-items-center rounded-md text-ink/50 transition hover:bg-saffron-100">▲</button>' +
        '<button type="button" data-move="' + id + '" data-dir="1" title="Move down" class="grid h-6 w-6 place-items-center rounded-md text-ink/50 transition hover:bg-saffron-100">▼</button>' +
        '</div>' +
        '<button type="button" data-remove="' + id + '" title="Remove" class="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink/45 transition hover:bg-red-50 hover:text-red-600">✕</button>' +
        '</div>';
      list.appendChild(li);
    });
  }

  function renderPicker(filter) {
    var list = document.getElementById('tripPicker');
    var q = (filter || '').trim().toLowerCase();
    var html = '';
    mandals.forEach(function (m) {
      if (q && (m.name + ' ' + m.area + ' ' + m.category).toLowerCase().indexOf(q) === -1) return;
      var added = inTrip(m.id);
      html +=
        '<li class="flex items-center gap-2 rounded-xl border bg-white p-2 transition hover:bg-saffron-50/50 ' +
        (added ? 'border-saffron-200' : 'border-saffron-100') + '">' +
        '<div class="min-w-0 flex-1">' +
        '<p class="truncate text-[13px] font-semibold text-ink/85">' + esc(m.name) + '</p>' +
        '<p class="truncate text-[10px] text-ink/45">' + esc(m.area) + '</p>' +
        '</div>' +
        (added
          ? '<span class="shrink-0 rounded-full bg-saffron-100 px-2 py-1 text-[10px] font-bold text-saffron-700">Added ✓</span>'
          : '<button type="button" data-add="' + m.id + '" class="shrink-0 rounded-full bg-saffron-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm transition hover:bg-saffron-600 active:scale-95">+ Add</button>') +
        '</li>';
    });
    if (!html) html = '<li class="px-2 py-6 text-center text-xs font-medium text-ink/40">No mandals match</li>';
    list.innerHTML = html;
  }

  function addToTrip(id) {
    if (inTrip(id)) return;
    trip.push(id);
    saveTrip();
    renderTripList();
    renderPicker(document.getElementById('tripSearch').value);
    renderTripBadge();
  }

  function removeFromTrip(id) {
    trip = trip.filter(function (x) { return x !== id; });
    saveTrip();
    renderTripList();
    renderPicker(document.getElementById('tripSearch').value);
    renderTripBadge();
  }

  function moveTrip(id, dir) {
    var i = trip.indexOf(id);
    var j = i + dir;
    if (i < 0 || j < 0 || j >= trip.length) return;
    var t = trip[i];
    trip[i] = trip[j];
    trip[j] = t;
    saveTrip();
    renderTripList();
  }

  function toggleVisited(id) {
    var was = isVisited(id);
    if (was) delete visited[id]; else visited[id] = true;
    saveVisited();
    repaintMarkers();
    renderList(document.getElementById('search').value || '');
    renderTripList();
    renderTripProgress();
    syncDetailsVisited();
    if (!was) toast('Marked as visited — ' + (byId(id) ? byId(id).name : ''));
  }

  function tripRouteUrl() {
    var stops = trip.map(byId).filter(function (m) {
      return m && Number.isFinite(m.lat) && Number.isFinite(m.lng);
    });
    if (!stops.length) return null;
    if (stops.length === 1) {
      return 'https://www.google.com/maps/dir/?api=1&destination=' + stops[0].lat + ',' + stops[0].lng + '&travelmode=' + currentMode;
    }
    var ordered = stops.slice(0, 9);
    var dest = ordered[ordered.length - 1];
    var wps = ordered.slice(0, -1).map(function (s) { return s.lat + ',' + s.lng; }).join('|');
    return 'https://www.google.com/maps/dir/?api=1&destination=' + dest.lat + ',' + dest.lng +
      '&waypoints=' + encodeURIComponent(wps) + '&travelmode=' + currentMode;
  }

  // ------------------------------------------------------------------
  // Toast
  // ------------------------------------------------------------------
  function toast(msg) {
    var old = document.querySelector('.toast');
    if (old) old.remove();
    var el = document.createElement('div');
    el.className =
      'toast fixed bottom-6 z-[1400] rounded-xl bg-gradient-to-r from-saffron-500 to-maroon-700 px-4 py-3 text-sm font-semibold text-white shadow-soft transition-opacity duration-300';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () {
      el.classList.add('opacity-0');
      setTimeout(function () { el.remove(); }, 350);
    }, 3000);
  }

  function clearToast() {
    var old = document.querySelector('.toast');
    if (old) old.remove();
  }

  // ------------------------------------------------------------------
  // Wiring
  // ------------------------------------------------------------------
  document.getElementById('search').addEventListener('input', function () {
    renderList(this.value);
  });

  document.getElementById('btnList').addEventListener('click', openSidebar);
  document.getElementById('btnListClose').addEventListener('click', closeSidebar);
  document.getElementById('backdrop').addEventListener('click', function () {
    closeSidebar();
    closeTrip();
  });

  document.getElementById('btnTrip').addEventListener('click', openTrip);
  document.getElementById('btnTripClose').addEventListener('click', closeTrip);

  document.getElementById('tripSearch').addEventListener('input', function () {
    renderPicker(this.value);
  });

  document.getElementById('tripPicker').addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]');
    if (b) addToTrip(Number(b.dataset.add));
  });

  document.getElementById('tripList').addEventListener('click', function (e) {
    var t = e.target.closest('[data-vis]');
    if (t) { toggleVisited(Number(t.dataset.vis)); return; }
    t = e.target.closest('[data-remove]');
    if (t) { removeFromTrip(Number(t.dataset.remove)); return; }
    t = e.target.closest('[data-move]');
    if (t) { moveTrip(Number(t.dataset.move), Number(t.dataset.dir)); }
  });

  document.getElementById('btnTripRoute').addEventListener('click', function () {
    var url = tripRouteUrl();
    if (!url) { toast('Add at least one mandal to plan a route.'); return; }
    if (trip.length > 9) toast('Google Maps route capped to 9 stops.');
    window.open(url, '_blank', 'noopener');
  });

  document.getElementById('btnShare').addEventListener('click', function () {
    var shareUrl = 'https://shirkerohit.github.io/ganapati-darshan/';
    var shareData = {
      title: 'Ganpati Darshan \u2014 Mumbai Ganesh Mandal Guide',
      text: 'Top 38+ Ganesh mandals of Mumbai with darshan timings, aarti schedules & directions. Ganpati Bappa Morya!',
      url: shareUrl,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(function (e) {
        if (!e || e.name !== 'AbortError') copyShareLink(shareUrl);
      });
      return;
    }
    copyShareLink(shareUrl);
  });

  function copyShareLink(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        toast('Link copied \u2014 paste it anywhere!');
      }).catch(function () {
        legacyCopyShare(url);
      });
    } else {
      legacyCopyShare(url);
    }
  }

  function legacyCopyShare(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast('Link copied \u2014 paste it anywhere!');
    } catch (e) {
      window.prompt('Copy the Ganpati Darshan link:', text);
    }
    document.body.removeChild(ta);
  }

  document.getElementById('btnTripClear').addEventListener('click', function () {
    trip = [];
    saveTrip();
    renderTripList();
    renderPicker(document.getElementById('tripSearch').value);
    renderTripBadge();
    toast('Trip cleared.');
  });

  document.getElementById('btnDetClose').addEventListener('click', closeDetails);

  document.getElementById('btnPhotoExpand').addEventListener('click', function (e) {
    e.stopPropagation();
    if (imagesOf(currentMandal).length) openLightbox(currentMandal.id);
  });

  document.getElementById('detailPhoto').addEventListener('click', function () {
    if (imagesOf(currentMandal).length) openLightbox(currentMandal.id);
  });

  document.getElementById('btnVisited').addEventListener('click', function () {
    if (currentMandal) toggleVisited(currentMandal.id);
  });

  lbEl('lbClose').addEventListener('click', closeLightbox);
  lbEl('lbPrev').addEventListener('click', function () { lightboxNav(-1); });
  lbEl('lbNext').addEventListener('click', function () { lightboxNav(1); });
  lbEl('lightbox').addEventListener('click', function (e) {
    if (e.target === this) closeLightbox();
  });

  document.getElementById('btnDirections').addEventListener('click', function () {
    if (!currentMandal) return;
    window.open(directionsUrl(currentMode), '_blank', 'noopener');
  });

  document.querySelectorAll('#modeToggle .mode-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      currentMode = btn.dataset.mode;
      document.querySelectorAll('#modeToggle .mode-btn').forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('mode-active', on);
        b.classList.toggle('bg-saffron-500', on);
        b.classList.toggle('text-white', on);
        b.classList.toggle('shadow', on);
        b.classList.toggle('text-ink/60', !on);
      });
    });
  });
  document.querySelector('#modeToggle .mode-btn[data-mode="driving"]').click();

  document.getElementById('btnFit').addEventListener('click', function () {
    if (latlngs.length) map.fitBounds(latlngs, { padding: [40, 40] });
  });

  document.getElementById('btnLocate').addEventListener('click', function () {
    if (!(navigator.geolocation && navigator.geolocation.getCurrentPosition)) {
      toast('Location unavailable — check browser permission.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        if (locCircle) map.removeLayer(locCircle);
        locCircle = L.circle([lat, lng], {
          radius: 80,
          color: '#fd7e14',
          fillColor: '#fd7e14',
          fillOpacity: 0.35,
          weight: 1.5,
        }).addTo(map);
        map.flyTo([lat, lng], 15);
      },
      function () {
        toast('Location unavailable — check browser permission.');
      }
    );
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (lbEl('lightbox').classList.contains('flex')) { closeLightbox(); return; }
      closeDetails();
      closeSidebar();
      closeTrip();
      clearToast();
      return;
    }
    if (e.key === 'ArrowLeft' && lbEl('lightbox').classList.contains('flex')) {
      lightboxNav(-1);
    }
    if (e.key === 'ArrowRight' && lbEl('lightbox').classList.contains('flex')) {
      lightboxNav(1);
    }
  });

  // ------------------------------------------------------------------
  // Init
  // ------------------------------------------------------------------
  buildMarkers();
  repaintMarkers();
  document.getElementById('countPill').textContent = mandals.length + ' mandals';
  buildCategoryChips();
  renderList('');
  renderTripBadge();
  renderTripProgress();
  renderTripList();
  renderPicker('');
  syncDetailsVisited();
  if (!mandals.length) toast('No mandal data found');
})();