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
# numeros que nao vivem no Digisac (outra plataforma): nao alarmar, mas listar
FORA_DO_DIGISAC = {"5511926878173": "Fluxo Juridico"}


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


def main():
    nums, bundle = numeros_em_producao()
    conex = conexoes_digisac()
    print(f"LP: {LP}  bundle: {bundle}")
    print(f"numeros no pool em producao: {len(nums)}\n")
    problemas = []
    for n in nums:
        if n in FORA_DO_DIGISAC:
            print(f"  {n}  -- {FORA_DO_DIGISAC[n]} (fora do Digisac, nao verificavel aqui)")
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
    vivos = len(nums) - len(problemas)
    print(f"\nvivos: {vivos}/{len(nums)}")
    if problemas:
        print("\n*** ACAO NECESSARIA: remover do pool em src/config.js e fazer Redeploy ***")
        for n, m in problemas:
            print(f"    {n}: {m}")
        return 1
    if vivos == 0:
        print("\n*** CRITICO: NENHUM numero vivo ***")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
