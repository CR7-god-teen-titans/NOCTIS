/* ==========================================================================
   NOCTIS - MAIN GAME ENGINE & NARRATIVE SYSTEM
   ========================================================================== */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();

    // Game Objects
    this.player = new Player(100, 300);
    this.enemies = [];
    this.allies = [];
    this.traps = [];
    this.cameraX = 0;
    this.groundY = this.canvas.height - 100;
    this.levelWidth = 3200;

    // Game States: 'START', 'STORY_DIALOGUE', 'PLAYING', 'GAME_OVER', 'VICTORY'
    this.gameState = 'START';
    this.currentChapter = 1;
    this.skillPoints = 0;

    // Keys State
    this.keys = {};

    // Dialogue State
    this.dialogueQueue = [];
    this.currentDialogue = null;

    // Upgrades
    this.upgrades = {
      blade: 0,
      rageGain: 0,
      health: 0
    };

    // Preload Custom Background Images
    this.bgImages = {
      catacombs: new Image(),
      temple: new Image()
    };
    this.bgImages.catacombs.src = 'assets/catacombs_custom.png';
    this.bgImages.temple.src = 'assets/floating_temple_custom.png';

    this.initEventListeners();
    this.initStoryChapters();
  }

  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.groundY = this.canvas.height - 100;
  }

  initEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());

    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // UI Buttons
    document.getElementById('btn-play-story').addEventListener('click', () => {
      this.startChapter(1);
    });

    document.getElementById('btn-select-chapter').addEventListener('click', () => {
      document.getElementById('screen-chapters').classList.remove('hidden');
    });

    document.querySelectorAll('.btn-close-chapters').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('screen-chapters').classList.add('hidden');
      });
    });

    document.querySelectorAll('.btn-start-chap').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const chap = parseInt(e.target.getAttribute('data-chapter'));
        document.getElementById('screen-chapters').classList.add('hidden');
        this.startChapter(chap);
      });
    });

    // Controls Modal
    document.getElementById('btn-controls-modal').addEventListener('click', () => {
      document.getElementById('modal-controls').classList.remove('hidden');
    });

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('modal-controls').classList.add('hidden');
        document.getElementById('modal-upgrades').classList.add('hidden');
      });
    });

    // Upgrades Modal
    document.getElementById('btn-upgrades-modal').addEventListener('click', () => {
      this.openUpgradesModal();
    });

    document.querySelectorAll('.btn-buy-upgrade').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.getAttribute('data-upgrade');
        this.buyUpgrade(type);
      });
    });

    // Audio Toggle
    document.getElementById('btn-audio').addEventListener('click', () => {
      const isMuted = soundEngine.toggleMute();
      document.getElementById('btn-audio').innerText = isMuted ? '🔇' : '🔊';
    });

    // Dialogue Next Button
    document.getElementById('btn-next-dialogue').addEventListener('click', () => {
      this.advanceDialogue();
    });

    // End Buttons
    document.getElementById('btn-retry').addEventListener('click', () => {
      this.startChapter(this.currentChapter);
    });

    document.getElementById('btn-next-chapter').addEventListener('click', () => {
      const nextChap = this.currentChapter < 19 ? this.currentChapter + 1 : 1;
      this.startChapter(nextChap);
    });
  }

  // --- STORY & DIALOGUE DATA ---
  initStoryChapters() {
    this.storyData = {
      1: {
        title: "Capítulo 1: Afueras de Nocturnia",
        introDialogue: [
          { speaker: "NOCTIS", text: "Las sombras avanzan hacia Nocturnia. Debo mantener la calma y controlar mi espada.", img: "assets/noctis_cover.png" },
          { speaker: "NOCTIS", text: "Si me dejo dominar por la ira... la gente empezará a temerme como a un monstruo.", img: "assets/noctis_cover.png" }
        ],
        enemiesCount: 4,
        villainType: null,
        allies: ['leo'],
        traps: [{ type: 'spikes', count: 2 }]
      },
      2: {
        title: "Capítulo 2: El Puente de los Suspiros",
        introDialogue: [
          { speaker: "NOCTIS", text: "Este puente conduce al corazón del reino. Las patrullas de sombra se hacen más fuertes.", img: "assets/noctis_cover.png" },
          { speaker: "NOCTIS", text: "Debo atravesar el bloqueo antes de que alcancen a los civiles.", img: "assets/noctis_cover.png" }
        ],
        enemiesCount: 6,
        villainType: null,
        allies: ['leo'],
        traps: [{ type: 'spikes', count: 2 }, { type: 'fire', count: 1 }]
      },
      3: {
        title: "Capítulo 3: Kaelen el Manipulador",
        introDialogue: [
          { speaker: "KAELEN", text: "¡Míralo! El poderoso Noctis... luchando por reprimir la verdadera furia que lleva dentro.", img: "assets/kaelen_villain.png" },
          { speaker: "KAELEN", text: "¡Enfuréce, Noctis! Deja que el mundo vea a la nueva amenaza en la que te convertirás.", img: "assets/kaelen_villain.png" },
          { speaker: "NOCTIS", text: "¡No caeré en tus provocaciones, Kaelen! Dominaré mi poder.", img: "assets/noctis_cover.png" }
        ],
        enemiesCount: 3,
        villainType: 'kaelen',
        allies: ['leo'],
        traps: [{ type: 'spikes', count: 2 }, { type: 'fire', count: 2 }]
      },
      4: {
        title: "Capítulo 4: Las Catacumbas del Olvido",
        introDialogue: [
          { speaker: "NOCTIS", text: "Las catacumbas subterráneas... La magia rúnica antigua resuena con la furia de mi pecho.", img: "assets/catacombs.png" },
          { speaker: "NOCTIS", text: "Debo mantener la compostura mientras me abro paso en las profundidades.", img: "assets/noctis_cover.png" }
        ],
        enemiesCount: 6,
        villainType: null,
        allies: ['leo'],
        traps: [{ type: 'spikes', count: 3 }, { type: 'fire', count: 2 }]
      },
      5: {
        title: "Capítulo 5: El Templo de la Discordia",
        introDialogue: [
          { speaker: "NOCTIS", text: "El templo flotante en las alturas... Puedo sentir el trono de Malakor a solo unos pasos.", img: "assets/temple.png" },
          { speaker: "NOCTIS", text: "Sombra tras sombra intenta agotar mi energía. ¡No daré un paso atrás!", img: "assets/noctis_cover.png" }
        ],
        enemiesCount: 7,
        villainType: null,
        allies: ['leo', 'maya'],
        traps: [{ type: 'fire', count: 3 }, { type: 'saw_blade', count: 1 }]
      },
      6: {
        title: "Capítulo 6: Umbra Noctis (El Espejo Oscuro)",
        introDialogue: [
          { speaker: "UMBRA NOCTIS", text: "Yo soy tu verdadero yo, Noctis. La fuerza descontrolada que la gente teme.", img: "assets/umbra_noctis.png" },
          { speaker: "UMBRA NOCTIS", text: "Si me derrotas sin controlar tu furia, te convertirás en mí para siempre.", img: "assets/umbra_noctis.png" },
          { speaker: "NOCTIS", text: "Venceré a mi propia sombra. Demostraré que puedo ser un verdadero héroe.", img: "assets/noctis_cover.png" }
        ],
        enemiesCount: 1,
        villainType: 'umbra',
        allies: ['leo', 'maya'],
        traps: [{ type: 'poison_gas', count: 2 }]
      },
      7: {
        title: "Capítulo 7: El Trono del Abismo: Malakor",
        introDialogue: [
          { speaker: "MALAKOR", text: "¡Imposible! Has cruzado todas mis defensas y dominado la furia en lugar de volverte destructivo...", img: "assets/noctis_rage.png" },
          { speaker: "NOCTIS", text: "La verdadera fuerza no es destruir... es proteger a quienes amas. ¡Aquí termina tu reinado, Malakor!", img: "assets/noctis_cover.png" }
        ],
        enemiesCount: 1,
        villainType: 'boss',
        allies: ['leo', 'maya', 'kael'],
        traps: [{ type: 'fire', count: 2 }, { type: 'spikes', count: 2 }, { type: 'saw_blade', count: 1 }]
      },
      // ========== ARCO II: LA SOMBRA RENACE ==========
      8: {
        title: "Capítulo 8: El Despertar del Vacío",
        introDialogue: [
          { speaker: "NOCTIS", text: "Malakor ha caído... pero algo se agita en las ruinas de su trono.", img: "assets/noctis_cover.png" },
          { speaker: "LEO", text: "¡Noctis! Soy Leo Mercer, capitán de la Guardia de Nocturnia. Vine a investigar la misma anomalía.", img: "assets/leo_mercer.png" },
          { speaker: "LEO", text: "Traje a mi estratega, Maya Cross. Ella nos guiará.", img: "assets/leo_mercer.png" },
          { speaker: "MAYA", text: "He estudiado los patrones de las sombras. Si trabajamos en equipo, podemos contenerlas.", img: "assets/maya_cross.png" },
          { speaker: "NOCTIS", text: "...De acuerdo. Algo se acerca. Prepárense.", img: "assets/noctis_cover.png" }
        ],
        enemiesCount: 5,
        villainType: null,
        allies: ['leo', 'maya'],
        traps: [{ type: 'spikes', count: 2 }, { type: 'fire', count: 1 }]
      },
      9: {
        title: "Capítulo 9: El Bosque de Almas Perdidas",
        introDialogue: [
          { speaker: "MAYA", text: "Mis sensores detectan energía fantasmal. Este bosque atrapa almas.", img: "assets/maya_cross.png" },
          { speaker: "LEO", text: "Hay alguien más aquí... ¿quién es ese en las sombras?", img: "assets/leo_mercer.png" },
          { speaker: "KAEL", text: "...Soy Kael Draven. Rastreador. He seguido estas sombras por semanas.", img: "assets/kael_draven.png" },
          { speaker: "KAEL", text: "No confío en ti, Noctis. Tu poder oscuro es peligroso. Pero necesito aliados.", img: "assets/kael_draven.png" },
          { speaker: "ELIAS", text: "Calma, joven rastreador. Yo soy Elias Thorn, guardián de la Orden de la Luz Eterna.", img: "assets/elias_thorn.png" },
          { speaker: "ELIAS", text: "He observado a Noctis desde hace tiempo. Su oscuridad no es una maldición... es un don que aún no comprende.", img: "assets/elias_thorn.png" },
          { speaker: "NOCTIS", text: "¿Un don? Todos los que me rodean solo ven peligro en mi poder.", img: "assets/noctis_cover.png" },
          { speaker: "ELIAS", text: "Porque aún no has aprendido a controlarlo. Permíteme guiarte.", img: "assets/elias_thorn.png" },
          { speaker: "ESPÍRITU", text: "Noctis... libéranos... o únete a nosotros por la eternidad...", img: "assets/noctis_rage.png" }
        ],
        enemiesCount: 7,
        villainType: null,
        allies: ['leo', 'maya', 'kael', 'elias'],
        traps: [{ type: 'poison_gas', count: 3 }, { type: 'spikes', count: 2 }]
      },
      10: {
        title: "Capítulo 10: La Fortaleza de Ceniza",
        introDialogue: [
          { speaker: "MAYA", text: "La Fortaleza de Ceniza. Detecto actividad masiva en el interior.", img: "assets/maya_cross.png" },
          { speaker: "KAEL", text: "Hay trampas por todas partes. Yo iré al frente.", img: "assets/kael_draven.png" },
          { speaker: "ELIAS", text: "Ten cuidado, Kael. La impaciencia es el arma favorita del enemigo.", img: "assets/elias_thorn.png" },
          { speaker: "LEO", text: "¡El puente se derrumba! ¡NOCTIS, CORRE!", img: "assets/leo_mercer.png" },
          { speaker: "NOCTIS", text: "¡El piso se viene abajo...! No puedo... agarrarme...", img: "assets/noctis_cover.png" },
          { speaker: "SILAS", text: "...Todavía no era tu momento.", img: "assets/silas_kane.png" },
          { speaker: "NOCTIS", text: "¿Quién eres? ¿Por qué me salvaste?", img: "assets/noctis_cover.png" },
          { speaker: "SILAS", text: "Soy Silas Kane. He observado tu camino desde las sombras. Ahora soy parte de Vanguard Eclipse.", img: "assets/silas_kane.png" },
          { speaker: "ELIAS", text: "...Silas Kane. He oído ese nombre antes. Ten cuidado, Noctis.", img: "assets/elias_thorn.png" },
          { speaker: "KAEL", text: "Otro misterioso... Genial. Al menos sabe pelear.", img: "assets/kael_draven.png" }
        ],
        enemiesCount: 8,
        villainType: null,
        allies: ['leo', 'maya', 'kael', 'elias', 'silas'],
        traps: [{ type: 'spikes', count: 4 }, { type: 'fire', count: 3 }, { type: 'saw_blade', count: 2 }, { type: 'poison_gas', count: 2 }]
      },
      11: {
        title: "Capítulo 11: Zephyr, el Cazador de Héroes",
        introDialogue: [
          { speaker: "ZEPHYR", text: "Al fin te encuentro, Noctis. Me enviaron a cazar al 'héroe' que destruyó a Malakor.", img: "assets/noctis_rage.png" },
          { speaker: "LEO", text: "¡No estás solo, Zephyr! ¡Somos Vanguard Eclipse!", img: "assets/leo_mercer.png" },
          { speaker: "MAYA", text: "Seis contra uno. Mis cálculos dicen que no tienes oportunidad.", img: "assets/maya_cross.png" },
          { speaker: "ELIAS", text: "No te confíes, Maya. Los cazadores como él son impredecibles.", img: "assets/elias_thorn.png" },
          { speaker: "KAEL", text: "Déjenmelo a mí. Conozco a los cazadores como él.", img: "assets/kael_draven.png" },
          { speaker: "NOCTIS", text: "He enfrentado a mi propia sombra. Un cazador no me asusta.", img: "assets/noctis_cover.png" }
        ],
        enemiesCount: 4,
        villainType: 'zephyr',
        allies: ['leo', 'maya', 'kael', 'elias', 'silas'],
        traps: [{ type: 'saw_blade', count: 2 }, { type: 'fire', count: 2 }]
      },
      12: {
        title: "Capítulo 12: El Abismo Marino",
        introDialogue: [
          { speaker: "SILAS", text: "La Reliquia del Silencio está en las profundidades. Yo conozco el camino.", img: "assets/silas_kane.png" },
          { speaker: "KAEL", text: "¿Cómo sabes eso, Silas? Cada vez desconfío más de ti.", img: "assets/kael_draven.png" },
          { speaker: "ELIAS", text: "Kael tiene razón en dudar, pero ahora necesitamos unidad. Yo vigilaré.", img: "assets/elias_thorn.png" },
          { speaker: "MAYA", text: "Kael, contrólate. Silas nos ha salvado. Necesitamos confiar en el equipo.", img: "assets/maya_cross.png" },
          { speaker: "NOCTIS", text: "Las criaturas abisales nos rodean. ¡Vanguard Eclipse, formación!", img: "assets/noctis_cover.png" }
        ],
        enemiesCount: 8,
        villainType: null,
        allies: ['leo', 'maya', 'kael', 'elias', 'silas'],
        traps: [{ type: 'poison_gas', count: 3 }, { type: 'spikes', count: 3 }]
      },
      // ========== THE DARK CROW — ELIAS'S SACRIFICE ==========
      13: {
        title: "Capítulo 13: El Cuervo Oscuro",
        introDialogue: [
          { speaker: "DARK CROW", text: "Vanguard Eclipse... qué nombre tan pretencioso para un grupo de insectos.", img: "assets/dark_crow.png" },
          { speaker: "DARK CROW", text: "Soy The Dark Crow. Y he venido a arrancarles las alas una por una.", img: "assets/dark_crow.png" },
          { speaker: "ELIAS", text: "¡Esa energía...! Noctis, este enemigo es diferente. Está conectado al Vacío directamente.", img: "assets/elias_thorn.png" },
          { speaker: "NOCTIS", text: "¡Entonces lo enfrentaremos juntos!", img: "assets/noctis_cover.png" },
          { speaker: "DARK CROW", text: "¡MUERAN!", img: "assets/dark_crow.png" }
        ],
        outroDialogue: [
          { speaker: "DARK CROW", text: "¡Si no puedo destruirlos... LOS LLEVARÉ CONMIGO AL ABISMO!", img: "assets/dark_crow.png" },
          { speaker: "ELIAS", text: "¡NO! ¡NOCTIS, TODOS, ATRÁS! ¡YO LO CONTENDRÉ!", img: "assets/elias_thorn.png" },
          { speaker: "LEO", text: "¡¡ELIAS, NO!!", img: "assets/leo_mercer.png" },
          { speaker: "MAYA", text: "¡Está usando todo su poder de luz para sellar la explosión...!", img: "assets/maya_cross.png" },
          { speaker: "KAEL", text: "...No... no puede ser...", img: "assets/kael_draven.png" },
          { speaker: "ELIAS", text: "Noctis... escúchame bien... estas serán mis últimas palabras...", img: "assets/elias_thorn.png" },
          { speaker: "ELIAS", text: "No luches contra tu oscuridad, Noctis. Aprende a controlarla... ese será tu verdadero poder.", img: "assets/elias_thorn.png" },
          { speaker: "ELIAS", text: "Cuida a Vanguard Eclipse... Confío en ti... hijo...", img: "assets/elias_thorn.png" },
          { speaker: "NOCTIS", text: "...ELIAS... ¡¡¡ELIAS!!!", img: "assets/noctis_rage.png" },
          { speaker: "SILAS", text: "...Se fue. La luz de Elias Thorn se ha apagado. Pero su sacrificio nos salvó a todos.", img: "assets/silas_kane.png" },
          { speaker: "NOCTIS", text: "Nunca olvidaré tus palabras, Elias. Aprenderé a controlar mi oscuridad. Te lo juro.", img: "assets/noctis_cover.png" }
        ],
        enemiesCount: 6,
        villainType: 'dark_crow',
        allies: ['leo', 'maya', 'kael', 'elias', 'silas'],
        traps: [{ type: 'fire', count: 3 }, { type: 'saw_blade', count: 2 }, { type: 'poison_gas', count: 2 }]
      },
      14: {
        title: "Capítulo 14: La Torre del Reloj Eterno",
        introDialogue: [
          { speaker: "NOCTIS", text: "Esta torre distorsiona el tiempo. Veo versiones de mí mismo en el pasado y el futuro.", img: "assets/noctis_cover.png" },
          { speaker: "NOCTIS FUTURO", text: "No cometas el mismo error que yo. Controla la furia o la torre te consumirá.", img: "assets/noctis_rage.png" },
          { speaker: "LEO", text: "¿Eso eres tú... del futuro? Noctis, ten cuidado.", img: "assets/leo_mercer.png" },
          { speaker: "NOCTIS", text: "Elias me dijo que controlara mi oscuridad... Aquí empiezo a entender por qué.", img: "assets/noctis_cover.png" }
        ],
        enemiesCount: 9,
        villainType: 'kaelen',
        allies: ['leo', 'maya', 'kael', 'silas'],
        traps: [{ type: 'saw_blade', count: 3 }, { type: 'fire', count: 2 }]
      },
      15: {
        title: "Capítulo 15: El Valle de los Cristales Rotos",
        introDialogue: [
          { speaker: "MAYA", text: "Estos cristales amplifican todo... nuestro poder y nuestros miedos.", img: "assets/maya_cross.png" },
          { speaker: "KAEL", text: "Puedo sentirlo. Mi desconfianza... se amplifica. Noctis, ¿puedo confiar en ti?", img: "assets/kael_draven.png" },
          { speaker: "NOCTIS", text: "Kael... sí. Elias confió en mí con sus últimas palabras. Te juro que jamás perderé el control.", img: "assets/noctis_cover.png" },
          { speaker: "KAEL", text: "...Bien. Por Elias. Pelemos juntos. De verdad esta vez.", img: "assets/kael_draven.png" }
        ],
        enemiesCount: 10,
        villainType: null,
        allies: ['leo', 'maya', 'kael', 'silas'],
        traps: [{ type: 'spikes', count: 3 }, { type: 'fire', count: 2 }, { type: 'saw_blade', count: 2 }]
      },
      16: {
        title: "Capítulo 16: La Ciudadela Carmesí",
        introDialogue: [
          { speaker: "NOCTIS", text: "La Orden Carmesí... guerreros que bebieron la sangre de Malakor.", img: "assets/noctis_cover.png" },
          { speaker: "CARMESÍ", text: "¡Malakor nos dio el poder que tú desperdicias!", img: "assets/noctis_rage.png" },
          { speaker: "LEO", text: "¡Vanguard Eclipse, cubran los flancos!", img: "assets/leo_mercer.png" },
          { speaker: "MAYA", text: "¡Kael a la izquierda, Silas a la derecha! ¡Leo y Noctis al centro!", img: "assets/maya_cross.png" }
        ],
        enemiesCount: 8,
        villainType: 'umbra',
        allies: ['leo', 'maya', 'kael', 'silas'],
        traps: [{ type: 'fire', count: 4 }, { type: 'saw_blade', count: 3 }]
      },
      // ========== SILAS'S BETRAYAL ==========
      17: {
        title: "Capítulo 17: La Traición de Silas",
        introDialogue: [
          { speaker: "SILAS", text: "...Lo siento, Noctis. Pero esto termina aquí.", img: "assets/silas_kane.png" },
          { speaker: "LEO", text: "¿Silas...? ¿Qué estás haciendo?", img: "assets/leo_mercer.png" },
          { speaker: "SILAS", text: "Nunca fui parte de Vanguard Eclipse. Mi verdadera lealtad siempre fue con Nyx.", img: "assets/silas_kane.png" },
          { speaker: "SILAS", text: "Ella me envió para vigilarlos, para encontrar sus debilidades... y para destruirlos desde dentro.", img: "assets/silas_kane.png" },
          { speaker: "KAEL", text: "¡LO SABÍA! ¡Siempre supe que no eras de fiar!", img: "assets/kael_draven.png" },
          { speaker: "MAYA", text: "Silas... ¿todo fue mentira? ¿Cuando salvaste a Noctis en la fortaleza...?", img: "assets/maya_cross.png" },
          { speaker: "SILAS", text: "Todo fue parte del plan de Nyx. Necesitaba su confianza para acercarme lo suficiente.", img: "assets/silas_kane.png" },
          { speaker: "NOCTIS", text: "...Elias tenía razón. Él me advirtió sobre ti. No lucharé con rabia, Silas.", img: "assets/noctis_cover.png" },
          { speaker: "NOCTIS", text: "Pero si te interpones en nuestro camino... Vanguard Eclipse no se detendrá.", img: "assets/noctis_cover.png" },
          { speaker: "SILAS", text: "¡Entonces DEMUÉSTRALO!", img: "assets/silas_kane.png" }
        ],
        enemiesCount: 5,
        villainType: 'silas_boss',
        allies: ['leo', 'maya', 'kael'],
        traps: [{ type: 'poison_gas', count: 3 }, { type: 'saw_blade', count: 3 }]
      },
      18: {
        title: "Capítulo 18: Nyx, la Reina de la Noche",
        introDialogue: [
          { speaker: "NYX", text: "Al fin nos conocemos, Noctis. Yo creé a Malakor. Yo desperté tu furia oscura.", img: "assets/noctis_rage.png" },
          { speaker: "NYX", text: "Todo fue diseñado. Tu poder, tu lucha, tu dolor... incluso Silas fue mi peón.", img: "assets/noctis_rage.png" },
          { speaker: "NOCTIS", text: "Ya no me importa tu plan. Elias me enseñó a controlar mi oscuridad.", img: "assets/noctis_cover.png" },
          { speaker: "KAEL", text: "Por Elias. Por cada compañero que hemos perdido. ¡ACABEMOS CON ESTO!", img: "assets/kael_draven.png" },
          { speaker: "MAYA", text: "¡Vanguard Eclipse! ¡Formación final!", img: "assets/maya_cross.png" },
          { speaker: "LEO", text: "¡POR NOCTURNIA!", img: "assets/leo_mercer.png" },
          { speaker: "NOCTIS", text: "¡PAGARÁS POR TODO, NYX! ¡POR ELIAS!", img: "assets/noctis_cover.png" }
        ],
        enemiesCount: 3,
        villainType: 'nyx',
        allies: ['leo', 'maya', 'kael'],
        traps: [{ type: 'poison_gas', count: 2 }, { type: 'saw_blade', count: 2 }]
      },
      19: {
        title: "Capítulo 19: El Origen de la Oscuridad — VOID",
        introDialogue: [
          { speaker: "VOID", text: "Yo soy el principio y el final. La oscuridad antes del primer amanecer.", img: "assets/noctis_rage.png" },
          { speaker: "VOID", text: "Cada héroe, cada villano... todo nació de mí. Y todo regresará a mí.", img: "assets/noctis_rage.png" },
          { speaker: "LEO", text: "Noctis... ha sido un honor. Vanguard Eclipse hasta el final.", img: "assets/leo_mercer.png" },
          { speaker: "MAYA", text: "Los números no importan aquí. Lo que importa es que estamos juntos.", img: "assets/maya_cross.png" },
          { speaker: "KAEL", text: "Confío en ti, Noctis. Con mi vida. Por Elias. Terminemos esto.", img: "assets/kael_draven.png" },
          { speaker: "NOCTIS", text: "Elias me dijo que no luchara contra mi oscuridad... sino que aprendiera a controlarla.", img: "assets/noctis_cover.png" },
          { speaker: "NOCTIS", text: "¡MI OSCURIDAD NO ME DEFINE! ¡YO DECIDO QUIÉN SOY!", img: "assets/noctis_cover.png" },
          { speaker: "NOCTIS", text: "¡POR VANGUARD ECLIPSE... POR ELIAS THORN... ESTE ES EL FINAL, VOID!", img: "assets/noctis_cover.png" }
        ],
        enemiesCount: 2,
        villainType: 'void_boss',
        allies: ['leo', 'maya', 'kael'],
        traps: [{ type: 'fire', count: 3 }, { type: 'saw_blade', count: 3 }, { type: 'spikes', count: 4 }, { type: 'poison_gas', count: 2 }]
      }
    };
  }

  startChapter(chapNumber) {
    if (document.activeElement) document.activeElement.blur();
    window.focus();

    this.currentChapter = chapNumber;
    const chapData = this.storyData[chapNumber];

    document.getElementById('screen-start').classList.add('hidden');
    document.getElementById('screen-end').classList.add('hidden');
    document.getElementById('player-hud').classList.remove('hidden');
    document.getElementById('btn-upgrades-modal').classList.remove('hidden');

    document.getElementById('current-chapter-title').innerText = chapData.title;

    this.player.reset(100, this.groundY - this.player.height);
    this.player.upgrades = this.upgrades;
    this.player.applyUpgrades();

    this.enemies = [];
    this.allies = [];
    this.traps = [];

    // Spawn regular minions
    for (let i = 0; i < chapData.enemiesCount; i++) {
      const type = i % 2 === 0 ? 'walker' : 'caster';
      const spawnX = 600 + (i * 300);
      this.enemies.push(new Enemy(spawnX, this.groundY - 60, type));
    }

    // Spawn Villain Boss if applicable
    if (chapData.villainType) {
      const bossX = 600 + (chapData.enemiesCount * 300) + 200;
      this.enemies.push(new Enemy(bossX, this.groundY - 110, chapData.villainType));
    }

    // Spawn Allies
    if (chapData.allies) {
      chapData.allies.forEach((allyType, i) => {
        const allyX = 60 + i * 50;
        this.allies.push(new Ally(allyX, this.groundY - 68, allyType));
      });
    }

    // Spawn Traps between enemies
    if (chapData.traps) {
      chapData.traps.forEach(trapDef => {
        for (let i = 0; i < trapDef.count; i++) {
          const trapX = 400 + (i * 350) + Math.random() * 150;
          this.traps.push(new Trap(trapX, 0, trapDef.type, this.groundY));
        }
      });
    }

    soundEngine.startBGM(false);

    this.queueDialogue(chapData.introDialogue, () => {
      this.gameState = 'PLAYING';
      if (document.activeElement) document.activeElement.blur();
      window.focus();
    });
  }

  // --- DIALOGUE SYSTEM ---
  queueDialogue(lines, callback) {
    this.dialogueQueue = [...lines];
    this.onDialogueComplete = callback;
    this.gameState = 'STORY_DIALOGUE';
    document.getElementById('dialogue-overlay').classList.remove('hidden');
    this.advanceDialogue();
  }

  advanceDialogue() {
    if (this.dialogueQueue.length === 0) {
      document.getElementById('dialogue-overlay').classList.add('hidden');
      if (document.activeElement) document.activeElement.blur();
      window.focus();
      if (this.onDialogueComplete) this.onDialogueComplete();
      return;
    }

    const current = this.dialogueQueue.shift();
    document.getElementById('speaker-name').innerText = current.speaker;
    document.getElementById('dialogue-text').innerText = current.text;
    if (current.img) {
      document.getElementById('speaker-img').src = current.img;
    }
  }

  // --- UPGRADE TREE SYSTEM ---
  openUpgradesModal() {
    document.getElementById('skill-points-count').innerText = this.skillPoints;
    document.getElementById('modal-upgrades').classList.remove('hidden');
  }

  buyUpgrade(type) {
    if (this.skillPoints >= 1) {
      this.skillPoints--;
      this.upgrades[type]++;
      this.player.upgrades = this.upgrades;
      this.player.applyUpgrades();
      soundEngine.playVictory();
      this.openUpgradesModal();
    }
  }

  // --- MAIN LOOP & RENDER ---
  run() {
    const loop = () => {
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update() {
    if (this.gameState !== 'PLAYING') return;

    // Handle Player Input & Physics
    this.player.handleInput(this.keys);
    this.player.update(this.groundY);

    // Camera follow player smoothly
    this.cameraX = Math.max(0, Math.min(this.player.x - 200, this.levelWidth - this.canvas.width));

    // Update Traps & Collision Detection
    this.traps.forEach(trap => {
      trap.update();
      // Check trap vs player
      if (trap.checkCollision(this.player)) {
        this.player.takeDamage(trap.damage);
        this.shakeTimer = 8;
      }
      // Check trap vs allies
      this.allies.forEach(ally => {
        if (trap.checkCollision(ally)) {
          ally.takeDamage(trap.damage);
        }
      });
    });

    // Update Enemies & Hit Checks
    let aliveCount = 0;
    this.enemies.forEach(enemy => {
      if (!enemy.isDead) aliveCount++;
      enemy.update(this.player, this.groundY);

      // Check Player Sword Attack Box on Enemy
      if (this.player.attackBox && !enemy.isDead) {
        const ab = this.player.attackBox;
        if (!ab.hitEnemies.has(enemy)) {
          const hitX = ab.x < enemy.x + enemy.width && ab.x + ab.width > enemy.x;
          const hitY = ab.y < enemy.y + enemy.height && ab.y + ab.height > enemy.y;

          if (hitX && hitY) {
            ab.hitEnemies.add(enemy);
            enemy.takeDamage(ab.damage);
            this.player.addRage(15 * (1 + this.upgrades.rageGain * 0.3));
          }
        }
      }
    });

    // Update Allies & Ally Hit Checks
    this.allies.forEach(ally => {
      ally.update(this.player, this.enemies, this.groundY);

      // Check Ally Melee Attack Box on Enemy
      if (ally.attackBox) {
        this.enemies.forEach(enemy => {
          if (!enemy.isDead && !ally.attackBox.hitEnemies.has(enemy)) {
            const ab = ally.attackBox;
            const hitX = ab.x < enemy.x + enemy.width && ab.x + ab.width > enemy.x;
            const hitY = ab.y < enemy.y + enemy.height && ab.y + ab.height > enemy.y;
            if (hitX && hitY) {
              ab.hitEnemies.add(enemy);
              enemy.takeDamage(ab.damage);
            }
          }
        });
      }

      // Check Ally Ranged Projectiles (Maya)
      ally.projectiles.forEach(p => {
        if (!p.active) return;
        this.enemies.forEach(enemy => {
          if (!enemy.isDead) {
            if (p.x >= enemy.x && p.x <= enemy.x + enemy.width &&
                p.y >= enemy.y && p.y <= enemy.y + enemy.height) {
              enemy.takeDamage(p.damage);
              p.active = false;
              soundEngine.playHit();
            }
          }
        });
      });
    });

    // Bazooka Shell Collision & AOE Explosions
    this.player.bazookaProjectiles.forEach(shell => {
      if (!shell.active) return;

      // Check direct hit against any enemy
      let hit = false;
      for (let enemy of this.enemies) {
        if (!enemy.isDead) {
          if (shell.x >= enemy.x && shell.x <= enemy.x + enemy.width &&
              shell.y >= enemy.y && shell.y <= enemy.y + enemy.height) {
            hit = true;
            break;
          }
        }
      }

      if (hit) {
        shell.active = false;
        soundEngine.playExplosion();
        this.shakeTimer = 16;

        // Create Explosion Particles
        for (let i = 0; i < 45; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 10 + 3;
          this.player.particles.push(new Particle(
            shell.x, shell.y,
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            Math.random() > 0.4 ? '#fbbf24' : '#ef4444',
            Math.random() * 9 + 4, 30
          ));
        }

        // Deal MASSIVE AOE damage - INSTANT KILL on minions, reduced on bosses
        this.enemies.forEach(enemy => {
          if (!enemy.isDead) {
            const enemyCenterX = enemy.x + enemy.width / 2;
            const enemyCenterY = enemy.y + enemy.height / 2;
            const dist = Math.hypot(enemyCenterX - shell.x, enemyCenterY - shell.y);

            if (dist <= shell.aoeRadius) {
              const isBoss = enemy.isBossType();
              const dmg = isBoss ? 50 : shell.damage;
              enemy.takeDamage(dmg);
              this.player.addRage(20 * (1 + this.upgrades.rageGain * 0.3));
            }
          }
        });
      }
    });
    this.player.bazookaProjectiles = this.player.bazookaProjectiles.filter(s => s.active);

    // Update HUD Stats
    document.getElementById('hp-text').innerText = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;
    document.getElementById('hp-fill').style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;

    document.getElementById('rage-text').innerText = `${Math.ceil(this.player.rage)}%`;
    document.getElementById('rage-fill').style.width = `${this.player.rage}%`;

    // Update Objective Badge & Portal Status
    const totalEnemies = this.enemies.length;
    // Calculate portal position dynamically after enemies
    let maxEnemyX = 1800;
    this.enemies.forEach(e => { if (e.x > maxEnemyX) maxEnemyX = e.x; });
    this.portalX = maxEnemyX + 350;

    const distToPortal = Math.abs(this.player.x - this.portalX);
    const isAtPortal = distToPortal < 80;
    const isPortalOpen = aliveCount === 0;

    const objBadge = document.getElementById('objective-text');
    if (totalEnemies > 0) {
      if (!isPortalOpen) {
        objBadge.innerText = `Sombras: ${aliveCount}/${totalEnemies} restantes (Portal 🔒)`;
        objBadge.style.color = "#ef4444";
      } else {
        objBadge.innerText = `✨ ¡PORTAL DE LUZ ABIERTO! Entra al Portal (➔)`;
        objBadge.style.color = "#00d2ff";
      }
    }

    // Portal Entry Logic:
    // If player reaches an open portal (or touches it / presses jump near it), complete chapter!
    if (isPortalOpen && isAtPortal) {
      this.triggerVictory();
    } else if (!isPortalOpen && isAtPortal && this.keys['KeyW']) {
      // Feedback if player tries to enter locked portal
      objBadge.innerText = `🔒 ¡Portal Bloqueado! Derrota a todas las Sombras primero.`;
    }

    // Check Game Over
    if (this.player.hp <= 0) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    this.gameState = 'GAME_OVER';
    soundEngine.stopBGM();
    document.getElementById('end-title').innerText = "¡NOCTIS HA CAÍDO!";
    document.getElementById('end-subtitle').innerText = "Las sombras dominaron el destino de Nocturnia. Reintenta para controlar la furia.";
    document.getElementById('end-title').style.color = "#ef4444";
    document.getElementById('screen-end').classList.remove('hidden');
  }

  triggerVictory() {
    if (this.gameState === 'VICTORY') return;
    this.gameState = 'VICTORY';
    soundEngine.stopBGM();
    soundEngine.playVictory();
    this.skillPoints++;

    document.getElementById('end-title').innerText = "¡CAPÍTULO COMPLETADO!";
    document.getElementById('end-subtitle').innerText = "Noctis ha demostrado un control legendario sobre sus poderes. ¡Has ganado 1 Punto de Habilidad!";
    document.getElementById('end-title').style.color = "#00d2ff";
    document.getElementById('screen-end').classList.remove('hidden');
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    // Screen Shake Effect from Bazooka Explosions
    if (this.shakeTimer && this.shakeTimer > 0) {
      this.shakeTimer--;
      const shakeX = (Math.random() - 0.5) * 14;
      const shakeY = (Math.random() - 0.5) * 14;
      this.ctx.translate(shakeX, shakeY);
    }

    if (this.currentChapter === 4 && this.bgImages.catacombs.complete) {
      // --- CATACOMBS CUSTOM BACKGROUND ---
      this.ctx.fillStyle = '#05070a';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      this.ctx.save();
      this.ctx.globalAlpha = 0.55;
      const img = this.bgImages.catacombs;
      const aspect = img.width / img.height;
      const drawWidth = this.canvas.height * aspect;
      for (let i = 0; i < 4; i++) {
        const bgX = (i * drawWidth) - (this.cameraX * 0.3);
        this.ctx.drawImage(img, bgX, 0, drawWidth, this.canvas.height);
      }
      this.ctx.restore();
    } else if (this.currentChapter === 5 && this.bgImages.temple.complete) {
      // --- FLOATING TEMPLE OF DISCORD BACKGROUND ---
      const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      skyGradient.addColorStop(0, '#0f172a');
      skyGradient.addColorStop(0.6, '#31104b');
      skyGradient.addColorStop(1, '#1e1b4b');
      this.ctx.fillStyle = skyGradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Floating Temple Animation
      this.ctx.save();
      const img = this.bgImages.temple;
      const templeWidth = 420;
      const templeHeight = (img.height / img.width) * templeWidth;
      const floatOffsetY = Math.sin(Date.now() / 600) * 18; // Gentle floating effect
      const templeX = (this.canvas.width / 2 - templeWidth / 2) - (this.cameraX * 0.15);
      const templeY = 40 + floatOffsetY;
      
      this.ctx.shadowBlur = 35;
      this.ctx.shadowColor = '#fbbf24';
      this.ctx.drawImage(img, templeX, templeY, templeWidth, templeHeight);
      this.ctx.restore();
    } else {
      // --- STANDARD PARALLAX BACKGROUND ---
      const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
      skyGradient.addColorStop(0, '#030712');
      skyGradient.addColorStop(0.6, '#0f172a');
      skyGradient.addColorStop(1, '#1e1b4b');
      this.ctx.fillStyle = skyGradient;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Glowing Moon
      this.ctx.save();
      this.ctx.fillStyle = '#f8fafc';
      this.ctx.shadowBlur = 40;
      this.ctx.shadowColor = '#00d2ff';
      this.ctx.beginPath();
      this.ctx.arc(this.canvas.width - 180, 120, 55, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      // City Skyline Silhouette (Parallax Layer 1)
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      for (let i = 0; i < 20; i++) {
        const bX = (i * 180) - (this.cameraX * 0.2);
        const bWidth = 140;
        const bHeight = 250 + (i % 3) * 60;
        this.ctx.fillRect(bX, this.groundY - bHeight, bWidth, bHeight);
      }
    }

    // --- DRAW END LEVEL PORTAL MARKER ---
    const targetPortalX = this.portalX || 2400;
    const portalScreenX = targetPortalX - this.cameraX;
    const aliveCountNow = this.enemies.filter(e => !e.isDead).length;
    const isOpen = aliveCountNow === 0;

    this.ctx.save();
    this.ctx.shadowBlur = isOpen ? 45 : 15;
    this.ctx.shadowColor = isOpen ? '#00d2ff' : '#ef4444';
    this.ctx.fillStyle = isOpen ? 'rgba(0, 210, 255, 0.35)' : 'rgba(239, 68, 68, 0.2)';
    this.ctx.strokeStyle = isOpen ? '#00d2ff' : '#ef4444';
    this.ctx.lineWidth = 4;

    // Portal Outer Ring
    this.ctx.beginPath();
    this.ctx.ellipse(portalScreenX, this.groundY - 75, 42, 85, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    // Rotating Inner Vortex (when open)
    if (isOpen) {
      this.ctx.strokeStyle = '#fbbf24';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      const pulse = Math.sin(Date.now() / 200) * 6;
      this.ctx.ellipse(portalScreenX, this.groundY - 75, 26 + pulse, 58 + pulse * 2, 0, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    // Portal Labels & Interaction Prompt
    this.ctx.fillStyle = isOpen ? '#00d2ff' : '#ef4444';
    this.ctx.font = 'bold 13px Orbitron';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(isOpen ? '✨ PORTAL ABIERTO' : '🔒 PORTAL BLOQUEADO', portalScreenX, this.groundY - 175);

    if (isOpen) {
      this.ctx.fillStyle = '#fbbf24';
      this.ctx.font = 'bold 12px Orbitron';
      this.ctx.fillText('¡ENTRA PARA COMPLETAR EL NIVEL! ➔', portalScreenX, this.groundY - 195);
    } else {
      this.ctx.fillStyle = '#9ca3af';
      this.ctx.font = '11px Orbitron';
      this.ctx.fillText(`(Elimina a las Sombras: ${aliveCountNow} restantes)`, portalScreenX, this.groundY - 195);
    }
    this.ctx.restore();

    // Ground Platform
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

    // Ground Glowing Neon Line
    this.ctx.save();
    this.ctx.strokeStyle = this.player.isRageMode ? '#a855f7' : '#00d2ff';
    this.ctx.lineWidth = 4;
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = this.player.isRageMode ? '#a855f7' : '#00d2ff';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.groundY);
    this.ctx.lineTo(this.canvas.width, this.groundY);
    this.ctx.stroke();
    this.ctx.restore();

    // --- GAME OBJECTS RENDERING ---
    this.traps.forEach(trap => trap.draw(this.ctx, this.cameraX));
    this.enemies.forEach(enemy => enemy.draw(this.ctx, this.cameraX));
    this.allies.forEach(ally => ally.draw(this.ctx, this.cameraX));
    this.player.draw(this.ctx, this.cameraX);

    this.ctx.restore();
  }
}

// Start Game Engine when window loads
window.addEventListener('load', () => {
  const game = new GameEngine();
  game.run();
});
