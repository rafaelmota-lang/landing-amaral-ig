#!/usr/bin/env bash
# Roda o verificador do pool e avisa no Telegram quando ha o que avisar.
#
# Silencio nao e sinal de saude: se o cron morrer, ninguem percebe. Por isso o
# run do meio-dia manda um "estou vivo" mesmo quando esta tudo certo. Se voce
# parar de receber esse aviso diario, o monitor caiu.
#
# exit do verificador:  0 = tudo vivo | 1 = numero morto | 2 = nao conclusivo
set -uo pipefail

# O VPS roda em UTC e tem outros crons dependendo disso, entao o fuso nao e
# mudado no servidor: e fixado aqui. O cron agenda em UTC (03,09,15,21 = 00,
# 06,12,18 de Brasilia) e o horario das mensagens sai correto por causa disto.
export TZ=America/Sao_Paulo

ENV_FILE=/etc/verificar-pool.env
SCRIPT=/opt/verificar-pool/verificar-pool.py
LOG=/var/log/verificar-pool.log

set -a; . "$ENV_FILE"; set +a

SAIDA=$(python3 "$SCRIPT" 2>&1); RC=$?
AGORA=$(date "+%d/%m %H:%M")
echo "===== $AGORA (exit=$RC)" >> "$LOG"
echo "$SAIDA" >> "$LOG"

avisar() {
  [ -z "${TELEGRAM_BOT_TOKEN:-}" ] && return 0
  curl -s -4 --max-time 25 -o /dev/null \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=$1"
}

case $RC in
  1) avisar "🚨 WHATSAPP CAIU — LP do Instagram

Numero do pool fora do ar. Lead pago esta caindo no vazio AGORA.

$SAIDA

O que fazer:
1. remover o numero de src/config.js (WHATSAPP_POOL)
2. commit + push
3. Redeploy no Coolify (sem isso nao vai ao ar)

$AGORA" ;;
  2) avisar "⚠️ Monitor do pool NAO conseguiu verificar ($AGORA)

Pode estar tudo bem ou nao: o monitor nao conseguiu saber. Token expirado ou rede.

$SAIDA" ;;
  0) # heartbeat: so no run do meio-dia, para provar que o monitor esta vivo
     [ "$(date +%H)" = "12" ] && avisar "✅ Pool da LP do Instagram OK ($AGORA)

$SAIDA" ;;
esac
exit $RC
