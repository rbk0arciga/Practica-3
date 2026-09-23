// ==========================================================================
//  PRÁCTICA 03 — PLANTAS 3D
//  Jardín otoñal con un crisantemo naranja
//  Ricardo Melgoza y Rebeca Arciga
// ==========================================================================

// --------------------------------------------------------------------------
// 1. ESCENA
// --------------------------------------------------------------------------
const escena = new THREE.Scene();
escena.background = new THREE.Color(0x241a12);
escena.fog = new THREE.Fog(0x241a12, 11, 30);

// --------------------------------------------------------------------------
// 2. CÁMARA
// --------------------------------------------------------------------------
const camara = new THREE.PerspectiveCamera(
    50, window.innerWidth / window.innerHeight, 0.1, 100
);

const CAMARA_INICIAL = new THREE.Vector3(3.2, 3.1, 5.0);
const OBJETIVO_INICIAL = new THREE.Vector3(0, 2.0, 0);
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
controles.minDistance = 2.5;
controles.maxDistance = 16;
controles.maxPolarAngle = Math.PI / 2 - 0.02;   // no bajar del nivel del suelo
controles.target.copy(OBJETIVO_INICIAL);

// --------------------------------------------------------------------------
// 5. ILUMINACIÓN (luz cálida de tarde de otoño)
// --------------------------------------------------------------------------
const luzAmbiental = new THREE.AmbientLight(0xffd9b0, 0.45);
escena.add(luzAmbiental);

const luzSol = new THREE.DirectionalLight(0xffb870, 1.0);
luzSol.position.set(4, 7, 4);
luzSol.castShadow = true;
luzSol.shadow.mapSize.set(1024, 1024);
luzSol.shadow.camera.left = -6;
luzSol.shadow.camera.right = 6;
luzSol.shadow.camera.top = 6;
luzSol.shadow.camera.bottom = -6;
escena.add(luzSol);

const luzRelleno = new THREE.PointLight(0xff8a3d, 0.35, 20);
luzRelleno.position.set(-4, 2.5, -3);
escena.add(luzRelleno);

// Intensidades base para que el deslizador las multiplique
const BASE_AMBIENTAL = 0.45;
const BASE_SOL = 1.0;
const BASE_RELLENO = 0.35;

// --------------------------------------------------------------------------
// 6. MATERIALES (todos MeshStandardMaterial, colores otoñales)
// --------------------------------------------------------------------------
const matSuelo   = new THREE.MeshStandardMaterial({ color: 0x4a3220, roughness: 1.0 });
const matHojarasca = new THREE.MeshStandardMaterial({ color: 0x8a4a1c, roughness: 0.95, side: THREE.DoubleSide });
const matMaceta  = new THREE.MeshStandardMaterial({ color: 0xb4623a, roughness: 0.8, metalness: 0.05 });
const matBorde   = new THREE.MeshStandardMaterial({ color: 0x9c4f2d, roughness: 0.75 });
const matTierra  = new THREE.MeshStandardMaterial({ color: 0x3d2b1c, roughness: 1.0 });
const matTallo   = new THREE.MeshStandardMaterial({ color: 0x5c7a3a, roughness: 0.8 });
const matHoja    = new THREE.MeshStandardMaterial({ color: 0x7f9a3c, roughness: 0.7 });
const matPetalo  = new THREE.MeshStandardMaterial({ color: 0xff8c2b, roughness: 0.55 });
const matPetaloE = new THREE.MeshStandardMaterial({ color: 0xe0651a, roughness: 0.6 });
const matCentro  = new THREE.MeshStandardMaterial({ color: 0xf6c453, roughness: 0.5 });

// --------------------------------------------------------------------------
// 7. REGISTRO DE PARTES SELECCIONABLES
// --------------------------------------------------------------------------
const seleccionables = [];   // mallas que el raycaster puede tocar
const hojas = [];            // para los botones de color y de visibilidad

// Guarda la ficha dentro de la malla y la apunta en la lista del raycaster
function registrar(malla, nombre, geometria, funcion) {
    malla.userData = { nombre: nombre, geometria: geometria, funcion: funcion };
    malla.castShadow = true;
    seleccionables.push(malla);
    return malla;
}

// --------------------------------------------------------------------------
// 8. SUELO DEL JARDÍN
// --------------------------------------------------------------------------
const suelo = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), matSuelo);
suelo.rotation.x = -Math.PI / 2;
suelo.receiveShadow = true;
escena.add(suelo);
registrar(suelo, 'Suelo del jardín', 'PlaneGeometry',
    'Plano que sostiene la maceta y recibe las sombras. Marca la altura cero desde la que se miden las demás partes.');
suelo.castShadow = false;

// Hojarasca: círculos planos esparcidos por el suelo (decoración, no seleccionable)
const geoHojarasca = new THREE.CircleGeometry(0.15, 8);
for (let i = 0; i < 22; i++) {
    const hojita = new THREE.Mesh(geoHojarasca, matHojarasca);
    const angulo = Math.random() * Math.PI * 2;
    const radio = 1.6 + Math.random() * 4.5;
    hojita.position.set(Math.cos(angulo) * radio, 0.01, Math.sin(angulo) * radio);
    hojita.rotation.x = -Math.PI / 2;
    hojita.rotation.z = Math.random() * Math.PI;
    hojita.scale.setScalar(0.7 + Math.random() * 0.7);
    escena.add(hojita);
}

// --------------------------------------------------------------------------
// 9. JERARQUÍA: maceta → planta → ramas → hojas y flores
// --------------------------------------------------------------------------
const maceta = new THREE.Group();
escena.add(maceta);

// Cuerpo de la maceta (cilindro con la base más angosta)
const cuerpoMaceta = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.62, 1.2, 28), matMaceta
);
cuerpoMaceta.position.y = 0.6;
cuerpoMaceta.receiveShadow = true;
maceta.add(cuerpoMaceta);
registrar(cuerpoMaceta, 'Maceta', 'CylinderGeometry',
    'Contiene el sustrato y sostiene toda la planta. Es el objeto padre de la jerarquía.');

// Borde de la maceta
const bordeMaceta = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.075, 10, 32), matBorde
);
bordeMaceta.position.y = 1.2;
bordeMaceta.rotation.x = Math.PI / 2;
maceta.add(bordeMaceta);
registrar(bordeMaceta, 'Borde de la maceta', 'TorusGeometry',
    'Refuerza el filo superior de la maceta y evita que el sustrato se derrame al regar.');

// Tierra
const tierra = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.8, 0.12, 28), matTierra
);
tierra.position.y = 1.16;
tierra.receiveShadow = true;
maceta.add(tierra);
registrar(tierra, 'Sustrato', 'CylinderGeometry',
    'Mezcla de tierra donde se anclan las raíces; retiene el agua y los nutrientes del crisantemo.');

// ---- La planta cuelga de la maceta (hija en la jerarquía) ----
const planta = new THREE.Group();
planta.position.y = 1.22;         // empieza justo encima del sustrato
maceta.add(planta);

// Tallo principal
const ALTURA_TALLO = 2.0;
const tallo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.095, ALTURA_TALLO, 14), matTallo
);
tallo.position.y = ALTURA_TALLO / 2;
planta.add(tallo);
registrar(tallo, 'Tallo principal', 'CylinderGeometry',
    'Eje central de la planta. Transporta agua y savia desde el sustrato hasta las hojas y las flores.');

// --------------------------------------------------------------------------
// 10. FUNCIONES AUXILIARES: hojas y flores
// --------------------------------------------------------------------------

// Una hoja es una esfera achatada
function crearHoja(escala) {
    const hoja = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), matHoja);
    hoja.scale.set(1.0 * escala, 0.28 * escala, 0.62 * escala);
    hojas.push(hoja);
    registrar(hoja, 'Hoja', 'SphereGeometry (achatada)',
        'Capta la luz del sol y realiza la fotosíntesis. En el crisantemo es lobulada y de borde dentado.');
    return hoja;
}

// Una flor de crisantemo: centro + dos anillos de pétalos generados en bucle
function crearFlor(escala) {
    const flor = new THREE.Group();

    const centro = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), matCentro);
    flor.add(centro);
    registrar(centro, 'Centro de la flor', 'SphereGeometry',
        'Disco central del capítulo. Agrupa las flores fértiles diminutas que producen el polen y la semilla.');

    // Anillo exterior: pétalos largos y caídos
    const N_EXT = 14;
    for (let i = 0; i < N_EXT; i++) {
        const petalo = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), matPetaloE);
        petalo.scale.set(0.45, 0.28, 2.5);

        const pivote = new THREE.Group();
        pivote.rotation.y = (i / N_EXT) * Math.PI * 2;
        pivote.rotation.x = 0.55;                 // caída hacia abajo
        petalo.position.z = 0.26;
        pivote.add(petalo);
        flor.add(pivote);

        registrar(petalo, 'Pétalo exterior', 'SphereGeometry (alargada)',
            'Pétalo del anillo externo. Se abre hacia afuera y hacia abajo; es el que da el volumen al crisantemo.');
    }

    // Anillo interior: pétalos más cortos y erguidos
    const N_INT = 10;
    for (let i = 0; i < N_INT; i++) {
        const petalo = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), matPetalo);
        petalo.scale.set(0.42, 0.3, 1.8);

        const pivote = new THREE.Group();
        pivote.rotation.y = (i / N_INT) * Math.PI * 2 + 0.22;
        pivote.rotation.x = -0.25;                // más levantados
        petalo.position.z = 0.17;
        pivote.add(petalo);
        flor.add(pivote);

        registrar(petalo, 'Pétalo interior', 'SphereGeometry (alargada)',
            'Pétalo del anillo interno. Protege el centro de la flor y se abre después que los exteriores.');
    }

    flor.scale.setScalar(escala);
    return flor;
}

// --------------------------------------------------------------------------
// 11. RAMAS GENERADAS CON UN BUCLE
//     Cada rama es un Group con su propio pivote: tallo → rama → hoja/flor
// --------------------------------------------------------------------------
const flores = [];   // para animarlas después

const DEF_RAMAS = [
    { altura: 0.75, giro: 0.0,           largo: 0.85, inclinacion: -1.00, flor: 0.80 },
    { altura: 1.15, giro: 2.1,           largo: 0.72, inclinacion: -0.85, flor: 0.00 },
    { altura: 1.55, giro: 4.2,           largo: 0.80, inclinacion: -0.95, flor: 0.70 }
];

DEF_RAMAS.forEach(function (d, i) {
    const rama = new THREE.Group();
    rama.position.y = d.altura;      // punto donde nace del tallo
    rama.rotation.y = d.giro;        // alrededor del tallo
    rama.rotation.z = d.inclinacion; // inclinación hacia afuera
    planta.add(rama);

    // El palo de la rama sale del pivote hacia "arriba" en su eje local
    const palo = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.045, d.largo, 10), matTallo
    );
    palo.position.y = d.largo / 2;
    rama.add(palo);
    registrar(palo, 'Rama ' + (i + 1), 'CylinderGeometry',
        'Rama lateral que nace del tallo. Separa las hojas para que ninguna le haga sombra a la de abajo.');

    // Hoja a media rama
    const hojaMedia = crearHoja(1.0);
    hojaMedia.position.set(0, d.largo * 0.55, 0.12);
    hojaMedia.rotation.z = 0.3;
    rama.add(hojaMedia);

    // Al final de la rama: una flor, o una hoja grande si no lleva flor
    if (d.flor > 0) {
        const flor = crearFlor(d.flor);
        flor.position.y = d.largo + 0.1;
        // Primero deshacemos la inclinación que hereda de la rama y después
        // la levantamos, para que la flor mire al cielo y no de canto.
        flor.rotation.z = -d.inclinacion;
        flor.rotation.x = -Math.PI / 2 + 0.3;
        rama.add(flor);
        flores.push(flor);
    } else {
        const hojaPunta = crearHoja(1.25);
        hojaPunta.position.y = d.largo + 0.08;
        rama.add(hojaPunta);
    }
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
flores.push(florPrincipal);

document.getElementById('estado').textContent =
    '🌼 Crisantemo armado con ' + seleccionables.length + ' partes seleccionables';

// --------------------------------------------------------------------------
// 12. RAYCASTING Y PANEL DE INFORMACIÓN
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
    // Apagar el resaltado anterior
    if (seleccionado) seleccionado.material.emissive.setHex(0x000000);
    seleccionado = objeto;

    if (!objeto) {
        datoNombre.textContent    = '—';
        datoGeometria.textContent = '—';
        datoAltura.textContent    = '—';
        datoFuncion.textContent   = 'Haz clic sobre una parte de la planta para ver su ficha.';
        return;
    }

    objeto.material.emissive.setHex(0x553311);   // resaltado cálido

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

    seleccionar(tocados.length > 0 ? tocados[0].object : null);
});

// --------------------------------------------------------------------------
// 13. CONTROLES HTML
// --------------------------------------------------------------------------
let animando = true;

// a) Detener / reanudar la animación
const btnAnimacion = document.getElementById('btn-animacion');
btnAnimacion.addEventListener('click', function () {
    animando = !animando;
    btnAnimacion.textContent = animando ? '⏸ Detener animación' : '▶ Reanudar animación';
});

// b) Cambiar el color de las hojas (paleta otoñal)
const PALETA_HOJAS = [0x7f9a3c, 0xb8a13a, 0xd08a2c, 0xc25f22, 0x8f3f1d];
let indiceHoja = 0;

document.getElementById('btn-hojas-color').addEventListener('click', function () {
    indiceHoja = (indiceHoja + 1) % PALETA_HOJAS.length;
    matHoja.color.setHex(PALETA_HOJAS[indiceHoja]);   // todas comparten el material
});

// c) Mostrar / ocultar las hojas
const btnHojasVer = document.getElementById('btn-hojas-ver');
let hojasVisibles = true;

btnHojasVer.addEventListener('click', function () {
    hojasVisibles = !hojasVisibles;
    hojas.forEach(function (h) { h.visible = hojasVisibles; });
    btnHojasVer.textContent = hojasVisibles ? '👁 Ocultar hojas' : '👁 Mostrar hojas';
});

// d) Reiniciar la cámara
document.getElementById('btn-camara').addEventListener('click', function () {
    camara.position.copy(CAMARA_INICIAL);
    controles.target.copy(OBJETIVO_INICIAL);
    controles.update();
});

// e) Intensidad de la luz
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
// 14. AJUSTE AL CAMBIAR EL TAMAÑO DE LA VENTANA
// --------------------------------------------------------------------------
window.addEventListener('resize', function () {
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
    renderizador.setSize(window.innerWidth, window.innerHeight);
});

// --------------------------------------------------------------------------
// 15. ANIMACIÓN CON requestAnimationFrame
// --------------------------------------------------------------------------
const reloj = new THREE.Clock();
let tiempo = 0;

function animar() {
    requestAnimationFrame(animar);

    const dt = reloj.getDelta();

    if (animando) {
        tiempo += dt;

        // Balanceo suave de toda la planta (como si le diera el viento).
        // Al ser el grupo padre, ramas, hojas y flores se mueven con ella.
        planta.rotation.z = Math.sin(tiempo * 0.9) * 0.045;
        planta.rotation.x = Math.cos(tiempo * 0.7) * 0.03;

        // Las flores giran despacio sobre su propio eje
        flores.forEach(function (f, i) {
            f.rotation.z += dt * (0.25 + i * 0.05);
        });
    }

    controles.update();
    renderizador.render(escena, camara);
}

animar();