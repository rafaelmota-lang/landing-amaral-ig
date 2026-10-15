# Pauta 20/10, 10h: trocar número sem redeploy

Hoje cada troca de número = commit + Redeploy no Coolify (IG/ML/Shopee manual,
FB/WA pelo push no fbsfernando). Foram ~12 trocas entre 31/08 e 15/10.

| Opção | Troca de número | Prós | Contras |
|---|---|---|---|
| Planilha Google (proposta do Jefão) | muda 1 célula no celular | qualquer um troca, status ativo/backup/banido, puxa backup sozinho | página depende da planilha no clique (lenta ou fora = CTA sem número; precisa fallback no código); planilha pública expõe os números; risco de alguém editar errado |
| JSON no Cloudflare/VPS | eu troco em segundos pelo chat | rápido, versionado, com fallback | só eu/Claude troco |
| Token da API do Coolify | eu disparo o redeploy | não muda a arquitetura | continua sendo build a cada troca |

Ponto que vale para TODAS: a "versão automática" (n8n checando conexão pela
API) NÃO pega banimento. Medido em 16/09: a API do Fluxo Jurídico seguiu
"connected" com o número já banido. Automação só pega desconexão/arquivamento.
Também: decisão registrada do dono em 12/08, arquitetura nova é code-first e
sem n8n.

Recomendação: lista remota (planilha OU JSON) com fallback embutido no código
(se não carregar em ~1s, usa o pool do build), status ativo/backup/banido, e o
monitor de 6h lendo a mesma lista. Banimento continua sendo marcado à mão.
