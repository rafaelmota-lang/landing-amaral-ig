# Monitor do pool de WhatsApp no VPS

Verifica de 6 em 6 horas se os números que a LP está usando **de verdade**
continuam vivos, e avisa no Telegram quando algum cai.

## Por que existe

Em 31/08/2026 três números do pool foram arquivados no Digisac horas depois de
entrarem no ar. A LP seguiu mandando lead pago para WhatsApp morto até alguém
perceber na unha. Custou cerca de R$ 3.000 em mídia.

Conferir na hora de subir não basta: conexão de WhatsApp cai sozinha, sem aviso.

## O que roda onde

| Onde | O quê |
|---|---|
| `/opt/verificar-pool/verificar-pool.py` | o verificador (fonte no repo, `scripts/`) |
| `/opt/verificar-pool/rodar.sh` | wrapper: roda, loga e alerta (fonte em `scripts/vps/`) |
| `/etc/verificar-pool.env` | credenciais, `chmod 600` |
| `/var/log/verificar-pool.log` | histórico de todas as execuções |
| crontab do root | `7 3,9,15,21 * * *` UTC = 00h/06h/12h/18h de Brasília |

O VPS roda em **UTC** e outros crons dependem disso, então o fuso do servidor
não é alterado: `rodar.sh` exporta `TZ=America/Sao_Paulo` para si mesmo.

## O que ele checa

1. Baixa a LP em produção e lê os números **do bundle que está no ar**, não do
   repositório. Se alguém commitar e esquecer o Redeploy, o monitor enxerga a
   realidade, não a intenção.
2. Digisac (`GET /services`): casa pelo final de 4 dígitos e exige
   `isConnected=true` e `archivedAt=null`.
3. Fluxo Jurídico (`GET /channels`): confere o workspace via `/me` **antes** de
   acreditar na resposta. O FJ é multi-workspace e uma chave só enxerga o dela;
   sem essa trava o monitor já reportou "3/3 vivos" olhando canais de outra
   empresa.

## Alertas no Telegram (bot `@rafael_herme_bot`)

| Quando | O que chega |
|---|---|
| número caiu (`exit 1`) | 🚨 com o número, o motivo e os 3 passos da correção |
| não deu para verificar (`exit 2`) | ⚠️ dizendo que **não sabe**, nunca "OK" |
| tudo certo | silêncio, exceto um ✅ por dia ao meio-dia |

O ✅ diário é o *dead-man switch*: silêncio não prova saúde, porque um cron morto
também é silencioso. **Se parar de chegar o OK do meio-dia, o monitor caiu.**

## Detalhe de rede que já custou um debug

O Cloudflare do Digisac responde **403 para o IPv6 do VPS** e 200 para o IPv4.
Por isso todo request vai com `curl -4` e só cai no padrão do sistema se falhar.
Sem isso o monitor funciona no Mac e morre no servidor, que é o pior caso: parece
instalado e não é.

## Reinstalar / atualizar

```bash
scp scripts/verificar-pool.py root@187.77.237.142:/opt/verificar-pool/
scp scripts/vps/rodar.sh      root@187.77.237.142:/opt/verificar-pool/
```

Rodar na mão, exatamente como o cron roda:

```bash
ssh root@187.77.237.142 /opt/verificar-pool/rodar.sh
```

## Testar se o alarme ainda dispara

Vale repetir de tempos em tempos: um alarme nunca testado é um alarme
desconhecido. Aponte uma cópia do verificador para um canal sabidamente fora do
ar e confirme que sai `exit 1` e que o Telegram chega.

## Limitação conhecida

O monitor sabe dizer que o número **está conectado**. Ele não sabe dizer se
alguém está **respondendo** as mensagens. Número conectado com ninguém atendendo
continua queimando verba, e isso nenhum check de API pega.
