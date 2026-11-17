#!/usr/bin/env python3
"""
Valida dados/biblioteca.json e exporta dados/biblioteca.csv.

Uso:
    python3 scripts/validar_biblioteca.py

Sai com código 1 se houver ERRO (use antes de cada commit).
"""
import csv
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ARQ = RAIZ / "dados" / "biblioteca.json"

OBRIGATORIOS = ["id", "area", "tema", "termos", "explicacao", "o_que_perguntar",
                "fonte", "tipo_fonte", "data_acesso", "status"]
PERMITIDOS = set(OBRIGATORIOS) | {"citacao", "link", "respaldo", "origem", "notas_curadoria", "revisado_por"}

# Começo do nome de cada fonte aceita (ver docs/fontes.md). Adicione aqui se aprovar uma nova.
FONTES_ACEITAS = [
    "Ministério da Saúde",
    "Portaria GM/MS",
    "Cartilha Transplante de Fígado",
    "Guia de orientações para o transplante de fígado",
    "Manual de Transplante Hepático",
    "Carneiro D'Albuquerque, L. A.",
    "Organização Mundial da Saúde",
    "OPAS",
    "Arantes, A. C. Q.",
]

DADO_PESSOAL = {
    "CPF": r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b",
    "telefone": r"\(?\b\d{2}\)?\s?9?\d{4}-?\d{4}\b",
    "e-mail": r"[\w.+-]+@[\w-]+\.[\w.]+",
    "CEP": r"\b\d{5}-\d{3}\b",
}
CONDUTA_PROIBIDA = {
    "dose": r"\b\d+[.,]?\d*\s?(mg|ml|mcg|g|gotas|comprimidos?)\b",
    "parar tratamento": r"pode (parar|suspender|interromper)",
    "dispensar médico": r"n[ãa]o precisa (ir ao|procurar|falar com)( o)? (m[ée]dic|equipe)",
}


def palavras(t):
    return len(t.split())


def main():
    base = json.loads(ARQ.read_text(encoding="utf-8"))
    erros, avisos, ids = [], [], set()

    for v in base.get("verbetes", []):
        vid = v.get("id", "?")
        for c in OBRIGATORIOS:
            if not v.get(c):
                erros.append(f"{vid}: falta o campo '{c}'")
        for c in v:
            if c not in PERMITIDOS:
                erros.append(f"{vid}: campo desconhecido '{c}'")
        if vid in ids:
            erros.append(f"{vid}: id repetido")
        ids.add(vid)
        if not re.fullmatch(r"(tx|cp)-\d{3}", vid):
            erros.append(f"{vid}: id fora do padrão tx-001 / cp-001")
        if v.get("area") not in ("transplante", "paliativos"):
            erros.append(f"{vid}: area inválida")
        if v.get("tipo_fonte") not in ("aberta", "resumo_proprio"):
            erros.append(f"{vid}: tipo_fonte inválido")
        if v.get("status") not in ("rascunho", "revisado"):
            erros.append(f"{vid}: status inválido")
        if not any(v.get("fonte", "").startswith(f) for f in FONTES_ACEITAS):
            erros.append(f"{vid}: fonte não aprovada -> '{v.get('fonte')}'")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v.get("data_acesso", "")):
            erros.append(f"{vid}: data_acesso deve ser AAAA-MM-DD")

        n = palavras(v.get("explicacao", ""))
        if n > 120:
            erros.append(f"{vid}: explicação com {n} palavras (máx. 120)")
        elif n < 40:
            avisos.append(f"{vid}: explicação curta ({n} palavras, ideal 40–120)")
        if palavras(v.get("citacao", "")) > 25:
            erros.append(f"{vid}: citação literal passa de 25 palavras")
        if v.get("tipo_fonte") == "resumo_proprio" and palavras(v.get("citacao", "")) > 15:
            erros.append(f"{vid}: obra protegida — citação literal deve ter até 15 palavras")
        if v.get("tipo_fonte") == "aberta" and not v.get("link"):
            avisos.append(f"{vid}: fonte aberta sem link")
        if not isinstance(v.get("termos"), list) or len(v.get("termos", [])) < 2:
            erros.append(f"{vid}: 'termos' precisa de pelo menos 2 itens")

        texto = " ".join(str(v.get(c, "")) for c in ("tema", "explicacao", "citacao", "o_que_perguntar"))
        for nome, padrao in DADO_PESSOAL.items():
            if re.search(padrao, texto, re.IGNORECASE):
                erros.append(f"{vid}: possível dado pessoal ({nome})")
        for nome, padrao in CONDUTA_PROIBIDA.items():
            if re.search(padrao, texto, re.IGNORECASE):
                erros.append(f"{vid}: conduta clínica proibida ({nome})")

    # exporta CSV para mostrar como planilha no pitch
    with open(RAIZ / "dados" / "biblioteca.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["id", "area", "tema", "explicacao", "fonte", "link", "data_acesso", "status"])
        for v in base["verbetes"]:
            w.writerow([v.get(c, "") for c in ["id", "area", "tema", "explicacao", "fonte", "link", "data_acesso", "status"]])

    total = len(base["verbetes"])
    revisados = sum(1 for v in base["verbetes"] if v.get("status") == "revisado")
    por_area = {a: sum(1 for v in base["verbetes"] if v.get("area") == a) for a in ("transplante", "paliativos")}
    print(f"Verbetes: {total}  (transplante {por_area['transplante']} · paliativos {por_area['paliativos']})  ·  revisados: {revisados}")
    for a in avisos:
        print("  AVISO ", a)
    for e in erros:
        print("  ERRO  ", e)
    print("OK — base válida." if not erros else f"{len(erros)} erro(s). Corrija antes do commit.")
    sys.exit(1 if erros else 0)


if __name__ == "__main__":
    main()
