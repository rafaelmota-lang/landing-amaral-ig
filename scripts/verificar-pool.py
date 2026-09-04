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
import json, os, re, subprocess, sys, urllib.parse

LPS = [
    ("Instagram",     "https://instagram.amaralebohrer.com.br/"),
    ("Mercado Livre", "https://ml.amaralebohrer.com.br/"),
    ("Shopee",        "https://shopee.amaralebohrer.com.br/"),
    # O site institucional NAO entra aqui: por decisao do dono ele segue com o
    # Leadster e sem pool de WhatsApp, entao nao ha numero para monitorar.
]
ENV = os.path.expanduser("~/Sistemas/Projetos_Auxiliares/digisac-meta-capi/.env")
# Segredos ficam FORA deste repositorio: ele e publico no GitHub.
ENV_FJ = os.path.expanduser("~/.config/verificar-pool/.env")
BASE_FJ = "https://api.fluxojuridico.com.br/functions/v1/public-api"

# Numeros que nao vivem no Digisac.
FORA_DO_DIGISAC = {
    "5511926878173": "Fluxo Juridico",
    "5511926471049": "Fluxo Juridico",
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
    "5511926878173": "0c024044-c22d-4a00-9e52-6be67200c06a",  # LP Instagram + site
    "5511926471049": "ba15da49-1416-48fd-9a64-20efee228bd6",  # LPs ML e Shopee
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
            if c.get("status") != "connected":
                problemas.append((nome_lp, n, f"canal FJ '{c['display_name']}' status={c.get('status')}"))
                print(f"  {n}  !! MORTO -> FJ '{c['display_name']}' status={c.get('status')}")
            else:
                print(f"  {n}  ok -> FJ '{c['display_name']}' connected")
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

    checaveis = total - len(cegos)
    vivos = checaveis - len(problemas)
    print(f"\n{'='*58}")
    print(f"{len(LPS)} LPs | verificados vivos: {vivos}/{checaveis} | nao verificaveis: {len(cegos)}/{total}")

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
