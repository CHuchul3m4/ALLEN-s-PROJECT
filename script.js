
document.addEventListener("DOMContentLoaded", () => {
  // ========================================
  // 1. ELEMENTOS DEL HTML
  // ========================================
  const pantalla = document.getElementById("pantallaEntrada");
  const abrirBtn = document.getElementById("abrirCarta");
  const musica = document.getElementById("musica");
  const musicBtn = document.getElementById("musicBtn");

  const form = document.getElementById("formCartita");
  const campoMensaje = document.getElementById("mensajeCartita");
  const botonPublicar = document.getElementById("btnPublicar");
  const estado = document.getElementById("estadoCartita");
  const contenedor = document.getElementById("cartitasPublicadas");

  // ========================================
  // 2. BOTÓN DE MÚSICA
  // ========================================
  function actualizarBotonMusica() {
    if (!musica || !musicBtn) return;

    const reproduciendo = !musica.paused && !musica.ended;

    musicBtn.textContent = reproduciendo
      ? "⏸️ Pausar música"
      : "🎵 Iniciar música";

    musicBtn.setAttribute("aria-pressed", String(reproduciendo));
  }

  if (pantalla && abrirBtn && musica && musicBtn) {
    // Sin mostrar el botón antes de abrir la carta.
    musicBtn.hidden = true;

    abrirBtn.addEventListener("click", async () => {
      pantalla.hidden = true;
      musicBtn.hidden = false;

      try {
        await musica.play();
      } catch (error) {
        console.warn("El navegador no inició la música:", error);
        actualizarBotonMusica();
      }
    });

    musicBtn.addEventListener("click", async () => {
      try {
        if (musica.paused || musica.ended) {
          await musica.play();
        } else {
          musica.pause();
        }
      } catch (error) {
        console.error("No se pudo reproducir la música:", error);
      }

      actualizarBotonMusica();
    });

    musica.addEventListener("play", actualizarBotonMusica);
    musica.addEventListener("pause", actualizarBotonMusica);
    musica.addEventListener("ended", actualizarBotonMusica);
    musica.addEventListener("error", () => {
      console.error("No se pudo cargar el archivo de música.");
      musicBtn.textContent = "⚠️ Música no disponible";
    });

    actualizarBotonMusica();
  }

  // ========================================
  // 3. VALIDAR EL FORMULARIO
  // ========================================
  if (!form || !campoMensaje || !botonPublicar ||
      !estado || !contenedor) {
    console.error(
      "Faltan elementos del formulario de cartitas en el HTML."
    );
    return;
  }

  // ========================================
  // 4. CONEXIÓN CON SUPABASE
  // ========================================
  const SUPABASE_URL =
    "https://oqlgavhrybboxmnvclhb.supabase.co";

  // Clave pública del proyecto (Publishable key).
  const SUPABASE_KEY =
    "sb_publishable_tTEsbfN4alknsP-PlaoZjg_LDfrXwm1";

  if (!window.supabase) {
    estado.textContent =
      "No se cargó Supabase. Recarga la página e inténtalo de nuevo.";
    console.error(
      "No existe window.supabase. Revisa el orden de los scripts."
    );
    return;
  }

  const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  // ========================================
  // 5. CREAR UNA CARTA SEGURA
  // ========================================
  function crearCarta(cartita) {
    const article = document.createElement("article");
    article.className = "carta";

    const top = document.createElement("div");
    top.className = "card-top";

    const titulo = document.createElement("span");
    titulo.textContent = "✦ CARTITA ANÓNIMA ✦";

    const numero = document.createElement("span");
    numero.className = "card-number";
    numero.textContent = "♡";

    top.append(titulo, numero);

    const heading = document.createElement("h2");
    heading.textContent = "♡ Alguien que te quiere ♡";

    const message = document.createElement("div");
    message.className = "message";

    const p = document.createElement("p");
    p.style.whiteSpace = "pre-wrap";
    p.textContent = cartita.mensaje ?? "";

    message.appendChild(p);

    const footer = document.createElement("div");
    footer.className = "card-footer";
    footer.textContent = "♡ con cariño ♡";

    article.append(top, heading, message, footer);

    return article;
  }

  // ========================================
  // 6. CARGAR CARTITAS DESDE LA BASE DE DATOS
  // ========================================
  async function cargarCartitas() {
    const { data, error } = await db
      .from("cartitas_visitantes")
      .select("id, mensaje, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "Error al cargar cartitas:",
        error.message,
        error
      );

      estado.textContent =
        "No se pudieron cargar las cartitas. Revisa la conexión y los permisos.";
      return false;
    }

    contenedor.replaceChildren(
      ...data.map(crearCarta)
    );

    return true;
  }

  // ========================================
  // 7. PUBLICAR UNA CARTITA
  // ========================================
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const mensaje = campoMensaje.value.trim();

    if (!mensaje || mensaje.length > 1000) {
      estado.textContent =
        "Escribe un mensaje de entre 1 y 1000 caracteres.";
      campoMensaje.focus();
      return;
    }

    botonPublicar.disabled = true;
    estado.textContent = "Enviando tu cartita...";

    try {
      const { error } = await db
        .from("cartitas_visitantes")
        .insert({ mensaje });

      if (error) {
        throw error;
      }

      form.reset();
      estado.textContent = "¡Tu cartita se publicó! 💗";

      const recargadas = await cargarCartitas();

      if (!recargadas) {
        estado.textContent =
          "La cartita se publicó, pero no se pudieron actualizar las cartas visibles.";
      }
    } catch (error) {
      console.error(
        "Error al publicar la cartita:",
        error.message,
        error
      );

      estado.textContent =
        "No se pudo publicar. Comprueba la conexión y los permisos de Supabase.";
    } finally {
      botonPublicar.disabled = false;
    }
  });

  // ========================================
  // 8. CARGAR CARTITAS AL ABRIR LA PÁGINA
  // ========================================
  cargarCartitas();
});
