#!/usr/bin/env python3
"""
Verifica se os numeros de WhatsApp que estao EM PRODUCAO ainda estao vivos.

POR QUE EXISTE: em 2026-08-31 tres numeros do pool foram arquivados e
desconectados no Digisac sem aviso. Ficaram no ar recebendo lead pago e
jogando a conversa no vazio. Conferir uma vez no dia da implantacao nao basta:
conexao de WhatsApp cai sozinha.

O QUE FAZ: le o bundle publicado (a verdade, nao o repo), extrai os numeros do
pool e cruza com GET /services do Digisac. Falha se algum estiver arquivado,
desconectado ou ausente.

Cobre TODAS as LPs listadas em LPS, nao so uma: em 2026-09-01 a LP do Mercado
Livre foi encontrada com os DOIS numeros do formulario arquivados, sangrando ha
tempo indeterminado, justamente por estar fora do monitor.

Uso:  python3 verificar-pool.py
Saida: 0 = tudo ok | 1 = PROBLEMA (algum numero morto) | 2 = nao conclusivo
"""
import json, os, re, subprocess, sys, time, datetime, urllib.parse

LPS = [
    ("Instagram",     "https://instagram.amaralebohrer.com.br/"),
    ("Mercado Livre", "https://ml.amaralebohrer.com.br/"),
    ("Shopee",        "https://shopee.amaralebohrer.com.br/"),
    ("Facebook",      "https://facebook.amaralebohrer.com.br/"),
    ("WhatsApp",      "https://whatsapp.amaralebohrer.com.br/"),
    # O site institucional NAO entra aqui: por decisao do dono ele segue com o
    # Leadster e sem pool de WhatsApp, entao nao ha numero para monitorar.
]
ENV = os.path.expanduser("~/Sistemas/Projetos_Auxiliares/digisac-meta-capi/.env")
# Segredos ficam FORA deste repositorio: ele e publico no GitHub.
ENV_FJ = os.path.expanduser("~/.config/verificar-pool/.env")
BASE_FJ = "https://api.fluxojuridico.com.br/functions/v1/public-api"

# Numeros que nao vivem no Digisac.
FORA_DO_DIGISAC = {
    "5511997571221": "Fluxo Juridico",
    "5511972081104": "Fluxo Juridico",
    "5511911581515": "Fluxo Juridico",
    "5511972021019": "Fluxo Juridico",
    "5511995681013": "Fluxo Juridico",
    "5511999351012": "Fluxo Juridico",
    "5511926888022": "Fluxo Juridico",

    "5511926470895": "Fluxo Juridico",
    "5511926878173": "Fluxo Juridico",
    "5511926471049": "Fluxo Juridico",
    "5511926878630": "Fluxo Juridico",   # destino unico das 3 LPs
}

# ---------------------------------------------------------------------------
# O FJ E MULTI-WORKSPACE. Uma API key so enxerga o workspace dela.
#
# Em 2026-09-01 este monitor deu "3/3 vivos" consultando os canais do
# workspace "Conversao Juridica" (Disparos - WABA, RM EDUCACAO ONLINE,
# Conversao Jurica) com a chave do painel-comercial-fj. Nenhum deles tem
# relacao com esta LP: o 5511926878173 vive no workspace "Amaral e Bohrer
# Advogados". Foi um OK falso, a mesma classe de erro do incidente de 31/08.
#
# Por isso a checagem abaixo confere o workspace ANTES de acreditar na
# resposta. Sem a chave certa o monitor diz NAO VERIFICADO, nunca "ok".
# A chave se gera no FJ em Configuracoes > API e Integracoes, dentro do
# workspace do Amaral e Bohrer, e vai em FJ_TOKEN_AMARAL no .env abaixo.
WORKSPACE_FJ_ESPERADO = "Amaral e Bohrer Advogados"

# Canal do FJ por numero, casado pelo ID.
#
# O casamento era por NOME e quebrou em 2026-09-02: os canais foram renomeados
# ("Amaral e Bohrer Advogados - Redes Sociais" virou "Z-API - Redes Sociais") e
# o monitor passou a dizer NAO VERIFICADO para os dois numeros. O ID nao muda
# com rename, entao e por ele que se casa agora.
#
# Os IDs abaixo foram confirmados comparando a lista antes e depois do rename,
# nao por semelhanca de nome.
CANAIS_FJ_POR_NUMERO = {
    "5511972081104": "f2a5738a-5f9c-4ece-a988-3b8afd7bcbd7",  # Jessica (numero novo 15/10)
    "5511997571221": "50f5ae95-969f-4cce-8b75-8eb588a21384",  # Carla (canal novo 19/10)
    "5511995681013": "98b8ebdb-02b6-4dee-8f20-20d93ff5035d",  # Ellen
    "5511999351012": "c2517fc2-6a0d-460a-b2e6-0a1ebc78c986",  # Vitoria
    "5511926888022": "f9927b4e-aada-4a01-ab9a-a485dc226fc8",  # Gabriela
    "5511926878173": "0c024044-c22d-4a00-9e52-6be67200c06a",  # LPs redes sociais, "Z-API - Redes Sociais"
    "5511926470895": "ba2257e0-1ed3-4511-9bef-f95825ec7364",  # LPs redes sociais, "Canal Rede Social" (coex novo)
    "5511926471049": "ba15da49-1416-48fd-9a64-20efee228bd6",  # LPs ML e Shopee, "Canal Mercado Livre"
    "5511926878630": "2dbbdf03-5e0c-4e8b-bbb6-7c5b11f41ec3",  # BANIDO 2026-10-10, fora de uso
}


def sh(*a):
    return subprocess.run(a, capture_output=True, text=True, timeout=60).stdout


def http(url, *extra, tolerar_vazio=False):
    """GET que devolve texto. Tenta IPv4 antes do padrao do sistema.

    O Cloudflare do Digisac responde 403 para o IPv6 do VPS e 200 para o IPv4
    (medido em 2026-09-01). Sem o -4 o monitor morre no servidor e vive na
    maquina do dono, que e o pior dos mundos: parece que funciona.
    """
    for args in (("-4",), ()):
        out = sh("curl", "-s", "--max-time", "45", *args, *extra, url)
        if out.strip():
            return out
    if tolerar_vazio:
        return ""
    raise RuntimeError(f"sem resposta de {url.split('?')[0]} (tentado IPv4 e IPv6)")


def env(chave, arquivos=()):
    """Valor de `chave`: variavel de ambiente primeiro, depois os arquivos.

    A variavel de ambiente vem primeiro para o mesmo script rodar no Mac (que
    le os .env dos projetos) e no VPS (que recebe tudo por EnvironmentFile).
    """
    if os.environ.get(chave):
        return os.environ[chave]
    for caminho in arquivos:
        if not caminho or not os.path.exists(caminho):
            continue
        for linha in open(caminho, encoding="utf-8"):
            if linha.startswith(chave + "="):
                return linha.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def numeros_em_producao(LP):
    html = http(LP, "--compressed")
    m = re.search(r"/assets/index-[A-Za-z0-9_-]+\.js", html)
    if not m:
        raise RuntimeError("nao achei o bundle no HTML da pagina")
    js = http(LP.rstrip("/") + m.group(0), "--compressed")
    return sorted(set(re.findall(r'numero:"(\d{12,13})"', js))), m.group(0)


def conexoes_digisac():
    base = env("DIGISAC_BASE", (ENV,)).rstrip("/")
    tok = env("DIGISAC_TOKEN", (ENV,))
    if not base or not tok:
        raise RuntimeError("faltam DIGISAC_BASE/DIGISAC_TOKEN")
    d = json.loads(http(base + "/services?perPage=200",
                        "-H", f"Authorization: Bearer {tok}"))
    fora = {}
    for s in (d.get("data") or d):
        dig = re.sub(r"\D", "", s.get("name") or "")
        if len(dig) < 4:
            continue
        st = (s.get("data") or {}).get("status") or {}
        arq = bool(s.get("archivedAt") or s.get("deletedAt"))
        # entre homonimos por sufixo, o vivo ganha
        atual = fora.get(dig[-4:])
        cand = {"nome": s.get("name"), "conectada": st.get("isConnected"), "arquivada": arq}
        if not atual or (atual["arquivada"] and not arq):
            fora[dig[-4:]] = cand
    return fora


def canais_fj():
    """(canais, erro). Só devolve canais se o token for do workspace certo."""
    try:
        tok = env("FJ_TOKEN_AMARAL", (ENV_FJ,))
        if not tok:
            return [], f"falta FJ_TOKEN_AMARAL (env ou {ENV_FJ})"

        me = json.loads(http(BASE_FJ + "/me", "-H", f"Authorization: Bearer {tok}"))
        ws = (((me.get("data") or {}).get("workspace") or {}).get("name")) or "?"
        if ws != WORKSPACE_FJ_ESPERADO:
            return [], f"token e do workspace '{ws}', esperado '{WORKSPACE_FJ_ESPERADO}'"

        d = json.loads(http(BASE_FJ + "/channels", "-H", f"Authorization: Bearer {tok}"))
        rows = d.get("data") if isinstance(d, dict) else d
        return [c for c in (rows or []) if c.get("channel_type") == "whatsapp"], None
    except Exception as e:
        return [], f"erro ao consultar o FJ: {e}"


# ---------------------------------------------------------------------------
# DETECTOR DE BLOQUEIO PELA META (descoberto em 2026-10-19).
#
# A API do FJ diz "connected" mesmo com o numero bloqueado. Mas as mensagens
# ENVIADAS por um numero bloqueado voltam com status "failed" e o erro 131031
# "Business Account locked". A Carla 1019 apareceu assim em 16/10 13h46; o
# banimento so foi percebido em 19/10, 3 dias recebendo lead pago ja bloqueado.
#
# Como funciona: pega as conversas com atividade mais recente (3 paginas), e
# para cada canal olha as mensagens das ultimas conversas e procura envio
# "failed" com codigo de bloqueio dentro da janela. Custa ~45 chamadas ao FJ
# (limite 30/min), por isso o sleep entre elas.
# LIMITE: so enxerga numero que teve conversa recente com resposta enviada. Numero
# parado, sem trafego, nao tem como acusar bloqueio.
CODIGOS_BLOQUEIO = {131031}          # Business Account locked
JANELA_HORAS = 96
CONVS_POR_CANAL = 6


def _codigos(m):
    ed = m.get("error_detail")
    texto = json.dumps(ed) if not isinstance(ed, str) else ed
    return {int(x) for x in re.findall(r"code\"?'?:\s*(\d+)", texto or "")}


def falhas_por_canal(tok, canal_ids):
    """{canal_id: {"falhas": [(quando_iso, codigos)], "ultimo_ok": iso}} na janela."""
    hdr = ("-H", f"Authorization: Bearer {tok}")
    convs = []
    for off in (0, 100, 200):
        d = json.loads(http(f"{BASE_FJ}/conversations?limit=100&offset={off}", *hdr))
        convs += d.get("data") or []
        time.sleep(2.2)
    corte = (datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None) - datetime.timedelta(hours=JANELA_HORAS)).isoformat()
    out = {}
    for cid in canal_ids:
        mine = sorted([c for c in convs if c.get("channel_id") == cid],
                      key=lambda c: c.get("last_message_at") or "", reverse=True)[:CONVS_POR_CANAL]
        achados = []
        ultimo_ok = ""
        for c in mine:
            d = json.loads(http(f"{BASE_FJ}/conversations/{c['id']}/messages?limit=40", *hdr))
            time.sleep(2.2)
            for m in d.get("data") or []:
                if m.get("direction") != "outbound" or (m.get("created_at") or "") < corte:
                    continue
                if m.get("status") == "failed":
                    achados.append((m.get("created_at"), sorted(_codigos(m))))
                elif m.get("status") in ("sent", "delivered", "read"):
                    ultimo_ok = max(ultimo_ok, m.get("created_at") or "")
        out[cid] = {"falhas": achados, "ultimo_ok": ultimo_ok}
    return out


CODIGOS_AVISO = {131049}   # "mensagem nao entregue para manter o ecossistema saudavel"

# Numeros de reserva (nao recebem lead). Se a reserva tambem cair, o dono precisa
# saber ANTES de precisar dela. Chave = numero, valor = ID do canal no FJ.
CONTINGENCIA = {
    "5511926470895": "ba2257e0-1ed3-4511-9bef-f95825ec7364",  # "Canal Rede Social" coex
    "5511926878173": "0c024044-c22d-4a00-9e52-6be67200c06a",  # "Z-API - Redes Sociais"
}


def marcado_banido(canal):
    """A equipe renomeia o canal para 'Banido ...' no FJ quando o numero cai
    (visto em 19/10 com Ellen e Vitoria). A API segue 'connected', entao o NOME
    e o unico sinal humano. Vale como alarme."""
    return "banid" in (canal.get("display_name") or "").lower()


def canal_aviso_qualidade(cache_fj, canal_id):
    try:
        ach = [q for q, cods in ((cache_fj.get("falhas") or {}).get(canal_id) or {}).get("falhas", []) if set(cods) & CODIGOS_AVISO]
        return sorted(ach)[-1] if ach else None
    except Exception:
        return None


def verificar_contingencia(cache_fj):
    """Confere a reserva. Devolve a lista de avisos (texto)."""
    avisos = []
    try:
        if cache_fj.get("dados") is None:
            cache_fj["dados"] = canais_fj()
        canais, erro = cache_fj["dados"]
        if erro:
            return [f"contingencia nao verificada: {erro}"]
        print("\n### Contingencia (nao recebe lead)")
        for n, cid in CONTINGENCIA.items():
            c = next((x for x in canais if x.get("id") == cid), None)
            if not c:
                msg = f"CONTINGENCIA SUMIU do FJ: {n}"
            elif c.get("status") != "connected":
                msg = f"CONTINGENCIA DESCONECTADA: {n} '{c['display_name']}' status={c.get('status')}"
            else:
                est, quando = canal_bloqueado(cache_fj, cid)
                msg = (f"CONTINGENCIA BLOQUEADA PELA META: {n} '{c['display_name']}' ultimo envio falhou com 131031 ({_brt(quando)})"
                       if est == "vigente" else
                       f"CONTINGENCIA EM RISCO: {n} '{c['display_name']}' teve bloqueio 131031 em {_brt(quando)} e voltou a enviar"
                       if est == "precursor" else None)
            if msg:
                avisos.append(msg); print(f"  !! {msg}")
            else:
                print(f"  ok {n} '{c['display_name']}' connected, sem falha de envio")
    except Exception as e:
        avisos.append(f"contingencia nao verificada: {e}")
    return avisos


def _brt(iso):
    """ISO em UTC do FJ para 'dd/mm hh:mm' de Brasilia."""
    try:
        d = datetime.datetime.fromisoformat((iso or "")[:19]) - datetime.timedelta(hours=3)
        return d.strftime("%d/%m %H:%M")
    except Exception:
        return (iso or "?")[:16]


def canal_bloqueado(cache_fj, canal_id):
    """(estado, quando_iso). estado: 'vigente' (ultimo envio falhou com 131031, sem envio
    OK depois), 'precursor' (falhou mas voltou a enviar; a Carla 1019 teve isso em
    16/10 e caiu 3 dias depois) ou None. Tolerante a erro."""
    try:
        if "falhas" not in cache_fj:
            tok = env("FJ_TOKEN_AMARAL", (ENV_FJ,))
            ids = set(CANAIS_FJ_POR_NUMERO.values()) | set(CONTINGENCIA.values())
            cache_fj["falhas"] = falhas_por_canal(tok, ids)
        d = cache_fj["falhas"].get(canal_id) or {"falhas": [], "ultimo_ok": ""}
        ach = sorted(q for q, cods in d["falhas"] if set(cods) & CODIGOS_BLOQUEIO)
        if not ach:
            return None, None
        return ("vigente" if d["ultimo_ok"] <= ach[-1] else "precursor"), ach[-1]
    except Exception as e:
        print(f"      (detector de bloqueio indisponivel: {e})")
        return None, None


def verificar_lp(nome_lp, url, conex, cache_fj):
    """Checa uma LP. Devolve (problemas, cegos, total_de_numeros)."""
    nums, bundle = numeros_em_producao(url)
    print(f"\n### {nome_lp}  ({url})")
    print(f"    bundle: {bundle} | {len(nums)} numero(s) no pool\n")
    problemas, cegos = [], []

    # Zero numero NAO e sinal de saude: ou o deploy dessa LP ainda nao saiu, ou
    # o padrao do bundle mudou e a extracao parou de funcionar. Nos dois casos o
    # monitor esta cego para essa LP, e cego tem que gritar, nao ficar quieto.
    if not nums:
        print(f"  ?? NENHUM numero encontrado no bundle desta LP - MONITOR CEGO AQUI.")
        print(f"     Ou a LP nao usa o pool (deploy pendente), ou a extracao quebrou.")
        return [], ["<lp-sem-numeros:" + nome_lp + ">"], 0

    for n in nums:
        if n in FORA_DO_DIGISAC:
            if cache_fj["dados"] is None:
                cache_fj["dados"] = canais_fj()
            canais, erro = cache_fj["dados"]
            if erro:
                cegos.append(n)
                print(f"  {n}  ?? {FORA_DO_DIGISAC[n]} - NAO VERIFICADO: {erro}")
                continue
            alvo_id = CANAIS_FJ_POR_NUMERO.get(n)
            alvo = [c for c in canais if c.get("id") == alvo_id]
            if not alvo:
                nomes = ", ".join(f"{c.get('display_name')!r}({c.get('id')[:8]})" for c in canais)
                cegos.append(n)
                print(f"  {n}  ?? canal {alvo_id} nao existe mais no FJ - NAO VERIFICADO. "
                      f"Canais no workspace: {nomes}")
                continue
            c = alvo[0]
            if marcado_banido(c):
                problemas.append((nome_lp, n, f"canal FJ marcado como BANIDO pela equipe: '{c['display_name']}'"))
                print(f"  {n}  !! BANIDO (equipe renomeou o canal) -> FJ '{c['display_name']}'")
            elif c.get("status") != "connected":
                problemas.append((nome_lp, n, f"canal FJ '{c['display_name']}' status={c.get('status')}"))
                print(f"  {n}  !! MORTO -> FJ '{c['display_name']}' status={c.get('status')}")
            else:
                est, quando = canal_bloqueado(cache_fj, c["id"])
                if est == "vigente":
                    problemas.append((nome_lp, n, f"BLOQUEADO PELA META agora (erro 131031 em {_brt(quando)}, sem envio OK depois), FJ diz connected"))
                    print(f"  {n}  !! BLOQUEADO PELA META -> FJ '{c['display_name']}' diz connected, ultimo envio falhou com 131031 ({_brt(quando)})")
                else:
                    print(f"  {n}  ok -> FJ '{c['display_name']}' connected")
                    if est == "precursor":
                        print(f"      AVISO META: '{c['display_name']}' teve bloqueio 131031 em {_brt(quando)} e voltou a enviar; a Carla 1019 teve o mesmo 3 dias antes de cair")
                    q = canal_aviso_qualidade(cache_fj, c["id"])
                    if q:
                        print(f"      AVISO META: '{c['display_name']}' teve entrega limitada pela Meta (131049) em {_brt(q)}; costuma vir antes de restricao")
            continue

        c = conex.get(n[-4:])
        if not c:
            problemas.append((nome_lp, n, "SEM CONEXAO no Digisac"))
            print(f"  {n}  !! SEM CONEXAO no Digisac")
        elif c["arquivada"] or c["conectada"] is not True:
            problemas.append((nome_lp, n, f"{c['nome']} arquivada={c['arquivada']} conectada={c['conectada']}"))
            print(f"  {n}  !! MORTO -> {c['nome']} | arquivada={c['arquivada']} | conectada={c['conectada']}")
        else:
            print(f"  {n}  ok -> {c['nome']}")

    # Uma LP sem NENHUM numero vivo esta queimando 100% da verba dela.
    if nums and len(problemas) == len(nums):
        print(f"  *** {nome_lp}: NENHUM numero vivo, a LP inteira esta no vazio ***")
    return problemas, cegos, len(nums)


def main():
    conex = conexoes_digisac()
    cache_fj = {"dados": None}   # o FJ e consultado uma vez, nao por LP
    problemas, cegos, total = [], [], 0

    for nome_lp, url in LPS:
        try:
            p, c, t = verificar_lp(nome_lp, url, conex, cache_fj)
        except Exception as e:
            # Uma propriedade fora do ar nao pode impedir a checagem das outras,
            # mas tambem nao pode passar batido.
            print(f"\n### {nome_lp}  ({url})")
            print(f"  ?? NAO VERIFICADA: {e}")
            cegos.append(f"<lp-com-erro:{nome_lp}>")
            continue
        problemas += p
        cegos += c
        total += t

    avisos_cont = verificar_contingencia(cache_fj)

    checaveis = total - len(cegos)
    vivos = checaveis - len(problemas)
    print(f"\n{'='*58}")
    print(f"{len(LPS)} LPs | verificados vivos: {vivos}/{checaveis} | nao verificaveis: {len(cegos)}/{total}")

    if avisos_cont:
        print("\nAVISO: reserva comprometida, sem numero de backup confiavel:")
        for a in avisos_cont:
            print(f"    {a}")

    if cegos:
        # Cobertura parcial nao pode ser reportada como "tudo certo".
        print("  AVISO: cobertura PARCIAL. Os numeros marcados como nao verificaveis")
        print("  precisam de teste manual.")

    if problemas:
        print("\n*** ACAO NECESSARIA: remover do pool em src/config.js e fazer Redeploy ***")
        for lp, n, m in problemas:
            print(f"    [{lp}] {n}: {m}")
        return 1
    if vivos == 0 and checaveis > 0:
        print("\n*** CRITICO: NENHUM numero verificavel esta vivo ***")
        return 1
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        # Falha de rede/token nao pode virar traceback nem, muito menos, "OK".
        print(f"\n*** VERIFICACAO NAO CONCLUSIVA: {e}")
        print("    O pool pode estar bom ou ruim; este monitor nao conseguiu saber.")
        sys.exit(2)
