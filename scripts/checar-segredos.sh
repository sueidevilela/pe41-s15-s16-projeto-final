#!/usr/bin/env bash
# =====================================================================
# CUIDAR — procura chaves escondidas no código (e, opcionalmente,
# no histórico do git).
#
# Uso:
#   bash scripts/checar-segredos.sh              # arquivos atuais
#   bash scripts/checar-segredos.sh --historico  # + todo o histórico do git
#
# Sai com código 1 se achar algo crítico (serve como pre-commit).
# =====================================================================

set -u

VERMELHO=$'\033[31m'; AMARELO=$'\033[33m'; VERDE=$'\033[32m'; FIM=$'\033[0m'

# Prefixos de chaves conhecidas
PADRAO_CRITICO='(sk-ant-[A-Za-z0-9_-]{10,}|sk-[A-Za-z0-9]{20,}|sb_secret_[A-Za-z0-9_-]{10,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|xox[abp]-[A-Za-z0-9-]{10,}|EAA[A-Za-z0-9]{40,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)'
PADRAO_JWT='eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'

# O que não precisa ser varrido
EXCLUIR=(
  --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=.vercel
  --exclude=checar-segredos.sh --exclude=.env.example --exclude=env.example
  --exclude=.env --exclude='.env.*'
)

criticos=0
avisos=0

# Lê o "role" de dentro de um JWT (as chaves antigas do Supabase são JWT)
papel_do_jwt() {
  local payload
  payload=$(printf '%s' "$1" | cut -d. -f2 | tr '_-' '/+')
  while [ $(( ${#payload} % 4 )) -ne 0 ]; do payload="${payload}="; done
  printf '%s' "$payload" | base64 -d 2>/dev/null | grep -o '"role":"[^"]*"' | cut -d'"' -f4
}

echo "== Varredura dos arquivos atuais =="

while IFS= read -r linha; do
  [ -z "$linha" ] && continue
  echo "${VERMELHO}[CRÍTICO]${FIM} possível chave secreta: ${linha%%:*}:$(echo "$linha" | cut -d: -f2)"
  criticos=$((criticos+1))
done < <(grep -rnIE "${EXCLUIR[@]}" "$PADRAO_CRITICO" . 2>/dev/null)

while IFS= read -r linha; do
  [ -z "$linha" ] && continue
  arquivo_linha="${linha%%:*}:$(echo "$linha" | cut -d: -f2)"
  token=$(echo "$linha" | grep -oE "$PADRAO_JWT" | head -n1)
  papel=$(papel_do_jwt "$token")
  if [ "$papel" = "service_role" ]; then
    echo "${VERMELHO}[CRÍTICO]${FIM} chave SERVICE ROLE do Supabase: $arquivo_linha"
    criticos=$((criticos+1))
  elif [ "$papel" = "anon" ]; then
    echo "${AMARELO}[AVISO]${FIM} chave pública (anon) do Supabase: $arquivo_linha — ok no front, mas deve estar só no arquivo de config"
    avisos=$((avisos+1))
  else
    echo "${AMARELO}[AVISO]${FIM} token JWT (papel: ${papel:-desconhecido}): $arquivo_linha — confira"
    avisos=$((avisos+1))
  fi
done < <(grep -rnIoE "${EXCLUIR[@]}" "$PADRAO_JWT" . 2>/dev/null)

# A palavra service_role escrita em arquivo do front é sinal de alerta
while IFS= read -r linha; do
  [ -z "$linha" ] && continue
  echo "${AMARELO}[AVISO]${FIM} menção a service_role/secret em arquivo do navegador: ${linha%%:*}"
  avisos=$((avisos+1))
done < <(grep -rnIlE --include='*.html' --include='*.js' "${EXCLUIR[@]}" --exclude-dir=supabase --exclude-dir=scripts --exclude-dir=app --exclude-dir=ferramentas --exclude-dir=kit-seguranca 'service_role|SUPABASE_SECRET_KEY|ANTHROPIC_API_KEY' . 2>/dev/null)

# .env versionado?
if git rev-parse --git-dir >/dev/null 2>&1; then
  if git ls-files --error-unmatch .env >/dev/null 2>&1; then
    echo "${VERMELHO}[CRÍTICO]${FIM} o arquivo .env está sendo rastreado pelo git"
    criticos=$((criticos+1))
  fi
  if ! git check-ignore -q .env 2>/dev/null; then
    echo "${AMARELO}[AVISO]${FIM} .env não está no .gitignore"
    avisos=$((avisos+1))
  fi
fi

if [ "${1:-}" = "--historico" ]; then
  echo
  echo "== Varredura do histórico do git =="
  if git rev-parse --git-dir >/dev/null 2>&1; then
    if [ -n "$(git log --all --format=%h -- .env 2>/dev/null)" ]; then
      echo "${VERMELHO}[CRÍTICO]${FIM} o .env já foi commitado em algum momento (git log --all -- .env)"
      criticos=$((criticos+1))
    fi
    achados=$(git log --all -p --no-color 2>/dev/null | grep -E '^\+' | grep -cE "$PADRAO_CRITICO")
    if [ "$achados" -gt 0 ]; then
      echo "${VERMELHO}[CRÍTICO]${FIM} $achados linha(s) com possível chave secreta no histórico"
      echo "         Para ver os commits: git log --all -p | grep -nE 'sk-ant-|sb_secret_|AIza'"
      criticos=$((criticos+1))
    fi
    for token in $(git log --all -p --no-color 2>/dev/null | grep -E '^\+' | grep -oE "$PADRAO_JWT" | sort -u); do
      if [ "$(papel_do_jwt "$token")" = "service_role" ]; then
        echo "${VERMELHO}[CRÍTICO]${FIM} chave SERVICE ROLE encontrada no histórico do git"
        criticos=$((criticos+1))
      fi
    done
  else
    echo "(não é um repositório git)"
  fi
fi

echo
if [ "$criticos" -gt 0 ]; then
  echo "${VERMELHO}✗ $criticos problema(s) crítico(s).${FIM} Não faça commit. Veja docs/03-SE-UMA-CHAVE-VAZAR.md"
  exit 1
fi
echo "${VERDE}✓ Nenhuma chave secreta encontrada.${FIM} ($avisos aviso(s) para conferir)"
exit 0
