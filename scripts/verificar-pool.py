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

Uso:  python3 verificar-pool.py
Saida: 0 = tudo ok | 1 = PROBLEMA (algum numero morto)
"""
import json, os, re, subprocess, sys, urllib.parse

LP = "https://instagram.amaralebohrer.com.br/"
ENV = os.path.expanduser("~/Sistemas/Projetos_Auxiliares/digisac-meta-capi/.env")
ENV_FJ = os.path.expanduser("~/Sistemas/Paineis/painel-comercial-fj/backend/.env")
BASE_FJ = "https://api.fluxojuridico.com.br/functions/v1/public-api"

# Numeros que nao vivem no Digisac.
FORA_DO_DIGISAC = {"5511926878173": "Fluxo Juridico"}

# A API do FJ NAO expoe o telefone do canal: /channels devolve external_id (o
# phone_number_id da WABA) e nem as mensagens inbound trazem display_phone_number.
# Conferido em 2026-09-01. Entao nao da para amarrar 5511926878173 a um canal
# por dados.
#
# Enquanto ninguem confirmar o nome exato no painel, o monitor cobre TODOS os
# canais do FJ: se qualquer um cair, alarma. E conservador de proposito, prefere
# alarme falso a deixar passar a queda do numero que leva metade do trafego pago.
#
# Para virar verificacao exata: preencher com o display_name do canal (um de
# "Disparos - WABA", "RM EDUCACAO ONLINE", "Conversao Jurica").
CANAL_FJ_DO_NUMERO = None


def sh(*a):
    return subprocess.run(a, capture_output=True, text=True, timeout=60).stdout


def env(chave):
    for linha in open(ENV, encoding="utf-8"):
        if linha.startswith(chave + "="):
            return linha.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def numeros_em_producao():
    html = sh("curl", "-s", "--compressed", "--max-time", "25", LP)
    m = re.search(r"/assets/index-[A-Za-z0-9_-]+\.js", html)
    if not m:
        raise SystemExit("ERRO: nao achei o bundle na LP")
    js = sh("curl", "-s", "--compressed", "--max-time", "25", LP.rstrip("/") + m.group(0))
    return sorted(set(re.findall(r'numero:"(\d{12,13})"', js))), m.group(0)


def conexoes_digisac():
    base, tok = env("DIGISAC_BASE").rstrip("/"), env("DIGISAC_TOKEN")
    d = json.loads(sh("curl", "-s", "--max-time", "45", "-H", f"Authorization: Bearer {tok}",
                      base + "/services?perPage=200"))
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
    """Estado dos canais do Fluxo Juridico. [] se nao der para consultar."""
    try:
        tok = ""
        for linha in open(ENV_FJ, encoding="utf-8"):
            if re.match(r"^FJ_?(API_)?(TOKEN|KEY)=", linha):
                tok = linha.split("=", 1)[1].strip().strip('"').strip("'")
                break
        if not tok:
            return []
        d = json.loads(sh("curl", "-s", "--max-time", "30",
                          "-H", f"Authorization: Bearer {tok}", BASE_FJ + "/channels"))
        rows = d.get("data") if isinstance(d, dict) else d
        return [c for c in (rows or []) if c.get("channel_type") == "whatsapp"]
    except Exception:
        return []


def main():
    nums, bundle = numeros_em_producao()
    conex = conexoes_digisac()
    print(f"LP: {LP}  bundle: {bundle}")
    print(f"numeros no pool em producao: {len(nums)}\n")
    problemas, cegos = [], []
    for n in nums:
        if n in FORA_DO_DIGISAC:
            canais = canais_fj()
            if not canais:
                cegos.append(n)
                print(f"  {n}  ?? {FORA_DO_DIGISAC[n]} - API nao respondeu, NAO VERIFICADO")
                continue
            alvo = [c for c in canais if c.get("display_name") == CANAL_FJ_DO_NUMERO] \
                   if CANAL_FJ_DO_NUMERO else canais
            caidos = [c for c in alvo if c.get("status") != "connected"]
            nomes = ", ".join(f"{c.get('display_name')}={c.get('status')}" for c in caidos)
            if caidos:
                problemas.append((n, f"canal do FJ fora do ar: {nomes}"))
                print(f"  {n}  !! Fluxo Juridico com canal caido -> {nomes}")
            elif CANAL_FJ_DO_NUMERO:
                print(f"  {n}  ok -> FJ '{CANAL_FJ_DO_NUMERO}' connected")
            else:
                print(f"  {n}  ok* -> FJ: os {len(alvo)} canais estao connected "
                      f"(cobertura conservadora, canal exato nao confirmado)")
            continue
        c = conex.get(n[-4:])
        if not c:
            problemas.append((n, "SEM CONEXAO no Digisac"))
            print(f"  {n}  !! SEM CONEXAO no Digisac")
        elif c["arquivada"] or c["conectada"] is not True:
            problemas.append((n, f"{c['nome']} arquivada={c['arquivada']} conectada={c['conectada']}"))
            print(f"  {n}  !! MORTO -> {c['nome']} | arquivada={c['arquivada']} | conectada={c['conectada']}")
        else:
            print(f"  {n}  ok -> {c['nome']}")

    checaveis = len(nums) - len(cegos)
    vivos = checaveis - len(problemas)
    print(f"\nverificados vivos: {vivos}/{checaveis}   |   nao verificaveis: {len(cegos)}/{len(nums)}")

    if cegos:
        # Cobertura parcial nao pode ser reportada como "tudo certo": se o numero
        # de fora cair, metade do trafego pago sangra sem ninguem ver.
        print("  AVISO: a cobertura deste monitor e PARCIAL. Os numeros acima marcados")
        print("  como nao verificaveis vivem fora do Digisac e precisam de teste manual.")

    if problemas:
        print("\n*** ACAO NECESSARIA: remover do pool em src/config.js e fazer Redeploy ***")
        for n, m in problemas:
            print(f"    {n}: {m}")
        return 1
    if vivos == 0 and checaveis > 0:
        print("\n*** CRITICO: NENHUM numero verificavel esta vivo ***")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
