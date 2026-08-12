/*!
 * attribution.js — FONTE CANONICA da camada de atribuicao e eventos canonicos.
 * Trilha C (mensuracao/migracao) · Amaral e Bohrer / Conversao Juridica
 *
 * Contratos implementados (CONTRATOS-CONGELADOS-v1.md):
 *   §1.1 envelope canonico · §1.2 os seis eventos · §1.5 event_id de jornada
 *   §3.1 objeto attribution · §3.2 regime WEB e decoracao ?eid=
 *   §3.3(a) `ref` em wa.me montado por codigo proprio · §3.4 formato do ref
 *   §5.1 I1/I2 (espelho ao lead-core, chave `k` no CORPO) · §6.1/§6.3 privacidade
 *
 * REGRAS DURAS (nao alterar sem passar pelo Gate Central):
 *   1. Os sinais do SDK Leadster (`Etapa - N - <campo>`, `new_lead`, `Leadster-Lead`)
 *      sao INSUMO PROTEGIDO (contrato §1.4). Este script OBSERVA e nunca filtra,
 *      normaliza, adia ou bloqueia esses sinais. O modo de observacao padrao e
 *      leitura por cursor no dataLayer, justamente para nao substituir `push`.
 *   2. `page_view` NUNCA e espelhado ao lead-core (contrato §5.1 I1, §6.3).
 *   3. A decoracao `?eid=` so acrescenta query param, so em superficies de captacao
 *      declaradas, e nunca toca path, host, hash ou canonical (contrato §3.2).
 *   4. `ref` so entra em `wa.me` montado por codigo proprio (contrato §3.3a).
 *      Links do SDK Leadster ficam intocados (contrato §3.3b).
 *   5. Nenhum endpoint real de producao vem embutido. `coreEndpoint` nasce null:
 *      sem configuracao explicita, o espelho fica DESLIGADO.
 *   6. Sem PII no armazenamento e sem PII para midia (contrato §6.1).
 *   7. C3-CONTRACT-DECISION-PENDING: §1.5 e §4.2 sao incompativeis e o Gate ainda
 *      NAO julgou. `politicaEventIdJornada` NAO TEM PADRAO. Sem decisao explicita,
 *      este modulo FALHA FECHADO e nao emite evento canonico nenhum. Nenhuma das
 *      duas candidatas e "a arquitetura aprovada".
 *
 * Sem dependencias. ES5. Funciona como <script src> classico e como modulo em
 * Node (para os testes), via `module.exports.create(win, config)`.
 */
(function (globalScope) {
  'use strict';

  var VERSION = '1.0.0';

  /* ------------------------------------------------------------------ *
   * Vocabulario congelado (contrato §7 · vocabulario-clusters.csv)
   * 37 cluster_slug validados 1:1 contra a MATRIZ. Slug fora desta lista
   * NAO e emitido: cluster novo e CONTRATO-BLOQUEADO (contrato §1.1).
   * ------------------------------------------------------------------ */
  var CLUSTERS = ('amazon-marketplaces-conta-suspensa,casas-de-apostas-conta-bloqueada,' +
    'consumidor-cobranca-indevida,contas-bloqueadas-hub,familia-e-sucessoes,imobiliario,' +
    'facebook-meta-ads-conta-desativada,instagram-conta-hackeada,instagram-perfil-desativado,' +
    'institucional-marca,jogos-online-conta-banida,medicamento-alto-custo-negado,' +
    'mercado-livre-conta-suspensa,multas-transito-cnh,plano-saude-lutecio-177,' +
    'plano-saude-imunoglobulina,plano-saude-negativa-cobertura,previdenciario-beneficios-inss,' +
    'previdenciario-restituicao-inss,shopee-conta-suspensa,tiktok-conta-banida,trabalhista-fgts,' +
    'tributario-isencao-regularizacao,voos-cancelados-passageiro,whatsapp-numero-banido,' +
    'youtube-canal-suspenso,acerto-trabalhista,acidente-de-trabalho,' +
    'adicionais-insalubridade-periculosidade,advogado-trabalhista,aposentadoria-previdenciario,' +
    'bancarios,direitos-por-profissao,empregada-domestica,estabilidade-gestante,' +
    'motorista-caminhoneiro-motoboy,trabalho-sem-carteira-assinada').split(',');

  /* Clusters com `saude = sim`. Contrato §6.1: cluster/area de saude NAO saem
   * para plataforma de midia. Como o dataLayer alimenta GTM -> Meta/Google/OpenAI,
   * o corte acontece na origem: o push canonico omite cluster/area nesses casos.
   * A perna interna (lead-core) continua recebendo, por ser destino interno. */
  var CLUSTERS_SAUDE = ['medicamento-alto-custo-negado', 'plano-saude-lutecio-177',
    'plano-saude-imunoglobulina', 'plano-saude-negativa-cobertura'];

  var AREAS = ['digital', 'trabalhista', 'previdenciario', 'civel', 'tributario',
    'saude', 'institucional', 'indefinida'];

  /* ------------------------------------------------------------------ *
   * Eventos canonicos (contrato §1.2). Nenhum nome novo pode nascer aqui.
   * ------------------------------------------------------------------ */
  var EV_PAGE_VIEW = 'page_view';
  var EV_WHATSAPP = 'whatsapp_click';
  var EV_LEAD_STARTED = 'lead_started';
  var EV_LEAD_CREATED = 'lead_created';

  /* Eventos da jornada de captacao: sao os unicos espelhados ao lead-core
   * (contrato §5.1 I1) e os unicos que criam/consomem event_id de jornada (§1.5). */
  var EVENTOS_JORNADA = [EV_LEAD_STARTED, EV_WHATSAPP, EV_LEAD_CREATED];

  /* Sinais do SDK Leadster observados para a perna browser de `lead_created`
   * (contrato §1.2 gatilho (d)). Observados, nunca alterados. */
  var SINAIS_LEADSTER = ['Leadster-Lead', 'new_lead'];

  /* ------------------------------------------------------------------ *
   * C3-CONTRACT-DECISION-PENDING
   *
   * §1.5 e §4.2 do contrato congelado sao incompativeis entre si (ver
   * BLOQUEIOS/CONTRATO-BLOQUEADO-C-3.md e
   * measurement/contract-blockers/C3-event-id-reproduction.md).
   *
   * A Trilha C NAO escolhe a interpretacao. Este modulo aceita as duas
   * alternativas candidatas e NAO TEM PADRAO: sem decisao explicita do Gate,
   * ele FALHA FECHADO e nao emite nenhum evento canonico.
   * ------------------------------------------------------------------ */
  var CANDIDATE_A_LITERAL_CONTRACT = 'CANDIDATE_A_LITERAL_CONTRACT';
  var CANDIDATE_B_DEDICATED_JOURNEY_ID = 'CANDIDATE_B_DEDICATED_JOURNEY_ID';
  var CANDIDATAS_C3 = [CANDIDATE_A_LITERAL_CONTRACT, CANDIDATE_B_DEDICATED_JOURNEY_ID];
  var C3_PENDENTE = 'C3-CONTRACT-DECISION-PENDING';

  var CHAVE_ATTRIBUTION = 'ab_attribution_v1';   // localStorage (contrato §3.2)
  var CHAVE_JORNADA = 'ab_journey_v1';           // sessionStorage (interno)
  var CHAVE_ENVIADOS = 'ab_sent_v1';             // sessionStorage (interno, dedupe)

  /* Estado de nivel de JANELA, nao de instancia. Existe porque o script pode ser
   * carregado duas vezes (tag no HTML + tag no GTM, bundle duplicado, bfcache).
   * Sem isso, duas instancias vivas transformam UM gesto em DOIS eventos
   * canonicos — defeito que o harness de browser reproduziu. */
  var LOCK_LISTENERS = '__AB_ATTRIBUTION_LISTENERS__';
  var MAPA_GESTOS = '__AB_ATTRIBUTION_GESTOS__';

  var UTM_KEYS = ['source', 'medium', 'campaign', 'content', 'term'];
  var CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'ctwa_clid'];
  var CLICK_ID_ALIASES = { ctwa_clid: ['ctwa_clid', 'ctwaclid'] };

  var RE_UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

  /* Varredura de PII (contrato §6.1/§6.3): valores suspeitos sao DESCARTADOS,
   * nunca truncados nem "mascarados", e nunca logados. */
  var RE_EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;
  var RE_CPF_CNPJ = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b|\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/;

  var LIMITE_STRING = 512;

  var PADROES_CAPTURA_PADRAO = ['app.leadster.com.br/capture/'];
  var PADROES_WHATSAPP_PADRAO = ['wa.me/'];

  var DEFAULTS = {
    host: null,
    cluster: null,
    area: null,
    coreEndpoint: null,          // sem endpoint => espelho desligado (regra dura 5)
    coreKey: null,
    capturePatterns: null,       // default: PADROES_CAPTURA_PADRAO
    whatsappPatterns: null,      // default: PADROES_WHATSAPP_PADRAO
    decorateEid: true,
    propagateUtm: true,          // contrato §3.2: "mais os UTMs originais"
    waRefEnabled: true,
    waRefRequireOptIn: true,     // so decora wa.me com data-ab-ref (nunca o do SDK)
    autoPageView: true,
    observeLeadster: true,
    observeMode: 'poll',         // 'poll' (nao invasivo) | 'wrap' (opt-in explicito)
    observePollMs: 250,
    dataLayerName: 'dataLayer',
    skipAutomated: false,
    debug: false,
    maxTouchpoints: 20,
    maxStorageBytes: 8192,
    journeyTtlMinutes: 360,
    dedupeWindowMs: 1800000,     // 30 min: janela de supressao de replay de evento
    /* SEM PADRAO, de proposito. Valores aceitos:
     *   'CANDIDATE_A_LITERAL_CONTRACT'      leitura literal de §1.5
     *   'CANDIDATE_B_DEDICATED_JOURNEY_ID'  id de jornada dedicado
     * Nenhuma das duas e "a arquitetura aprovada" ate o Gate julgar o C-3.
     * null => FAIL CLOSED / CONFIGURATION REQUIRED. */
    politicaEventIdJornada: null,
    gestureDedupeMs: 1500,       // um gesto = um evento canonico
    attributionTtlDays: null,    // LACUNA DECLARADA: contrato nao define retencao
    healthClusters: null,
    now: null,
    uuid: null
  };

  /* ============================== utilitarios ============================== */

  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  function assign(alvo) {
    for (var i = 1; i < arguments.length; i++) {
      var src = arguments[i];
      if (!src) continue;
      for (var k in src) { if (has(src, k)) alvo[k] = src[k]; }
    }
    return alvo;
  }

  function indexOf(arr, v) {
    for (var i = 0; i < arr.length; i++) { if (arr[i] === v) return i; }
    return -1;
  }

  function pad(n, w) {
    var s = String(Math.abs(n));
    while (s.length < (w || 2)) s = '0' + s;
    return s;
  }

  /* ISO-8601 COM timezone e sem milissegundos (contrato §1.1, formato do exemplo). */
  function isoComOffset(d) {
    var off = -d.getTimezoneOffset();
    var sinal = off >= 0 ? '+' : '-';
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' +
      pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) +
      sinal + pad(Math.floor(Math.abs(off) / 60)) + ':' + pad(Math.abs(off) % 60);
  }

  function uuidV4(win) {
    var c = win && win.crypto;
    if (c && typeof c.randomUUID === 'function') {
      try { return String(c.randomUUID()).toLowerCase(); } catch (e) { /* segue */ }
    }
    var bytes;
    if (c && typeof c.getRandomValues === 'function') {
      bytes = new Uint8Array(16);
      c.getRandomValues(bytes);
    } else {
      bytes = [];
      for (var i = 0; i < 16; i++) bytes.push(Math.floor(Math.random() * 256));
    }
    bytes[6] = (bytes[6] & 0x0f) | 0x40;   // versao 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80;   // variante RFC 4122
    var hex = [];
    for (var j = 0; j < 16; j++) hex.push(pad(bytes[j].toString(16), 2));
    return (hex.slice(0, 4).join('') + '-' + hex.slice(4, 6).join('') + '-' +
      hex.slice(6, 8).join('') + '-' + hex.slice(8, 10).join('') + '-' +
      hex.slice(10, 16).join('')).toLowerCase();
  }

  function ehUuidV4(v) {
    return typeof v === 'string' && RE_UUID_V4.test(v.toLowerCase());
  }

  /* `ref` = primeiros 8 hex do event_id de jornada (contrato §3.4). */
  function refDoEventId(eventId) {
    if (!ehUuidV4(eventId)) return null;
    return eventId.toLowerCase().slice(0, 8);
  }

  function contemPII(v) {
    if (typeof v !== 'string' || !v) return false;
    if (RE_EMAIL.test(v)) return true;
    if (RE_CPF_CNPJ.test(v)) return true;
    var digitos = v.replace(/\D/g, '');
    if (digitos.length >= 10) return true;   // possivel telefone
    return false;
  }

  /* Higieniza qualquer string antes de armazenar/emitir: descarta PII, corta tamanho. */
  function limpar(v) {
    if (v === null || v === undefined) return null;
    var s = String(v);
    if (!s) return null;
    if (contemPII(s)) return null;
    if (s.length > LIMITE_STRING) s = s.slice(0, LIMITE_STRING);
    return s;
  }

  function parseQuery(qs) {
    var out = {};
    if (!qs) return out;
    if (qs.charAt(0) === '?') qs = qs.slice(1);
    var partes = qs.split('&');
    for (var i = 0; i < partes.length; i++) {
      if (!partes[i]) continue;
      var eq = partes[i].indexOf('=');
      var k = eq >= 0 ? partes[i].slice(0, eq) : partes[i];
      var v = eq >= 0 ? partes[i].slice(eq + 1) : '';
      try { k = decodeURIComponent(k.replace(/\+/g, ' ')); } catch (e) { /* mantem */ }
      try { v = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e2) { /* mantem */ }
      if (!has(out, k)) out[k] = v;
    }
    return out;
  }

  /* Referrer sem query e sem fragment (endurecimento de privacidade, contrato §6). */
  function referrerLimpo(ref) {
    if (!ref) return null;
    var s = String(ref);
    var corte = s.length;
    var q = s.indexOf('?'); if (q >= 0 && q < corte) corte = q;
    var h = s.indexOf('#'); if (h >= 0 && h < corte) corte = h;
    return limpar(s.slice(0, corte));
  }

  function jsonSeguro(txt) {
    try { return JSON.parse(txt); } catch (e) { return null; }
  }

  /* ======================= armazenamento tolerante a falha ======================= */

  function criarStorage(win, tipo) {
    var memoria = {};
    var nativo = null;
    try {
      nativo = win[tipo];
      var probe = '__ab_probe__';
      nativo.setItem(probe, '1');
      nativo.removeItem(probe);
    } catch (e) {
      nativo = null;   // Safari privado, storage bloqueado, iframe sem permissao
    }
    return {
      disponivel: !!nativo,
      get: function (k) {
        if (nativo) { try { return nativo.getItem(k); } catch (e) { /* cai pra memoria */ } }
        return has(memoria, k) ? memoria[k] : null;
      },
      set: function (k, v) {
        if (nativo) {
          try { nativo.setItem(k, v); return true; } catch (e) { /* cai pra memoria */ }
        }
        memoria[k] = v;
        return false;
      },
      del: function (k) {
        if (nativo) { try { nativo.removeItem(k); } catch (e) { /* segue */ } }
        delete memoria[k];
      }
    };
  }

  /* ================================ fabrica ================================ */

  function createAttribution(win, userConfig) {
    var cfg = assign({}, DEFAULTS, userConfig || {});
    var doc = win.document;
    var agora = cfg.now || function () { return new Date(); };
    var novoId = cfg.uuid || function () { return uuidV4(win); };
    var padroesCaptura = cfg.capturePatterns || PADROES_CAPTURA_PADRAO;
    var padroesWhatsapp = cfg.whatsappPatterns || PADROES_WHATSAPP_PADRAO;
    var clustersSaude = cfg.healthClusters || CLUSTERS_SAUDE;

    var local = criarStorage(win, 'localStorage');
    var sessao = criarStorage(win, 'sessionStorage');

    var diagnostico = {
      versao: VERSION,
      iniciado: false,
      cluster_invalido: null,
      area_invalida: null,
      storage_local: local.disponivel,
      storage_sessao: sessao.disponivel,
      attribution_recuperado: null,   // 'novo' | 'existente' | 'corrompido' | 'legado'
      touchpoints_descartados: 0,
      eventos_emitidos: 0,
      espelhos_enviados: 0,
      espelhos_suprimidos: 0,
      espelho_desligado: !cfg.coreEndpoint,
      pii_descartada: 0,
      observador_leadster: null,
      listeners: null,
      c3_status: null,
      politica_event_id_jornada: cfg.politicaEventIdJornada || null
    };

    var tokenDaInstancia = 'ab-' + Math.random().toString(36).slice(2) + '-' + VERSION;
    var gestos = {};          // dedupe de gesto: chave -> timestamp (promovido a janela)
    var descarregando = false;
    var timerObservador = null;
    var cursorDataLayer = 0;
    var listenersLigados = false;

    /* C3-CONTRACT-DECISION-PENDING — FAIL CLOSED / CONFIGURATION REQUIRED.
     * Sem decisao do Gate, o modulo nao escolhe interpretacao e nao emite nada.
     * Emitir so `page_view` (que nao depende do C-3) seria inventar uma TERCEIRA
     * alternativa; o estado fica unico e inequivoco. */
    function politicaC3Definida() {
      return indexOf(CANDIDATAS_C3, cfg.politicaEventIdJornada) !== -1;
    }

    function reclamarConfiguracao(contexto) {
      diagnostico.c3_status = C3_PENDENTE;
      if (win.console && win.console.error) {
        win.console.error('[attribution] ' + C3_PENDENTE + ': CONFIGURATION REQUIRED. ' +
          'Nenhum evento canonico foi emitido em ' + contexto + '. ' +
          'Defina AB_MEASUREMENT_CONFIG.politicaEventIdJornada como ' +
          CANDIDATE_A_LITERAL_CONTRACT + ' ou ' + CANDIDATE_B_DEDICATED_JOURNEY_ID +
          ' APOS o Gate julgar o CONTRATO-BLOQUEADO-C-3. A Trilha C nao tem padrao ' +
          'porque a interpretacao de §1.5 x §4.2 nao foi decidida.');
      }
    }

    function log() {
      if (!cfg.debug || !win.console || !win.console.log) return;
      var args = ['[attribution]'];
      for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
      win.console.log.apply(win.console, args);
    }

    /* ------------------------- validacao de vocabulario ------------------------- */

    function clusterValido() {
      if (!cfg.cluster) return null;
      if (indexOf(CLUSTERS, cfg.cluster) === -1) {
        diagnostico.cluster_invalido = cfg.cluster;
        log('cluster fora do vocabulario congelado, nao sera emitido:', cfg.cluster);
        return null;
      }
      return cfg.cluster;
    }

    function areaValida() {
      if (!cfg.area) return null;
      if (indexOf(AREAS, cfg.area) === -1) {
        diagnostico.area_invalida = cfg.area;
        return null;
      }
      return cfg.area;
    }

    function clusterEhSaude() {
      var c = clusterValido();
      return !!c && indexOf(clustersSaude, c) !== -1;
    }

    /* ------------------------------- attribution ------------------------------- */

    function leituraAtual() {
      var loc = win.location;
      var q = parseQuery(loc.search || '');
      var utm = {}, cliques = {};
      var i, k;
      for (i = 0; i < UTM_KEYS.length; i++) {
        k = UTM_KEYS[i];
        var bruto = has(q, 'utm_' + k) ? q['utm_' + k] : null;
        var v = limpar(bruto);
        if (bruto && !v) diagnostico.pii_descartada++;
        utm[k] = v;
      }
      for (i = 0; i < CLICK_ID_KEYS.length; i++) {
        k = CLICK_ID_KEYS[i];
        var nomes = CLICK_ID_ALIASES[k] || [k];
        var achado = null;
        for (var j = 0; j < nomes.length; j++) {
          if (has(q, nomes[j]) && q[nomes[j]]) { achado = q[nomes[j]]; break; }
        }
        cliques[k] = limpar(achado);
      }
      return {
        utm: utm,
        click_ids: cliques,
        referrer: referrerLimpo(doc && doc.referrer),
        landing_page: limpar(loc.pathname || '/')
      };
    }

    function attributionNovo(atual) {
      return {
        first_touch_at: isoComOffset(agora()),
        landing_page: atual.landing_page,
        referrer: atual.referrer,
        utm: assign({}, atual.utm),
        click_ids: assign({}, atual.click_ids),
        touchpoints: [],
        event_id_origin: 'browser',
        eid_propagado: false,
        regime: atual.click_ids.ctwa_clid ? 'ctwa' : 'web'
      };
    }

    function ultimoConhecido(attr) {
      /* Base de comparacao para decidir se ha toque NOVO: o toque mais recente
       * conhecido (ultimo touchpoint) ou, na ausencia dele, o primeiro toque. */
      var base = { utm: attr.utm || {}, click_ids: attr.click_ids || {} };
      if (attr.touchpoints && attr.touchpoints.length) {
        var t = attr.touchpoints[attr.touchpoints.length - 1];
        base = {
          utm: assign({}, attr.utm || {}, t.utm || {}),
          click_ids: assign({}, attr.click_ids || {}, t.click_ids || {})
        };
      }
      return base;
    }

    /* Contrato §3.1: toque posterior com utm_source novo OU click id novo entra
     * em touchpoints (append). Mesma origem repetida NAO gera touchpoint. */
    function calcularToqueNovo(attr, atual) {
      var base = ultimoConhecido(attr);
      var novoUtm = {}, novoCliques = {}, mudou = false;
      if (atual.utm.source && atual.utm.source !== base.utm.source) {
        mudou = true;
        for (var i = 0; i < UTM_KEYS.length; i++) {
          if (atual.utm[UTM_KEYS[i]]) novoUtm[UTM_KEYS[i]] = atual.utm[UTM_KEYS[i]];
        }
      }
      for (var j = 0; j < CLICK_ID_KEYS.length; j++) {
        var k = CLICK_ID_KEYS[j];
        if (atual.click_ids[k] && atual.click_ids[k] !== base.click_ids[k]) {
          mudou = true;
          novoCliques[k] = atual.click_ids[k];
        }
      }
      if (!mudou) return null;
      return {
        at: isoComOffset(agora()),
        utm: novoUtm,
        click_ids: novoCliques,
        referrer: atual.referrer,
        landing_page: atual.landing_page
      };
    }

    function podarTouchpoints(attr) {
      var max = cfg.maxTouchpoints;
      while (attr.touchpoints.length > max) {
        attr.touchpoints.shift();
        diagnostico.touchpoints_descartados++;
      }
      /* Guarda de tamanho: nenhum crescimento infinito, mesmo com URLs absurdas. */
      while (attr.touchpoints.length > 1 &&
             JSON.stringify(attr).length > cfg.maxStorageBytes) {
        attr.touchpoints.shift();
        diagnostico.touchpoints_descartados++;
      }
      return attr;
    }

    function attributionExpirou(attr) {
      if (!cfg.attributionTtlDays) return false;   // LACUNA: contrato nao define
      var t = Date.parse(attr.first_touch_at);
      if (isNaN(t)) return false;
      return (agora().getTime() - t) > cfg.attributionTtlDays * 86400000;
    }

    function carregarAttribution() {
      var cru = local.get(CHAVE_ATTRIBUTION);
      if (!cru) return { attr: null, estado: 'novo' };
      var obj = jsonSeguro(cru);
      if (!obj || typeof obj !== 'object') return { attr: null, estado: 'corrompido' };
      /* Formato atual: {v:1, attribution:{...}}. Formato legado tolerado:
       * o proprio objeto §3.1 gravado na raiz. */
      var attr = null, estado = 'existente';
      if (obj.v === 1 && obj.attribution && typeof obj.attribution === 'object') {
        attr = obj.attribution;
      } else if (obj.first_touch_at || obj.utm || obj.click_ids) {
        attr = obj;
        estado = 'legado';
      } else {
        return { attr: null, estado: 'corrompido' };
      }
      /* Saneia estrutura de um registro possivelmente truncado/adulterado. */
      if (typeof attr.first_touch_at !== 'string') return { attr: null, estado: 'corrompido' };
      if (!attr.utm || typeof attr.utm !== 'object') attr.utm = {};
      if (!attr.click_ids || typeof attr.click_ids !== 'object') attr.click_ids = {};
      if (Object.prototype.toString.call(attr.touchpoints) !== '[object Array]') attr.touchpoints = [];
      for (var i = 0; i < UTM_KEYS.length; i++) {
        if (!has(attr.utm, UTM_KEYS[i])) attr.utm[UTM_KEYS[i]] = null;
      }
      for (var j = 0; j < CLICK_ID_KEYS.length; j++) {
        if (!has(attr.click_ids, CLICK_ID_KEYS[j])) attr.click_ids[CLICK_ID_KEYS[j]] = null;
      }
      if (attr.event_id_origin !== 'server') attr.event_id_origin = 'browser';
      if (typeof attr.eid_propagado !== 'boolean') attr.eid_propagado = false;
      if (indexOf(['web', 'ctwa', 'wa_link'], attr.regime) === -1) attr.regime = 'web';
      if (attributionExpirou(attr)) return { attr: null, estado: 'novo' };
      return { attr: attr, estado: estado };
    }

    function salvarAttribution(attr) {
      local.set(CHAVE_ATTRIBUTION, JSON.stringify({ v: 1, attribution: attr }));
    }

    var attribution = null;

    function iniciarAttribution() {
      var atual = leituraAtual();
      var carregado = carregarAttribution();
      diagnostico.attribution_recuperado = carregado.estado;
      if (!carregado.attr) {
        attribution = attributionNovo(atual);           // PRIMEIRO TOQUE
      } else {
        attribution = carregado.attr;                   // primeiro toque e IMUTAVEL
        var toque = calcularToqueNovo(attribution, atual);
        if (toque) {
          attribution.touchpoints.push(toque);
          if (toque.click_ids && toque.click_ids.ctwa_clid) attribution.regime = 'ctwa';
        }
      }
      podarTouchpoints(attribution);
      salvarAttribution(attribution);
      return attribution;
    }

    /* Objeto emitido no envelope: exatamente as chaves do contrato §3.1. */
    function attributionParaEnvelope() {
      return {
        first_touch_at: attribution.first_touch_at,
        landing_page: attribution.landing_page,
        referrer: attribution.referrer,
        utm: assign({}, attribution.utm),
        click_ids: assign({}, attribution.click_ids),
        touchpoints: attribution.touchpoints.slice(0),
        event_id_origin: attribution.event_id_origin,
        eid_propagado: !!attribution.eid_propagado,
        regime: attribution.regime
      };
    }

    function marcarPropagado() {
      if (attribution && !attribution.eid_propagado) {
        attribution.eid_propagado = true;
        salvarAttribution(attribution);
      }
    }

    /* ---------------------------- event_id de jornada ---------------------------- */
    /* Contrato §1.5: UM event_id por ato de captacao. Nasce no primeiro evento
     * browser do caminho de captacao, viaja no `?eid=`, deriva o `ref` e e
     * reutilizado como event_id do `lead_created` nas duas pernas.            */

    function lerJornada() {
      var obj = jsonSeguro(sessao.get(CHAVE_JORNADA));
      if (!obj || typeof obj !== 'object' || !ehUuidV4(obj.id)) return null;
      if (!obj.emitted || typeof obj.emitted !== 'object') obj.emitted = {};
      var nascida = Date.parse(obj.started_at);
      if (!isNaN(nascida) && (agora().getTime() - nascida) > cfg.journeyTtlMinutes * 60000) {
        return null;   // jornada expirada: novo ato de captacao merece novo id
      }
      return obj;
    }

    function salvarJornada(j) { sessao.set(CHAVE_JORNADA, JSON.stringify(j)); }

    function adotarEidDaUrl() {
      var q = parseQuery(win.location.search || '');
      var recebido = q.eid ? String(q.eid).toLowerCase() : null;
      if (!recebido || !ehUuidV4(recebido)) return false;
      var j = lerJornada();
      if (j && j.id === recebido) { marcarPropagado(); return true; }
      /* Contrato §1.5: adotar o `eid` recebido em vez de gerar um novo. */
      salvarJornada({ id: recebido, started_at: isoComOffset(agora()), closed_at: null,
        origem: 'eid_recebido', emitted: {} });
      marcarPropagado();
      return true;
    }

    function jornadaAtual() {
      var j = lerJornada();
      return j && !j.closed_at ? j : null;
    }

    /* Cunha o event_id de jornada no primeiro evento do caminho de captacao.
     * Ver o bloco CONTRATO-BLOQUEADO-C-3 em montarEnvelope para o porque de o id
     * ser dedicado e nao o event_id de envelope daquele evento. */
    function garantirJornada() {
      var j = jornadaAtual();
      if (j) return j;
      var novo = { id: novoId(), started_at: isoComOffset(agora()), closed_at: null,
        origem: 'browser', emitted: {} };
      salvarJornada(novo);
      return novo;
    }

    function jornadaOuUltima() {
      return lerJornada();   // inclui a fechada, para supressao de replay
    }

    function refAtual() {
      var j = jornadaAtual();
      return j ? refDoEventId(j.id) : null;
    }

    /* --------------------------------- dedupe --------------------------------- */

    function lerEnviados() {
      var o = jsonSeguro(sessao.get(CHAVE_ENVIADOS));
      return (o && typeof o === 'object') ? o : {};
    }

    function jaEnviado(eventId) {
      var m = lerEnviados();
      var t = m[eventId];
      if (!t) return false;
      return (agora().getTime() - t) < cfg.dedupeWindowMs;
    }

    function marcarEnviado(eventId) {
      var m = lerEnviados();
      m[eventId] = agora().getTime();
      var chaves = [];
      for (var k in m) { if (has(m, k)) chaves.push(k); }
      if (chaves.length > 50) {
        chaves.sort(function (a, b) { return m[a] - m[b]; });
        for (var i = 0; i < chaves.length - 50; i++) delete m[chaves[i]];
      }
      sessao.set(CHAVE_ENVIADOS, JSON.stringify(m));
    }

    /* Um gesto do usuario = um evento canonico, mesmo com listeners duplicados
     * ou com o script carregado duas vezes. O mapa vive na JANELA justamente
     * para atravessar instancias. */
    function mapaDeGestos() {
      if (!win[MAPA_GESTOS]) win[MAPA_GESTOS] = gestos;
      return win[MAPA_GESTOS];
    }

    function gestoRepetido(chave) {
      var mapa = mapaDeGestos();
      var t = agora().getTime();
      var anterior = mapa[chave];
      mapa[chave] = t;
      return !!anterior && (t - anterior) < cfg.gestureDedupeMs;
    }

    /* Eventos que so podem ocorrer uma vez por jornada.
     * `lead_created` compara contra a jornada ABERTA OU A ULTIMA FECHADA: e assim
     * que um `Leadster-Lead` repetido deixa de virar um segundo lead.
     * `lead_started` compara apenas contra a jornada ABERTA: depois de um lead
     * criado, um novo ato de captacao no mesmo tab e legitimo e deve ser medido. */
    function jaEmitidoNaJornada(nome) {
      var j = (nome === EV_LEAD_CREATED) ? jornadaOuUltima() : jornadaAtual();
      if (!j || !j.emitted) return false;
      var t = Date.parse(j.emitted[nome]);
      if (isNaN(t)) return false;
      return (agora().getTime() - t) < cfg.dedupeWindowMs;
    }

    function registrarEmissaoNaJornada(nome, jornada) {
      if (!jornada) return;
      jornada.emitted[nome] = isoComOffset(agora());
      if (nome === EV_LEAD_CREATED) jornada.closed_at = isoComOffset(agora());
      salvarJornada(jornada);
    }

    /* ------------------------------- envelope §1.1 ------------------------------- */

    /* Contrato §2.4 lido no sentido inverso: `origem_captacao` -> `source` do envelope.
     * `wa_link` NAO tem token de `source` no enum do §1.1 — ver
     * BLOQUEIOS/CONTRATO-BLOQUEADO-C-1.md. Nao inventamos valor: cai em 'browser'
     * e o caso fica fora da fixture ate o Gate decidir. */
    function sourceDaOrigem(origem) {
      if (origem === 'form_nativo') return 'native_form';
      if (origem === 'quiz') return 'quiz';
      return 'browser';
    }

    function jornadaSemEmissao(j) {
      if (!j || !j.emitted) return true;
      for (var k in j.emitted) { if (has(j.emitted, k)) return false; }
      return true;
    }

    /* ------------------------------------------------------------------ *
     * CONTRATO-BLOQUEADO-C-3 — ler antes de mexer.
     *
     * §1.5 lido ao pe da letra diz que o event_id de jornada E o event_id de
     * envelope do primeiro evento do caminho de captacao. Combinado com §4.2
     * (chave unica = event_id; replay nao altera estado), isso faz o
     * `lead_created` chegar ao lead-core com o MESMO id do `lead_started` e ser
     * descartado como replay: o lead nunca e criado. O mesmo vale para o dedupe
     * por event_id do Meta.
     *
     * CANDIDATE_A_LITERAL_CONTRACT: o primeiro evento do caminho de captacao
     * CARREGA o id de jornada como seu event_id de envelope.
     * CANDIDATE_B_DEDICATED_JOURNEY_ID: o id de jornada e um identificador
     * proprio; so `lead_created` (as duas pernas) o carrega como event_id.
     *
     * A Trilha C nao decide qual vale. Sem decisao configurada, `emitir()` nao
     * chega ate aqui: o modulo ja falhou fechado.
     * ------------------------------------------------------------------ */
    function montarEnvelope(nome, extras) {
      var ownId = novoId();
      var jornada = null;
      if (indexOf(EVENTOS_JORNADA, nome) !== -1) jornada = garantirJornada();
      var literal = cfg.politicaEventIdJornada === CANDIDATE_A_LITERAL_CONTRACT;
      var primeiroDaJornada = literal && !!jornada && jornadaSemEmissao(jornada);
      var eventId = (jornada && (nome === EV_LEAD_CREATED || primeiroDaJornada))
        ? jornada.id : ownId;

      var base = {
        event: nome,
        event_id: eventId,
        occurred_at: isoComOffset(agora()),
        source: (extras && extras.source) || 'browser',
        host: cfg.host || (win.location && win.location.hostname) || null,
        page: (win.location && win.location.pathname) || '/'
      };
      var c = clusterValido(), a = areaValida();
      var saude = clusterEhSaude();
      var envMidia = assign({}, base);
      var envInterno = assign({}, base);
      if (c) { envInterno.cluster = c; if (!saude) envMidia.cluster = c; }
      if (a) { envInterno.area = a; if (!saude) envMidia.area = a; }
      var attr = attributionParaEnvelope();
      envMidia.attribution = attr;
      envInterno.attribution = attr;
      /* PRIVACIDADE (contrato §6.1): o objeto `lead` carrega nome/telefone/email e
       * respostas de qualificacao. O dataLayer alimenta GTM -> Meta/Google/OpenAI,
       * entao `lead` NUNCA entra na perna de midia. Ele existe apenas na perna
       * interna, destinada ao lead-core (interface I2). */
      if (extras && extras.lead) envInterno.lead = extras.lead;
      return { midia: envMidia, interno: envInterno, jornada: jornada, ownEventId: ownId,
        carve_out_saude: saude };
    }

    /* ------------------------------ dataLayer push ------------------------------ */

    function dataLayer() {
      var nome = cfg.dataLayerName;
      win[nome] = win[nome] || [];
      return win[nome];
    }

    function pushCanonico(envelope) {
      dataLayer().push(envelope);
    }

    /* ---------------------------- espelho ao lead-core ---------------------------- */
    /* Contrato §5.1 I1/I2: chave publica no CORPO (campo `k`), nunca em header —
     * headers customizados sao incompativeis com sendBeacon.                       */

    function corpoParaCore(envelope) {
      var corpo = assign({}, envelope);
      if (cfg.coreKey) corpo.k = cfg.coreKey;
      return JSON.stringify(corpo);
    }

    function enviarPorBeacon(url, corpo) {
      if (!win.navigator || typeof win.navigator.sendBeacon !== 'function') return false;
      try {
        /* text/plain evita preflight CORS, que e inviavel durante unload.
         * O lead-core aceita o corpo como JSON independentemente do Content-Type
         * (item declarado ao Gate 1 na interface B×C). */
        var payload = corpo;
        if (typeof win.Blob === 'function') {
          payload = new win.Blob([corpo], { type: 'text/plain;charset=UTF-8' });
        }
        return !!win.navigator.sendBeacon(url, payload);
      } catch (e) { return false; }
    }

    function enviarPorFetch(url, corpo) {
      if (typeof win.fetch !== 'function') return false;
      try {
        win.fetch(url, {
          method: 'POST',
          keepalive: true,
          mode: 'cors',
          credentials: 'omit',
          headers: { 'Content-Type': 'application/json' },
          body: corpo
        })['catch'](function () { /* nunca bloqueia UX; perda > duplicacao */ });
        return true;
      } catch (e) { return false; }
    }

    /* Uma unica entrega logica por event_id. Nunca fetch E sendBeacon como duas
     * entregas independentes: o beacon so entra como transporte de descarga
     * (unload) ou como fallback quando o fetch nao existe/falha na largada. */
    function espelhar(envelope, rota) {
      if (envelope.event === EV_PAGE_VIEW) return 'nao_espelhado_por_contrato';
      if (indexOf(EVENTOS_JORNADA, envelope.event) === -1) return 'fora_da_jornada';
      if (!cfg.coreEndpoint) { diagnostico.espelhos_suprimidos++; return 'sem_endpoint'; }
      if (jaEnviado(envelope.event_id)) {
        diagnostico.espelhos_suprimidos++;
        return 'duplicado_suprimido';
      }
      marcarEnviado(envelope.event_id);   // marca ANTES de despachar
      var url = cfg.coreEndpoint + (rota || '/v1/events');
      var corpo = corpoParaCore(envelope);
      var ok;
      if (descarregando) {
        ok = enviarPorBeacon(url, corpo) || enviarPorFetch(url, corpo);
        diagnostico.espelhos_enviados++;
        return ok ? 'beacon' : 'falhou';
      }
      ok = enviarPorFetch(url, corpo);
      if (!ok) ok = enviarPorBeacon(url, corpo);
      diagnostico.espelhos_enviados++;
      return ok ? 'fetch' : 'falhou';
    }

    /* --------------------------------- emissao --------------------------------- */

    function emitir(nome, opcoes) {
      opcoes = opcoes || {};
      if (!politicaC3Definida()) { reclamarConfiguracao('emitir(' + nome + ')'); return null; }
      if (indexOf([EV_PAGE_VIEW, EV_WHATSAPP, EV_LEAD_STARTED, EV_LEAD_CREATED], nome) === -1) {
        log('evento fora da taxonomia canonica ignorado:', nome);
        return null;
      }
      /* Supressao de replay ANTES de resolver jornada: um `lead_created` repetido
       * nao pode abrir jornada nova nem virar segundo lead. */
      if ((nome === EV_LEAD_CREATED || nome === EV_LEAD_STARTED) && jaEmitidoNaJornada(nome)) {
        log('suprimido (ja emitido nesta jornada):', nome);
        return null;
      }
      if (opcoes.gesto && gestoRepetido(opcoes.gesto)) {
        log('suprimido (gesto repetido):', nome, opcoes.gesto);
        return null;
      }

      var m = montarEnvelope(nome, opcoes);
      pushCanonico(m.midia);
      var resultadoEspelho = espelhar(m.interno, opcoes.rota);
      registrarEmissaoNaJornada(nome, m.jornada);
      diagnostico.eventos_emitidos++;
      log('emitido', nome, m.midia.event_id, resultadoEspelho);
      return { envelope: m.midia, envelope_interno: m.interno, espelho: resultadoEspelho,
        journey_id: m.jornada ? m.jornada.id : null };
    }

    /* ------------------------------- decoracao URL ------------------------------- */
    /* Contrato §3.2: acrescenta APENAS query params. Nunca path, host ou hash.
     * Restrita as superficies de captacao: nenhum link editorial e decorado.     */

    function ehSuperficieDeCaptura(href) {
      if (!href) return false;
      for (var i = 0; i < padroesCaptura.length; i++) {
        var p = padroesCaptura[i];
        if (p instanceof RegExp) { if (p.test(href)) return true; }
        else if (href.indexOf(p) !== -1) return true;
      }
      return false;
    }

    function ehLinkWhatsapp(href) {
      if (!href) return false;
      for (var i = 0; i < padroesWhatsapp.length; i++) {
        if (href.indexOf(padroesWhatsapp[i]) !== -1) return true;
      }
      return false;
    }

    function decorarUrl(rawUrl, eid) {
      if (!rawUrl || !eid) return rawUrl;
      var hashIdx = rawUrl.indexOf('#');
      var hash = hashIdx >= 0 ? rawUrl.slice(hashIdx) : '';
      var semHash = hashIdx >= 0 ? rawUrl.slice(0, hashIdx) : rawUrl;
      var qIdx = semHash.indexOf('?');
      var caminho = qIdx >= 0 ? semHash.slice(0, qIdx) : semHash;
      var query = qIdx >= 0 ? semHash.slice(qIdx + 1) : '';

      var partes = query ? query.split('&') : [];
      var existentes = {}, i;
      for (i = 0; i < partes.length; i++) {
        if (!partes[i]) continue;
        var eq = partes[i].indexOf('=');
        existentes[eq >= 0 ? partes[i].slice(0, eq) : partes[i]] = true;
      }
      if (!existentes.eid) partes.push('eid=' + encodeURIComponent(eid));

      /* Contrato §3.2: "mais os UTMs originais quando presentes na URL corrente". */
      if (cfg.propagateUtm) {
        var atual = parseQuery(win.location.search || '');
        for (i = 0; i < UTM_KEYS.length; i++) {
          var nome = 'utm_' + UTM_KEYS[i];
          if (atual[nome] && !existentes[nome]) {
            var v = limpar(atual[nome]);
            if (v) partes.push(nome + '=' + encodeURIComponent(v));
          }
        }
      }
      var novaQuery = [];
      for (i = 0; i < partes.length; i++) { if (partes[i]) novaQuery.push(partes[i]); }
      return caminho + (novaQuery.length ? '?' + novaQuery.join('&') : '') + hash;
    }

    /* ----------------------------- `ref` no texto wa.me ----------------------------- */
    /* Contrato §3.3(a)/§3.4: mensagem natural terminando em ` [cod <ref>]`.
     * Somente em wa.me montado por codigo proprio.                              */

    function textoComRef(mensagem, ref) {
      var r = ref || refAtual();
      if (!r) return mensagem || '';
      var base = String(mensagem || '');
      if (new RegExp('\\[cod\\s+' + r + '\\]', 'i').test(base)) return base;  // nao duplica
      return (base ? base.replace(/\s+$/, '') + ' ' : '') + '[cod ' + r + ']';
    }

    function decorarLinkWhatsapp(href, ref) {
      var r = ref || refAtual();
      if (!r || !href) return href;
      var hashIdx = href.indexOf('#');
      var hash = hashIdx >= 0 ? href.slice(hashIdx) : '';
      var semHash = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
      var qIdx = semHash.indexOf('?');
      var caminho = qIdx >= 0 ? semHash.slice(0, qIdx) : semHash;
      var query = qIdx >= 0 ? semHash.slice(qIdx + 1) : '';
      var q = parseQuery(query);
      q.text = textoComRef(q.text || '', r);
      var partes = [];
      for (var k in q) {
        if (has(q, k)) partes.push(encodeURIComponent(k) + '=' + encodeURIComponent(q[k]));
      }
      return caminho + (partes.length ? '?' + partes.join('&') : '') + hash;
    }

    /* --------------------------------- listeners --------------------------------- */

    function anchorDoEvento(ev) {
      var alvo = ev.target;
      if (!alvo) return null;
      if (alvo.closest) return alvo.closest('a[href]');
      /* fallback para ambientes sem Element.closest */
      while (alvo && alvo.nodeType === 1) {
        if (alvo.tagName === 'A' && alvo.getAttribute('href')) return alvo;
        alvo = alvo.parentNode;
      }
      return null;
    }

    function aoClicar(ev) {
      var a = anchorDoEvento(ev);
      if (!a) return;
      var href = a.getAttribute('href') || '';

      if (ehSuperficieDeCaptura(href)) {
        /* Ordem importa: a jornada e a decoracao vem ANTES da emissao, para que o
         * `lead_started` ja saia com `eid_propagado: true` e com o mesmo event_id
         * que viajou no CTA (contrato §1.5 + §3.2). */
        var j = garantirJornada();
        if (cfg.decorateEid) {
          var decorado = decorarUrl(href, j.id);
          if (decorado !== href) {
            a.setAttribute('href', decorado);   // so query; path/hash preservados
            marcarPropagado();
          }
        }
        emitir(EV_LEAD_STARTED, { gesto: 'captura:' + href });
        return;
      }

      if (ehLinkWhatsapp(href)) {
        /* Contrato §3.3: `ref` SOMENTE em wa.me montado por codigo proprio.
         * O link do SDK Leadster e observado, nunca decorado. */
        var optIn = a.getAttribute && a.getAttribute('data-ab-ref') !== null;
        var podeDecorar = cfg.waRefEnabled && (optIn || !cfg.waRefRequireOptIn);
        if (podeDecorar) {
          var jw = garantirJornada();
          var novoHref = decorarLinkWhatsapp(href, refDoEventId(jw.id));
          if (novoHref !== href) { a.setAttribute('href', novoHref); marcarPropagado(); }
        }
        emitir(EV_WHATSAPP, { gesto: 'wa:' + href });
      }
    }

    /* Observacao do SDK Leadster (contrato §1.2 gatilho (d), §1.4 sinal protegido).
     * Modo padrao 'poll': le o dataLayer por cursor, sem substituir `push`. */
    function entradaEhSinalLeadster(entrada) {
      if (!entrada || typeof entrada !== 'object') return null;
      var ehArrayLike = typeof entrada.length === 'number';
      /* forma dataLayer.push({event: 'Leadster-Lead'}) */
      if (!ehArrayLike && entrada.event &&
          indexOf(SINAIS_LEADSTER, entrada.event) !== -1) return entrada.event;
      /* forma gtag('event','new_lead',{...}), que chega ao dataLayer como arguments */
      if (ehArrayLike && entrada[0] === 'event' &&
          indexOf(SINAIS_LEADSTER, entrada[1]) !== -1) return entrada[1];
      return null;
    }

    function varrerDataLayer() {
      var dl = dataLayer();
      while (cursorDataLayer < dl.length) {
        var entrada = dl[cursorDataLayer++];
        var sinal = entradaEhSinalLeadster(entrada);
        if (sinal) {
          log('sinal Leadster observado (nao alterado):', sinal);
          /* Perna browser de `lead_created`: observacional. A autoridade de
           * existencia do lead permanece no lead-core (contrato §4.1). */
          emitir(EV_LEAD_CREATED, { gesto: 'leadster:' + sinal });
        }
      }
    }

    function ligarObservadorLeadster() {
      if (!cfg.observeLeadster) return;
      if (cfg.observeMode === 'wrap') {
        var dl = dataLayer();
        var original = dl.push;
        dl.push = function () {
          var r = original.apply(dl, arguments);   // sinal original SEMPRE primeiro
          try { varrerDataLayer(); } catch (e) { /* nunca afeta o sinal protegido */ }
          return r;
        };
        diagnostico.observador_leadster = 'wrap';
      } else {
        varrerDataLayer();
        timerObservador = win.setInterval(function () {
          try { varrerDataLayer(); } catch (e) { /* silencioso por desenho */ }
        }, cfg.observePollMs);
        diagnostico.observador_leadster = 'poll';
      }
    }

    function aoDescarregar() {
      descarregando = true;
      /* Nada e reenviado aqui: eventos ja despachados estao em `ab_sent_v1`.
       * A descarga existe para eventos criados DURANTE o unload. */
    }

    function ligarListeners() {
      if (listenersLigados) return;
      /* Trava de janela: apenas UMA instancia liga os listeners do documento.
       * Uma segunda copia do script continua servindo para leitura e para emissao
       * explicita, mas nao duplica a captura de gestos. */
      if (win[LOCK_LISTENERS]) {
        diagnostico.listeners = 'nao_ligados: outra instancia ja detem a trava';
        return;
      }
      win[LOCK_LISTENERS] = tokenDaInstancia;
      listenersLigados = true;
      diagnostico.listeners = 'ligados';
      if (!doc || !doc.addEventListener) return;
      doc.addEventListener('click', aoClicar, true);
      if (win.addEventListener) {
        win.addEventListener('pagehide', aoDescarregar, false);
        win.addEventListener('beforeunload', aoDescarregar, false);
      }
      if (doc.addEventListener) {
        doc.addEventListener('visibilitychange', function () {
          if (doc.visibilityState === 'hidden') aoDescarregar();
        }, false);
      }
    }

    /* ---------------------------------- init ---------------------------------- */

    function ehAutomatizado() {
      var nav = win.navigator || {};
      if (nav.webdriver) return true;
      var ua = String(nav.userAgent || '');
      return /Chrome-Lighthouse|HeadlessChrome|Lightrider/i.test(ua);
    }

    function init() {
      if (diagnostico.iniciado) return api;   // idempotente
      if (cfg.skipAutomated && ehAutomatizado()) {
        diagnostico.iniciado = 'pulado_automatizado';
        return api;
      }
      if (!politicaC3Definida()) {
        reclamarConfiguracao('init()');
        diagnostico.iniciado = 'bloqueado_c3';
        return api;      // nenhum listener, nenhum observador, nenhum evento
      }
      diagnostico.c3_status = 'DECIDIDO_POR_CONFIGURACAO: ' + cfg.politicaEventIdJornada;
      diagnostico.iniciado = true;
      iniciarAttribution();
      adotarEidDaUrl();
      ligarListeners();
      ligarObservadorLeadster();
      if (cfg.autoPageView) emitir(EV_PAGE_VIEW, { gesto: 'page_view:' + win.location.pathname });
      return api;
    }

    function destruir() {
      if (timerObservador) { win.clearInterval(timerObservador); timerObservador = null; }
      if (doc && doc.removeEventListener) doc.removeEventListener('click', aoClicar, true);
      if (win[LOCK_LISTENERS] === tokenDaInstancia) win[LOCK_LISTENERS] = null;
      listenersLigados = false;
      diagnostico.iniciado = false;
      diagnostico.listeners = 'destruidos';
    }

    /* --------------------------------- API publica --------------------------------- */

    var api = {
      VERSION: VERSION,
      C3_PENDENTE: C3_PENDENTE,
      CANDIDATE_A_LITERAL_CONTRACT: CANDIDATE_A_LITERAL_CONTRACT,
      CANDIDATE_B_DEDICATED_JOURNEY_ID: CANDIDATE_B_DEDICATED_JOURNEY_ID,
      politicaC3Definida: politicaC3Definida,
      init: init,
      destruir: destruir,
      config: cfg,

      /* leitura */
      getAttribution: function () { return attribution ? attributionParaEnvelope() : null; },
      getJourneyId: function () { var j = jornadaAtual(); return j ? j.id : null; },
      getRef: refAtual,
      getDiagnostico: function () { return assign({}, diagnostico); },

      /* emissao explicita (usada pelos patches dos formularios proprios) */
      emitir: emitir,
      pageView: function () { return emitir(EV_PAGE_VIEW); },
      leadStarted: function (o) { return emitir(EV_LEAD_STARTED, o); },
      whatsappClick: function (o) { return emitir(EV_WHATSAPP, o); },
      /* Perna browser de `lead_created`. Observacional por contrato: a autoridade
       * de existencia do lead e o lead-core (§4.1). */
      leadCreatedBrowser: function (o) { return emitir(EV_LEAD_CREATED, o); },
      /* POST direto do formulario proprio/quiz (interface I2, rota /v1/leads).
       * O `source` do envelope e derivado de `lead.origem_captacao` pelo mapa do
       * contrato §2.4 lido no sentido inverso; nao e escolha livre do integrador. */
      leadCreatedComLead: function (lead, o) {
        return emitir(EV_LEAD_CREATED, assign({}, o || {}, {
          lead: lead, rota: '/v1/leads', source: sourceDaOrigem(lead && lead.origem_captacao)
        }));
      },

      /* utilitarios de decoracao, expostos para os formularios proprios */
      decorarUrl: function (url, eid) {
        var j = garantirJornada();
        var r = decorarUrl(url, eid || j.id);
        if (r !== url) marcarPropagado();
        return r;
      },
      textoComRef: function (msg, ref) {
        garantirJornada();
        var r = textoComRef(msg, ref);
        if (r !== msg) marcarPropagado();
        return r;
      },
      decorarLinkWhatsapp: function (href, ref) {
        garantirJornada();
        var r = decorarLinkWhatsapp(href, ref);
        if (r !== href) marcarPropagado();
        return r;
      },

      /* superficie interna, exclusiva de teste (nao usar em producao) */
      __test: {
        decorarUrlPuro: decorarUrl,
        textoComRefPuro: textoComRef,
        decorarLinkWhatsappPuro: decorarLinkWhatsapp,
        uuidV4: function () { return uuidV4(win); },
        ehUuidV4: ehUuidV4,
        refDoEventId: refDoEventId,
        contemPII: contemPII,
        limpar: limpar,
        parseQuery: parseQuery,
        isoComOffset: isoComOffset,
        lerJornada: lerJornada,
        salvarJornada: salvarJornada,
        varrerDataLayer: varrerDataLayer,
        carregarAttribution: carregarAttribution,
        montarEnvelope: montarEnvelope,
        espelhar: espelhar,
        jornadaSemEmissao: jornadaSemEmissao,
        estado: function () {
          return { attribution: attribution, jornada: lerJornada(), enviados: lerEnviados(),
            descarregando: descarregando };
        },
        setDescarregando: function (v) { descarregando = !!v; }
      }
    };

    return api;
  }

  /* ------------------------------- exportacao ------------------------------- */

  var modulo = { create: createAttribution, VERSION: VERSION,
    CLUSTERS: CLUSTERS, CLUSTERS_SAUDE: CLUSTERS_SAUDE, AREAS: AREAS,
    CANDIDATE_A_LITERAL_CONTRACT: CANDIDATE_A_LITERAL_CONTRACT,
    CANDIDATE_B_DEDICATED_JOURNEY_ID: CANDIDATE_B_DEDICATED_JOURNEY_ID,
    C3_PENDENTE: C3_PENDENTE };

  if (typeof module === 'object' && module && module.exports) {
    module.exports = modulo;
  }
  if (globalScope && globalScope.document) {
    if (!globalScope.ABAttribution) {
      globalScope.ABAttribution = createAttribution(globalScope,
        globalScope.AB_MEASUREMENT_CONFIG || {});
      if (!globalScope.AB_MEASUREMENT_NO_AUTOINIT) globalScope.ABAttribution.init();
    }
    globalScope.ABAttributionModule = modulo;
  }
})(typeof window !== 'undefined' ? window
  : (typeof globalThis !== 'undefined' ? globalThis : this));
