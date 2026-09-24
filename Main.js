// ==========================================================================
//  PRÁCTICA 03 — PLANTAS 3D
//  Jardín otoñal con seis crisantemos en tonos de la especie
//  Ricardo Melgoza y Rebeca Arciga
// ==========================================================================

// --------------------------------------------------------------------------
// 1. ESCENA
// --------------------------------------------------------------------------
const escena = new THREE.Scene();
escena.background = new THREE.Color(0x241a12);
escena.fog = new THREE.Fog(0x241a12, 16, 38);

// --------------------------------------------------------------------------
// 2. CÁMARA
// --------------------------------------------------------------------------
const camara = new THREE.PerspectiveCamera(
    50, window.innerWidth / window.innerHeight, 0.1, 120
);

const CAMARA_INICIAL = new THREE.Vector3(1.2, 3.9, 9.2);
const OBJETIVO_INICIAL = new THREE.Vector3(0, 1.75, 0);
camara.position.copy(CAMARA_INICIAL);

// --------------------------------------------------------------------------
// 3. RENDERER
// --------------------------------------------------------------------------
const lienzo = document.getElementById('lienzo');

const renderizador = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true });
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.shadowMap.enabled = true;
renderizador.shadowMap.type = THREE.PCFSoftShadowMap;

// --------------------------------------------------------------------------
// 4. CONTROLES ORBITCONTROLS
// --------------------------------------------------------------------------
const controles = new THREE.OrbitControls(camara, renderizador.domElement);
controles.enableDamping = true;
controles.dampingFactor = 0.07;
controles.minDistance = 3;
controles.maxDistance = 26;
controles.maxPolarAngle = Math.PI / 2 - 0.02;   // no bajar del nivel del suelo
controles.target.copy(OBJETIVO_INICIAL);

// --------------------------------------------------------------------------
// 5. ILUMINACIÓN (luz cálida de tarde de otoño)
// --------------------------------------------------------------------------
const luzAmbiental = new THREE.AmbientLight(0xffd9b0, 0.45);
escena.add(luzAmbiental);

const luzSol = new THREE.DirectionalLight(0xffb870, 1.0);
luzSol.position.set(6, 9, 5);
luzSol.castShadow = true;
luzSol.shadow.mapSize.set(2048, 2048);
luzSol.shadow.camera.left = -10;
luzSol.shadow.camera.right = 10;
luzSol.shadow.camera.top = 10;
luzSol.shadow.camera.bottom = -10;
escena.add(luzSol);

const luzRelleno = new THREE.PointLight(0xff8a3d, 0.35, 28);
luzRelleno.position.set(-6, 3, -4);
escena.add(luzRelleno);

// Intensidades base para que el deslizador las multiplique
const BASE_AMBIENTAL = 0.45;
const BASE_SOL = 1.0;
const BASE_RELLENO = 0.35;

// --------------------------------------------------------------------------
// 6. MATERIALES Y GEOMETRÍAS COMPARTIDAS
//    Las seis plantas reutilizan las mismas geometrías: se crean una sola vez
//    y se comparten, así seis crisantemos no cuestan seis veces la memoria.
// --------------------------------------------------------------------------
const matSuelo     = new THREE.MeshStandardMaterial({ color: 0x4a3220, roughness: 1.0 });
const matHojarasca = new THREE.MeshStandardMaterial({ color: 0x8a4a1c, roughness: 0.95, side: THREE.DoubleSide });
const matTierra    = new THREE.MeshStandardMaterial({ color: 0x3d2b1c, roughness: 1.0 });
const matTallo     = new THREE.MeshStandardMaterial({ color: 0x5c7a3a, roughness: 0.8 });

const GEO = {
    hojarasca: new THREE.CircleGeometry(0.15, 8),
    maceta:    new THREE.CylinderGeometry(0.85, 0.62, 1.2, 24),
    borde:     new THREE.TorusGeometry(0.85, 0.075, 8, 28),
    tierra:    new THREE.CylinderGeometry(0.8, 0.8, 0.12, 24),
    hoja:      new THREE.SphereGeometry(0.22, 12, 8),
    centroFlor: new THREE.SphereGeometry(0.12, 14, 10),
    petaloExt: new THREE.SphereGeometry(0.1, 8, 6),
    petaloInt: new THREE.SphereGeometry(0.09, 8, 6)
};

// El tallo y las ramas sí se crean por planta porque cambian de largo,
// pero se cachean por medida para no duplicar geometrías iguales.
const cacheTallos = {};

function geoCilindro(rArriba, rAbajo, alto) {
    const clave = rArriba + '|' + rAbajo + '|' + alto;
    if (!cacheTallos[clave]) {
        cacheTallos[clave] = new THREE.CylinderGeometry(rArriba, rAbajo, alto, 10);
    }
    return cacheTallos[clave];
}

// --------------------------------------------------------------------------
// 7. HOJAS: cada una con su material propio
//    Comparten el color, pero no la instancia del material. Así el resaltado
//    de selección ilumina una sola hoja y no todas a la vez.
// --------------------------------------------------------------------------
const COLOR_HOJA_BASE = 0x7f9a3c;
const materialesHoja = [];
const hojas = [];   // para los botones de color y de visibilidad

function crearMaterialHoja() {
    const material = new THREE.MeshStandardMaterial({
        color: COLOR_HOJA_BASE, roughness: 0.7
    });
    materialesHoja.push(material);
    return material;
}

// --------------------------------------------------------------------------
// 8. REGISTRO DE PARTES SELECCIONABLES
// --------------------------------------------------------------------------
const seleccionables = [];

function registrar(malla, nombre, geometria, funcion) {
    malla.userData = { nombre: nombre, geometria: geometria, funcion: funcion };
    malla.castShadow = true;
    seleccionables.push(malla);
    return malla;
}

// --------------------------------------------------------------------------
// 9. SUELO DEL JARDÍN
// --------------------------------------------------------------------------
const suelo = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), matSuelo);
suelo.rotation.x = -Math.PI / 2;
suelo.receiveShadow = true;
escena.add(suelo);
registrar(suelo, 'Suelo del jardín', 'PlaneGeometry',
    'Plano que sostiene las macetas y recibe las sombras. Marca la altura cero desde la que se miden las demás partes.');
suelo.castShadow = false;

// Hojarasca esparcida por el suelo (decoración, no seleccionable)
for (let i = 0; i < 46; i++) {
    const hojita = new THREE.Mesh(GEO.hojarasca, matHojarasca);
    const angulo = Math.random() * Math.PI * 2;
    const radio = 2.2 + Math.random() * 7.5;
    hojita.position.set(Math.cos(angulo) * radio, 0.01, Math.sin(angulo) * radio);
    hojita.rotation.x = -Math.PI / 2;
    hojita.rotation.z = Math.random() * Math.PI;
    hojita.scale.setScalar(0.7 + Math.random() * 0.8);
    escena.add(hojita);
}

// --------------------------------------------------------------------------
// 10. VARIEDADES DE CRISANTEMO
//     Seis tonos reales del cultivo: el crisantemo se da en naranjas, amarillos,
//     borgoñas, blancos, rosas y bronces. El disco central siempre tira a
//     amarillo porque ahí están las flores fértiles.
// --------------------------------------------------------------------------
const VARIEDADES = [
    { nombre: 'Naranja otoñal', ext: 0xe0651a, int: 0xff8c2b, centro: 0xf6c453, maceta: 0xb4623a },
    { nombre: 'Amarillo dorado', ext: 0xd9a018, int: 0xf5c542, centro: 0xfff0b0, maceta: 0xa9613d },
    { nombre: 'Borgoña',         ext: 0x7d1f2a, int: 0xa83244, centro: 0xd99a4e, maceta: 0xb96b42 },
    { nombre: 'Blanco crema',    ext: 0xdcd6c4, int: 0xf5f1e6, centro: 0xe0b34a, maceta: 0xa55c36 },
    { nombre: 'Rosa malva',      ext: 0xa8527c, int: 0xd98ab0, centro: 0xf2d06b, maceta: 0xc07048 },
    { nombre: 'Bronce',          ext: 0x9c5320, int: 0xc87a2e, centro: 0xe8b45a, maceta: 0xae5f38 }
];

// --------------------------------------------------------------------------
// 11. FÁBRICA DE CRISANTEMOS
//     Construye una maceta con su planta completa y devuelve las referencias
//     que la animación necesita. Toda la jerarquía se arma aquí dentro.
// --------------------------------------------------------------------------
const ALTURA_TALLO = 2.0;

const DEF_RAMAS = [
    { altura: 0.75, giro: 0.0, largo: 0.85, inclinacion: -1.00, flor: 0.80 },
    { altura: 1.15, giro: 2.1, largo: 0.72, inclinacion: -0.85, flor: 0.00 },
    { altura: 1.55, giro: 4.2, largo: 0.80, inclinacion: -0.95, flor: 0.70 }
];

function crearCrisantemo(cfg) {
    const v = VARIEDADES[cfg.variedad];
    const etiqueta = ' — var. ' + v.nombre;

    // Materiales propios de esta variedad
    const matMaceta  = new THREE.MeshStandardMaterial({ color: v.maceta, roughness: 0.8, metalness: 0.05 });
    const matBorde   = new THREE.MeshStandardMaterial({ color: new THREE.Color(v.maceta).multiplyScalar(0.82), roughness: 0.75 });
    const matPetaloE = new THREE.MeshStandardMaterial({ color: v.ext, roughness: 0.6 });
    const matPetaloI = new THREE.MeshStandardMaterial({ color: v.int, roughness: 0.55 });
    const matCentro  = new THREE.MeshStandardMaterial({ color: v.centro, roughness: 0.5 });

    // ---- Maceta: es el objeto padre de toda la jerarquía ----
    const maceta = new THREE.Group();
    maceta.position.set(cfg.x, 0, cfg.z);
    maceta.rotation.y = cfg.giro;
    maceta.scale.setScalar(cfg.escala);
    escena.add(maceta);

    const cuerpo = new THREE.Mesh(GEO.maceta, matMaceta);
    cuerpo.position.y = 0.6;
    cuerpo.receiveShadow = true;
    maceta.add(cuerpo);
    registrar(cuerpo, 'Maceta' + etiqueta, 'CylinderGeometry',
        'Contiene el sustrato y sostiene toda la planta. Es el objeto padre de la jerarquía.');

    const borde = new THREE.Mesh(GEO.borde, matBorde);
    borde.position.y = 1.2;
    borde.rotation.x = Math.PI / 2;
    maceta.add(borde);
    registrar(borde, 'Borde de la maceta' + etiqueta, 'TorusGeometry',
        'Refuerza el filo superior de la maceta y evita que el sustrato se derrame al regar.');

    const tierra = new THREE.Mesh(GEO.tierra, matTierra);
    tierra.position.y = 1.16;
    tierra.receiveShadow = true;
    maceta.add(tierra);
    registrar(tierra, 'Sustrato' + etiqueta, 'CylinderGeometry',
        'Mezcla de tierra donde se anclan las raíces; retiene el agua y los nutrientes del crisantemo.');

    // ---- La planta cuelga de la maceta ----
    const planta = new THREE.Group();
    planta.position.y = 1.22;
    maceta.add(planta);

    const tallo = new THREE.Mesh(geoCilindro(0.06, 0.095, ALTURA_TALLO), matTallo);
    tallo.position.y = ALTURA_TALLO / 2;
    planta.add(tallo);
    registrar(tallo, 'Tallo principal' + etiqueta, 'CylinderGeometry',
        'Eje central de la planta. Transporta agua y savia desde el sustrato hasta las hojas y las flores.');

    // ---- Auxiliares ----
    function crearHoja(escala) {
        const hoja = new THREE.Mesh(GEO.hoja, crearMaterialHoja());
        hoja.scale.set(1.0 * escala, 0.28 * escala, 0.62 * escala);
        hojas.push(hoja);
        registrar(hoja, 'Hoja' + etiqueta, 'SphereGeometry (achatada)',
            'Capta la luz del sol y realiza la fotosíntesis. En el crisantemo es lobulada y de borde dentado.');
        return hoja;
    }

    function crearFlor(escala) {
        const flor = new THREE.Group();

        const centro = new THREE.Mesh(GEO.centroFlor, matCentro);
        flor.add(centro);
        registrar(centro, 'Centro de la flor' + etiqueta, 'SphereGeometry',
            'Disco central del capítulo. Agrupa las flores fértiles diminutas que producen el polen y la semilla.');

        // Anillo exterior: pétalos largos y caídos
        const N_EXT = 12;
        for (let i = 0; i < N_EXT; i++) {
            const petalo = new THREE.Mesh(GEO.petaloExt, matPetaloE);
            petalo.scale.set(0.45, 0.28, 2.5);

            const pivote = new THREE.Group();
            pivote.rotation.y = (i / N_EXT) * Math.PI * 2;
            pivote.rotation.x = 0.55;
            petalo.position.z = 0.26;
            pivote.add(petalo);
            flor.add(pivote);

            registrar(petalo, 'Pétalo exterior' + etiqueta, 'SphereGeometry (alargada)',
                'Pétalo del anillo externo. Se abre hacia afuera y hacia abajo; es el que da el volumen al crisantemo.');
        }

        // Anillo interior: pétalos más cortos y erguidos
        const N_INT = 8;
        for (let i = 0; i < N_INT; i++) {
            const petalo = new THREE.Mesh(GEO.petaloInt, matPetaloI);
            petalo.scale.set(0.42, 0.3, 1.8);

            const pivote = new THREE.Group();
            pivote.rotation.y = (i / N_INT) * Math.PI * 2 + 0.22;
            pivote.rotation.x = -0.25;
            petalo.position.z = 0.17;
            pivote.add(petalo);
            flor.add(pivote);

            registrar(petalo, 'Pétalo interior' + etiqueta, 'SphereGeometry (alargada)',
                'Pétalo del anillo interno. Protege el centro de la flor y se abre después que los exteriores.');
        }

        flor.scale.setScalar(escala);
        return flor;
    }

    // ---- Ramas generadas con un bucle ----
    const ramas = [];
    const flores = [];

    DEF_RAMAS.forEach(function (d, i) {
        const rama = new THREE.Group();
        rama.position.y = d.altura;
        rama.rotation.y = d.giro;
        rama.rotation.z = d.inclinacion;
        planta.add(rama);

        const palo = new THREE.Mesh(geoCilindro(0.03, 0.045, d.largo), matTallo);
        palo.position.y = d.largo / 2;
        rama.add(palo);
        registrar(palo, 'Rama ' + (i + 1) + etiqueta, 'CylinderGeometry',
            'Rama lateral que nace del tallo. Separa las hojas para que ninguna le haga sombra a la de abajo.');

        const hojaMedia = crearHoja(1.0);
        hojaMedia.position.set(0, d.largo * 0.55, 0.12);
        hojaMedia.rotation.z = 0.3;
        rama.add(hojaMedia);

        if (d.flor > 0) {
            const flor = crearFlor(d.flor);
            flor.position.y = d.largo + 0.1;
            rama.add(flor);

            // La rama está girada en Y y también inclinada en Z, así que no basta
            // con restar un ángulo: hay que anular su rotación completa. Copiamos
            // su quaternion invertido y a partir de ahí levantamos la flor.
            flor.quaternion.copy(rama.quaternion).invert();
            flor.rotateX(-Math.PI / 2 + 0.3);

            // Guardamos la orientación de reposo: el cabeceo oscila alrededor de ella
            flores.push({ grupo: flor, baseQ: flor.quaternion.clone() });
        } else {
            const hojaPunta = crearHoja(1.25);
            hojaPunta.position.y = d.largo + 0.08;
            rama.add(hojaPunta);
        }

        ramas.push({ grupo: rama, inclinacion: d.inclinacion, fase: i * 1.9 });
    });

    // Dos hojas bajas pegadas al tallo
    [{ y: 0.45, giro: 1.0 }, { y: 0.95, giro: 3.6 }].forEach(function (d) {
        const pivote = new THREE.Group();
        pivote.position.y = d.y;
        pivote.rotation.y = d.giro;
        planta.add(pivote);

        const hoja = crearHoja(1.15);
        hoja.position.set(0, 0.05, 0.28);
        hoja.rotation.x = -0.35;
        pivote.add(hoja);
    });

    // Flor principal en la punta del tallo
    const florPrincipal = crearFlor(1.0);
    florPrincipal.position.y = ALTURA_TALLO + 0.12;
    florPrincipal.rotation.x = -Math.PI / 2 + 0.2;
    planta.add(florPrincipal);
    flores.push({ grupo: florPrincipal, baseQ: florPrincipal.quaternion.clone() });

    return {
        maceta: maceta,
        planta: planta,
        ramas: ramas,
        flores: flores,
        // Cada planta se mueve con su propio desfase y su propia flexibilidad,
        // así las seis no se balancean al unísono como un coro.
        fase: cfg.fase,
        flexibilidad: cfg.flexibilidad
    };
}

// --------------------------------------------------------------------------
// 12. DISPOSICIÓN DEL JARDÍN
// --------------------------------------------------------------------------
const JARDIN = [
    { variedad: 0, x: -3.1, z: -2.2, escala: 1.00, giro: 0.3, fase: 0.0, flexibilidad: 1.00 },
    { variedad: 1, x: -1.6, z:  1.0, escala: 0.88, giro: 1.9, fase: 1.3, flexibilidad: 1.18 },
    { variedad: 2, x:  0.2, z: -3.0, escala: 1.08, giro: 3.4, fase: 2.5, flexibilidad: 0.85 },
    { variedad: 3, x:  1.8, z:  1.3, escala: 0.92, giro: 0.9, fase: 3.8, flexibilidad: 1.10 },
    { variedad: 4, x:  3.2, z: -1.7, escala: 1.02, giro: 2.6, fase: 5.0, flexibilidad: 0.92 },
    { variedad: 5, x: -0.1, z:  3.4, escala: 0.82, giro: 4.5, fase: 6.1, flexibilidad: 1.25 }
];

const plantas = JARDIN.map(crearCrisantemo);

document.getElementById('estado').textContent =
    '🌼 ' + plantas.length + ' crisantemos · ' + seleccionables.length + ' partes seleccionables';

// --------------------------------------------------------------------------
// 13. RAYCASTING Y PANEL DE INFORMACIÓN
// --------------------------------------------------------------------------
const rayo = new THREE.Raycaster();
const puntero = new THREE.Vector2();

const datoNombre    = document.getElementById('dato-nombre');
const datoGeometria = document.getElementById('dato-geometria');
const datoAltura    = document.getElementById('dato-altura');
const datoFuncion   = document.getElementById('dato-funcion');

let seleccionado = null;
const posicionMundo = new THREE.Vector3();

function seleccionar(objeto) {
    if (seleccionado) seleccionado.material.emissive.setHex(0x000000);
    seleccionado = objeto;

    if (!objeto) {
        datoNombre.textContent    = '—';
        datoGeometria.textContent = '—';
        datoAltura.textContent    = '—';
        datoFuncion.textContent   = 'Haz clic sobre una parte de la planta para ver su ficha.';
        return;
    }

    objeto.material.emissive.setHex(0x553311);

    // La altura real se obtiene de la posición en el mundo, porque cada parte
    // hereda la posición de su rama, de la planta y de la maceta.
    objeto.getWorldPosition(posicionMundo);

    datoNombre.textContent    = objeto.userData.nombre;
    datoGeometria.textContent = objeto.userData.geometria;
    datoAltura.textContent    = posicionMundo.y.toFixed(2) + ' unidades sobre el suelo';
    datoFuncion.textContent   = objeto.userData.funcion;

    console.log('Parte seleccionada:', objeto.userData.nombre,
                '· altura:', posicionMundo.y.toFixed(2));
}

// Distinguimos un clic de un arrastre de la cámara
let xAbajo = 0, yAbajo = 0;

lienzo.addEventListener('pointerdown', function (e) {
    xAbajo = e.clientX; yAbajo = e.clientY;
});

lienzo.addEventListener('pointerup', function (e) {
    if (Math.abs(e.clientX - xAbajo) + Math.abs(e.clientY - yAbajo) > 5) return;

    puntero.x = (e.clientX / window.innerWidth) * 2 - 1;
    puntero.y = -(e.clientY / window.innerHeight) * 2 + 1;

    rayo.setFromCamera(puntero, camara);
    const tocados = rayo.intersectObjects(seleccionables, false);
    const visibles = tocados.filter(function (t) { return t.object.visible; });

    seleccionar(visibles.length > 0 ? visibles[0].object : null);
});

// --------------------------------------------------------------------------
// 14. CONTROLES HTML
// --------------------------------------------------------------------------
let animando = true;

const btnAnimacion = document.getElementById('btn-animacion');
btnAnimacion.addEventListener('click', function () {
    animando = !animando;
    btnAnimacion.textContent = animando ? '⏸ Detener animación' : '▶ Reanudar animación';
});

// Paleta otoñal para el follaje. Todas las hojas cambian a la vez, pero cada
// una tiene su material, por eso hay que recorrerlas.
const PALETA_HOJAS = [0x7f9a3c, 0xb8a13a, 0xd08a2c, 0xc25f22, 0x8f3f1d];
let indiceHoja = 0;

document.getElementById('btn-hojas-color').addEventListener('click', function () {
    indiceHoja = (indiceHoja + 1) % PALETA_HOJAS.length;
    materialesHoja.forEach(function (m) { m.color.setHex(PALETA_HOJAS[indiceHoja]); });
});

const btnHojasVer = document.getElementById('btn-hojas-ver');
let hojasVisibles = true;

btnHojasVer.addEventListener('click', function () {
    hojasVisibles = !hojasVisibles;
    hojas.forEach(function (h) { h.visible = hojasVisibles; });
    btnHojasVer.textContent = hojasVisibles ? '👁 Ocultar hojas' : '👁 Mostrar hojas';
});

document.getElementById('btn-camara').addEventListener('click', function () {
    camara.position.copy(CAMARA_INICIAL);
    controles.target.copy(OBJETIVO_INICIAL);
    controles.update();
});

const deslizadorLuz = document.getElementById('luz');
const luzValor = document.getElementById('luz-valor');

deslizadorLuz.addEventListener('input', function () {
    const f = parseFloat(deslizadorLuz.value);
    luzAmbiental.intensity = BASE_AMBIENTAL * f;
    luzSol.intensity       = BASE_SOL * f;
    luzRelleno.intensity   = BASE_RELLENO * f;
    luzValor.textContent = f.toFixed(1);
});

// --------------------------------------------------------------------------
// 15. AJUSTE AL CAMBIAR EL TAMAÑO DE LA VENTANA
// --------------------------------------------------------------------------
window.addEventListener('resize', function () {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
});

// --------------------------------------------------------------------------
// 16. ANIMACIÓN: BRISA DE CLIMA NEUTRO
//     No hay giros: las flores no son hélices. Lo que hay es una brisa suave
//     hecha de tres capas, que es lo que hace que el aire se sienta real:
//       · una racha lenta que sube y baja la intensidad de todo el jardín
//       · el balanceo del tallo, con dos senos de distinta frecuencia
//       · el cabeceo de las flores y las ramas alrededor de su reposo
// --------------------------------------------------------------------------
const reloj = new THREE.Clock();
let tiempo = 0;

const BRISA = {
    amplitud:   0.030,   // radianes de inclinación del tallo
    frecuencia: 0.55,    // oscilación principal, lenta
    racha:      0.11     // cada cuántos ciclos sube y baja la intensidad
};

function animar() {
    requestAnimationFrame(animar);

    const dt = reloj.getDelta();
    if (animando) tiempo += dt;

    // Una sola racha para todo el jardín: el aire no sopla distinto en cada
    // maceta. Nunca llega a cero, así que la escena nunca se congela del todo.
    const racha = 0.6 + 0.4 * Math.sin(tiempo * BRISA.racha);

    plantas.forEach(function (p) {
        const a = BRISA.amplitud * racha * p.flexibilidad;

        // Balanceo del tallo: dos senos desfasados para que no se vea mecánico
        p.planta.rotation.z =
            Math.sin(tiempo * BRISA.frecuencia + p.fase) * a +
            Math.sin(tiempo * BRISA.frecuencia * 1.7 + p.fase * 2.1) * a * 0.35;

        p.planta.rotation.x =
            Math.cos(tiempo * BRISA.frecuencia * 0.8 + p.fase) * a * 0.65;

        // Las ramas acompañan con un poco de retraso sobre su inclinación de reposo
        p.ramas.forEach(function (r) {
            r.grupo.rotation.z = r.inclinacion +
                Math.sin(tiempo * 1.05 + p.fase + r.fase) * 0.022 * racha * p.flexibilidad;
        });

        // Las flores CABECEAN alrededor de su orientación de reposo, no giran.
        // Partimos siempre del quaternion guardado y le sumamos dos giros chicos,
        // así el cabeceo no se acumula cuadro a cuadro.
        p.flores.forEach(function (f, i) {
            f.grupo.quaternion.copy(f.baseQ);
            f.grupo.rotateX(Math.sin(tiempo * 0.9 + p.fase + i * 1.4) * 0.045 * racha);
            f.grupo.rotateZ(Math.cos(tiempo * 0.72 + p.fase + i * 2.2) * 0.038 * racha);
        });
    });

    controles.update();
    renderizador.render(escena, camara);
}

animar();