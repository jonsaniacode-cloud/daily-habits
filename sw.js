// Service worker de la PWA "Rutina de Hoy".
// Sube CACHE_VERSION cada vez que edites HORARIO.html (u otro archivo listado
// abajo) para que los teléfonos que ya instalaron la app cojan la versión nueva.
const CACHE_VERSION = "coach-rutina-v32";
const CORE_ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function(cache){
      return cache.addAll(CORE_ASSETS);
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_VERSION; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(event){
  var req = event.request;
  if(req.method !== "GET") return;

  // Navegación (abrir la app): red primero, para coger cambios si hay conexión;
  // si falla (sin cobertura), cae al HTML cacheado.
  if(req.mode === "navigate"){
    event.respondWith(
      fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function(c){ c.put("./index.html", copy); });
        return res;
      }).catch(function(){
        return caches.match("./index.html");
      })
    );
    return;
  }

  // Resto de peticiones (iconos, manifest, fuentes de Google Fonts): caché
  // primero, y si no está, se pide a la red y se guarda para la próxima vez.
  event.respondWith(
    caches.match(req).then(function(cached){
      if(cached) return cached;
      return fetch(req).then(function(res){
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function(c){ c.put(req, copy); });
        return res;
      }).catch(function(){
        return cached; // undefined si tampoco había nada en caché
      });
    })
  );
});
