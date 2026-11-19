(() => {
  const patio = document.getElementById("patio");
  const colgante = document.getElementById("colgante");
  const pinataBtn = document.getElementById("pinata");
  const dibujo = document.getElementById("dibujo");
  const versoEl = document.getElementById("verso");
  const capa = document.getElementById("capa");
  const finalEl = document.getElementById("final");
  const resumenEl = document.getElementById("resumen");
  const otraBtn = document.getElementById("otra");
  const marcadorEl = document.getElementById("marcador");
  const bolsaEl = document.getElementById("bolsa");
  const contadorBolsaEl = document.getElementById("contador-bolsa");
  const palo = document.getElementById("palo");

  const PALETAS = [
    ["#E4007C", "#FFC21A", "#1F4AA8", "#3E9B4F", "#FF7A1A"],
    ["#7B2CBF", "#FF7A1A", "#FFC21A", "#E4007C", "#00A896"],
    ["#1F4AA8", "#E4007C", "#3E9B4F", "#FFC21A", "#FF595E"],
    ["#FF7A1A", "#3E9B4F", "#E4007C", "#1F4AA8", "#FFC21A"],
  ];

  const VERSOS = [
    "¡Dale, dale, dale, no pierdas el tino!",
    "Porque si lo pierdes, pierdes el camino...",
    "¡Ya le diste una, ya le diste dos!",
    "¡Ya le diste tres y tu tiempo se acabó!",
    "¡Échale más fuerte que ya va a tronar!",
    "¡Ya casi se rompe, no dejes de pegar!",
    "¡Un palazo más y caen los dulces!",
  ];

  const ONOMATOPEYAS = ["¡PUM!", "¡ZAS!", "¡CRAC!", "¡DALE!", "¡TOMA!"];

  const DULCES = ["🍬", "🍭", "🥜", "🍊", "🍫", "🧁", "🍪"];

  let golpes = 0;
  let golpesParaRomper = 9;
  let dulcesJuntados = 0;
  let rota = false;
  let indicePaleta = 0;

  // Física de péndulo
  let angulo = 0;
  let velocidadAngular = 0;

  // Audio sintetizado con Web Audio API
  let audioCtx = null;

  function asegurarAudio() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  }

  function sonarGolpe(intensidad = 1) {
    asegurarAudio();
    if (!audioCtx) return;

    const ahora = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(160 + intensidad * 40, ahora);
    osc.frequency.exponentialRampToValueAtTime(52, ahora + 0.14);

    gain.gain.setValueAtTime(0.32, ahora);
    gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.15);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(ahora);
    osc.stop(ahora + 0.16);
  }

  function sonarExplosion() {
    asegurarAudio();
    if (!audioCtx) return;

    const ahora = audioCtx.currentTime;
    const notas = [523.25, 659.25, 783.99, 1046.5];

    notas.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ahora + i * 0.06);

      gain.gain.setValueAtTime(0.2, ahora + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ahora + i * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(ahora + i * 0.06);
      osc.stop(ahora + i * 0.06 + 0.36);
    });
  }

  function sonarDulce() {
    asegurarAudio();
    if (!audioCtx) return;

    const ahora = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ahora);
    osc.frequency.setValueAtTime(990, ahora + 0.06);

    gain.gain.setValueAtTime(0.16, ahora);
    gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.18);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(ahora);
    osc.stop(ahora + 0.19);
  }

  // Dibuja la piñata de 7 picos en SVG
  function renderizarPinata(paleta) {
    const angulosPicos = [-90, -38.5, 13, 64.5, 115.5, 167, 218.5];
    let picosSVG = "";

    angulosPicos.forEach((deg, idx) => {
      const c1 = paleta[idx % paleta.length];
      const c2 = paleta[(idx + 1) % paleta.length];
      const c3 = paleta[(idx + 2) % paleta.length];

      picosSVG += `
        <g transform="rotate(${deg})">
          <!-- Flecos en la punta -->
          <path d="M168 -10 L195 -18 L184 -4 L198 0 L184 4 L195 18 L168 10 Z"
                fill="${c3}" stroke="#2B1D14" stroke-width="2.5" stroke-linejoin="round" />
          <!-- Cono del pico -->
          <polygon points="62,-32 174,0 62,32"
                   fill="${c1}" stroke="#2B1D14" stroke-width="4" stroke-linejoin="round" />
          <!-- Franjas decorativas -->
          <polygon points="94,-23 122,-15 122,15 94,23" fill="${c2}" />
          <polygon points="134,-11 154,-6 154,6 134,11" fill="#FFFDF9" />
          <polygon points="62,-32 174,0 62,32"
                   fill="none" stroke="#2B1D14" stroke-width="4" stroke-linejoin="round" />
        </g>
      `;
    });

    // Olas de papel crepé dentro de la esfera central
    let olanesSVG = "";
    for (let y = -76; y <= 76; y += 22) {
      const color = paleta[Math.abs(y) % paleta.length];
      let d = `M -95 ${y}`;
      for (let x = -95; x <= 95; x += 20) {
        d += ` Q ${x + 5} ${y + 10}, ${x + 10} ${y} T ${x + 20} ${y}`;
      }
      d += ` L 95 100 L -95 100 Z`;
      olanesSVG += `<path d="${d}" fill="${color}" stroke="#2B1D14" stroke-width="2.5" />`;
    }

    dibujo.innerHTML = `
      <defs>
        <clipPath id="clip-olla">
          <circle cx="0" cy="0" r="78" />
        </clipPath>
      </defs>

      <!-- 7 picos -->
      ${picosSVG}

      <!-- Olla central con papel crepé -->
      <circle cx="0" cy="0" r="78" fill="${paleta[0]}" />
      <g clip-path="url(#clip-olla)">
        ${olanesSVG}
      </g>
      <circle cx="0" cy="0" r="78" fill="none" stroke="#2B1D14" stroke-width="4.5" />

      <!-- Rosetón central -->
      <circle cx="0" cy="0" r="28" fill="#FFFDF9" stroke="#2B1D14" stroke-width="3.5" />
      <polygon points="0,-21 6,-7 21,-7 9,3 13,18 0,9 -13,18 -9,3 -21,-7 -6,-7"
               fill="${paleta[1]}" stroke="#2B1D14" stroke-width="2.5" stroke-linejoin="round" />

      <!-- Grietas que aparecen conforme recibe golpes -->
      <g id="grietas" stroke="#2B1D14" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="none"></g>
    `;
  }

  function actualizarGrietas() {
    const grietasEl = document.getElementById("grietas");
    if (!grietasEl) return;

    const progreso = golpes / golpesParaRomper;
    let trazos = "";

    if (progreso >= 0.25) {
      trazos += `<path d="M -38 -42 L -22 -24 L -32 -12 L -16 4" />`;
    }
    if (progreso >= 0.5) {
      trazos += `<path d="M 42 -30 L 24 -14 L 34 2 L 18 18" />`;
      trazos += `<path d="M -12 34 L -4 48 L -16 62" />`;
    }
    if (progreso >= 0.75) {
      trazos += `<path d="M -52 10 L -34 16 L -44 30 L -26 42" />`;
      trazos += `<path d="M 10 -58 L 4 -40 L 18 -32" />`;
    }

    grietasEl.innerHTML = trazos;
  }

  function crearChispaTexto(x, y) {
    const span = document.createElement("span");
    span.className = "chispa-texto";
    span.textContent =
      ONOMATOPEYAS[Math.floor(Math.random() * ONOMATOPEYAS.length)];
    span.style.left = `${x}px`;
    span.style.top = `${y}px`;
    capa.appendChild(span);
    setTimeout(() => span.remove(), 700);
  }

  function lanzarConfetiYCarton(origenX, origenY) {
    const paleta = PALETAS[indicePaleta];

    // Confeti de colores
    for (let i = 0; i < 42; i++) {
      const pieza = document.createElement("div");
      pieza.className = "confeti";
      const ancho = 7 + Math.random() * 8;
      const alto = 5 + Math.random() * 6;
      pieza.style.width = `${ancho}px`;
      pieza.style.height = `${alto}px`;
      pieza.style.backgroundColor = paleta[i % paleta.length];
      pieza.style.borderRadius = i % 3 === 0 ? "50%" : "2px";
      pieza.style.left = `${origenX}px`;
      pieza.style.top = `${origenY}px`;
      capa.appendChild(pieza);

      const vx = (Math.random() - 0.5) * 340;
      const vy = -120 - Math.random() * 190;
      const rotFinal = (Math.random() - 0.5) * 720;

      pieza.animate(
        [
          { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
          {
            transform: `translate(${vx * 0.5}px, ${vy}px) rotate(${rotFinal * 0.5}deg)`,
            opacity: 1,
            offset: 0.35,
          },
          {
            transform: `translate(${vx}px, ${patio.clientHeight - origenY + 30}px) rotate(${rotFinal}deg)`,
            opacity: 0.85,
          },
        ],
        {
          duration: 1200 + Math.random() * 900,
          easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          fill: "forwards",
        }
      ).onfinish = () => pieza.remove();
    }

    // Triángulos de cartón de la piñata
    for (let i = 0; i < 10; i++) {
      const pedazo = document.createElement("div");
      pedazo.className = "pedazo";
      pedazo.style.width = "22px";
      pedazo.style.height = "22px";
      pedazo.style.backgroundColor = paleta[i % paleta.length];
      pedazo.style.border = "2px solid #2B1D14";
      pedazo.style.clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
      pedazo.style.left = `${origenX}px`;
      pedazo.style.top = `${origenY}px`;
      capa.appendChild(pedazo);

      const vx = (Math.random() - 0.5) * 300;
      const vy = -90 - Math.random() * 140;

      pedazo.animate(
        [
          { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
          {
            transform: `translate(${vx}px, ${patio.clientHeight - origenY + 40}px) rotate(${(Math.random() - 0.5) * 540}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 950 + Math.random() * 450,
          easing: "ease-in",
          fill: "forwards",
        }
      ).onfinish = () => pedazo.remove();
    }
  }

  function soltarDulces(origenX, origenY) {
    const totalDulces = 14;
    const pisoY = patio.clientHeight - 54;

    for (let i = 0; i < totalDulces; i++) {
      const dulceBtn = document.createElement("button");
      dulceBtn.type = "button";
      dulceBtn.className = "dulce";
      dulceBtn.setAttribute("aria-label", "Recoger dulce");
      dulceBtn.textContent = DULCES[i % DULCES.length];

      const destinoX = Math.max(
        78,
        Math.min(
          patio.clientWidth - 110,
          origenX + (Math.random() - 0.5) * (patio.clientWidth * 0.68)
        )
      );
      const destinoY = pisoY - Math.random() * 26;

      dulceBtn.style.left = `${destinoX}px`;
      dulceBtn.style.top = `${destinoY}px`;

      const dxInicial = origenX - destinoX;
      const dyInicial = origenY - destinoY;

      dulceBtn.animate(
        [
          {
            transform: `translate(${dxInicial}px, ${dyInicial}px) scale(0.4) rotate(0deg)`,
          },
          {
            transform: `translate(${dxInicial * 0.45}px, ${dyInicial - 85}px) scale(1.1) rotate(180deg)`,
            offset: 0.4,
          },
          {
            transform: `translate(0px, -14px) scale(1) rotate(330deg)`,
            offset: 0.82,
          },
          {
            transform: `translate(0px, 0px) scale(1) rotate(360deg)`,
          },
        ],
        {
          duration: 650 + Math.random() * 300,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        }
      );

      dulceBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (dulceBtn.classList.contains("recogido")) return;
        dulceBtn.classList.add("recogido");
        sonarDulce();

        dulcesJuntados += 1;
        bolsaEl.hidden = false;
        contadorBolsaEl.textContent = String(dulcesJuntados);
        actualizarResumen();

        setTimeout(() => dulceBtn.remove(), 360);
      });

      capa.appendChild(dulceBtn);
    }
  }

  function actualizarResumen() {
    resumenEl.textContent = `La rompiste en ${golpes} ${
      golpes === 1 ? "golpe" : "golpes"
    } · Llevas ${dulcesJuntados} ${
      dulcesJuntados === 1 ? "dulce" : "dulces"
    } en tu bolsa (¡toca los dulces del suelo para juntarlos!).`;
  }

  function romperPinata(origenX, origenY) {
    rota = true;
    colgante.classList.add("rota");
    versoEl.hidden = true;
    sonarExplosion();

    lanzarConfetiYCarton(origenX, origenY);
    soltarDulces(origenX, origenY);

    actualizarResumen();
    setTimeout(() => {
      if (rota) finalEl.hidden = false;
    }, 550);
  }

  function pegarPinata(e) {
    if (rota) return;

    golpes += 1;
    marcadorEl.textContent = `Golpes: ${golpes}`;

    // Animación de impacto
    pinataBtn.classList.remove("golpeada");
    void pinataBtn.offsetWidth;
    pinataBtn.classList.add("golpeada");

    // Impulso al péndulo
    const direccion = Math.random() < 0.5 ? -1 : 1;
    velocidadAngular += direccion * (0.14 + Math.random() * 0.08);

    // Coordenadas relativas al patio
    const rectPatio = patio.getBoundingClientRect();
    const rectPinata = pinataBtn.getBoundingClientRect();
    const x =
      e && typeof e.clientX === "number" && e.clientX > 0
        ? e.clientX - rectPatio.left
        : rectPinata.left - rectPatio.left + rectPinata.width / 2;
    const y =
      e && typeof e.clientY === "number" && e.clientY > 0
        ? e.clientY - rectPatio.top
        : rectPinata.top - rectPatio.top + rectPinata.height / 2;

    crearChispaTexto(x, y);

    // Actualizar verso
    const indiceVerso = Math.min(golpes - 1, VERSOS.length - 1);
    versoEl.textContent = VERSOS[indiceVerso];
    versoEl.classList.remove("pulso");
    void versoEl.offsetWidth;
    versoEl.classList.add("pulso");

    if (golpes >= golpesParaRomper) {
      romperPinata(
        rectPinata.left - rectPatio.left + rectPinata.width / 2,
        rectPinata.top - rectPatio.top + rectPinata.height / 2
      );
    } else {
      sonarGolpe(golpes / golpesParaRomper);
      actualizarGrietas();
    }
  }

  function colgarOtraPinata() {
    golpes = 0;
    golpesParaRomper = 8 + Math.floor(Math.random() * 5);
    rota = false;
    angulo = 0;
    velocidadAngular = (Math.random() < 0.5 ? -1 : 1) * 0.06;

    indicePaleta = (indicePaleta + 1) % PALETAS.length;
    renderizarPinata(PALETAS[indicePaleta]);

    // Limpiar confeti y dulces anteriores
    capa.innerHTML = "";
    finalEl.hidden = true;
    versoEl.hidden = false;
    versoEl.textContent = "Toca la piñata para pegarle";
    marcadorEl.textContent = "Golpes: 0";
    colgante.classList.remove("rota");
  }

  // Bucle de oscilación del péndulo
  function animarPendulo() {
    const gravedad = 0.012;
    const amortiguacion = 0.965;

    const aceleracion = -gravedad * Math.sin(angulo);
    velocidadAngular += aceleracion;
    velocidadAngular *= amortiguacion;
    angulo += velocidadAngular;

    colgante.style.transform = `translateX(-50%) rotate(${angulo}rad)`;
    requestAnimationFrame(animarPendulo);
  }

  // Movimiento y golpe del palo
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse") {
      palo.classList.add("activo");
      palo.style.left = `${e.clientX - 10}px`;
      palo.style.top = `${e.clientY - 8}px`;
    }
  });

  window.addEventListener("pointerdown", (e) => {
    palo.style.left = `${e.clientX - 10}px`;
    palo.style.top = `${e.clientY - 8}px`;
    palo.classList.add("activo");
    palo.classList.remove("pegando");
    void palo.offsetWidth;
    palo.classList.add("pegando");
  });

  pinataBtn.addEventListener("click", pegarPinata);
  otraBtn.addEventListener("click", colgarOtraPinata);

  // Inicialización
  renderizarPinata(PALETAS[0]);
  requestAnimationFrame(animarPendulo);
})();
