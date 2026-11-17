#!/usr/bin/env python3
"""
Limpa a transcrição/anotações do curso e quebra em trechos para curadoria.

Uso:
    python3 scripts/limpar_transcricao.py "dados/brutos/INFORMAÇÕES SOBRE CUIDADOS PALIATIVOS.docx"

Saídas:
    dados/limpos/trechos_paliativos.json   -> trechos limpos (ainda NÃO são verbetes)
    dados/limpos/relatorio_limpeza.md      -> números do antes/depois (prova do edital)

Aceita .docx de verdade ou arquivo de texto/markdown com extensão .docx (caso das anotações exportadas).
"""
import json
import re
import sys
import unicodedata
import zipfile
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / "dados" / "limpos"

# Frases de plataforma/conversa de aula que não são conteúdo
RUIDO = [
    r"clique (acima|abaixo)",
    r"arquivos para baixar",
    r"baixar o slide",
    r"deixar algum coment[áa]rio",
    r"responderemos assim que poss[íi]vel",
    r"aulas gravadas",
    r"espa[çc]os? para d[úu]vida",
    r"^conte[úu]do da aula:?$",
    r"^anota[çc][õo]es da aula$",
    r"^aula \d+( ao vivo)?$",
    r"seguir determinado roteiro",
]
RUIDO_RE = [re.compile(p, re.IGNORECASE) for p in RUIDO]

# Erros de transcrição conhecidos -> marcados para revisão (não corrigidos automaticamente)
SUSPEITAS = {
    "mochila": "morfina?",
    "cuidados relativos": "cuidados paliativos?",
    "luta antecipatório": "luto antecipatório?",
}

MIN_PALAVRAS, ALVO_PALAVRAS, MAX_PALAVRAS = 40, 180, 260


def ler_texto(caminho: Path) -> str:
    if zipfile.is_zipfile(caminho):
        import docx  # python-docx
        return "\n\n".join(p.text for p in docx.Document(caminho).paragraphs)
    return caminho.read_text(encoding="utf-8", errors="replace")


def limpar_linha(linha: str) -> str:
    linha = linha.replace("​", "").replace("﻿", "")
    linha = re.sub(r"[*_]{1,3}", "", linha)                        # negrito/itálico markdown
    linha = "".join(c for c in linha if unicodedata.category(c) != "So")  # emojis
    linha = re.sub(r"\s+", " ", linha).strip()
    linha = linha.strip('"“” ')
    return linha


def eh_ruido(linha: str) -> bool:
    return any(r.search(linha) for r in RUIDO_RE)


def detectar_suspeitas(texto: str) -> list:
    achados = []
    baixo = texto.lower()
    for errado, talvez in SUSPEITAS.items():
        if errado in baixo:
            achados.append(f"'{errado}' → {talvez}")
    return achados


def quebrar_em_trechos(paragrafos: list) -> list:
    trechos, atual = [], []
    for p in paragrafos:
        atual.append(p)
        n = sum(len(x.split()) for x in atual)
        if n >= ALVO_PALAVRAS:
            trechos.append(" ".join(atual))
            atual = []
    if atual:
        resto = " ".join(atual)
        if trechos and len(resto.split()) < MIN_PALAVRAS:
            trechos[-1] += " " + resto
        else:
            trechos.append(resto)
    # corta trechos gigantes (parágrafo único muito longo) por frase
    final = []
    for t in trechos:
        if len(t.split()) <= MAX_PALAVRAS:
            final.append(t)
            continue
        frases, bloco = re.split(r"(?<=[.!?])\s+", t), []
        for f in frases:
            bloco.append(f)
            if len(" ".join(bloco).split()) >= ALVO_PALAVRAS:
                final.append(" ".join(bloco))
                bloco = []
        if bloco:
            final.append(" ".join(bloco))
    return final


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    entrada = Path(sys.argv[1])
    bruto = ler_texto(entrada)

    linhas_brutas = [l for l in bruto.splitlines() if l.strip()]
    palavras_brutas = len(bruto.split())

    vistos, paragrafos, removidas, duplicadas = set(), [], [], 0
    for l in linhas_brutas:
        limpa = limpar_linha(l)
        if not limpa:
            continue
        if eh_ruido(limpa):
            removidas.append(limpa[:90])
            continue
        chave = re.sub(r"\W+", "", limpa.lower())
        if chave in vistos:
            duplicadas += 1
            continue
        vistos.add(chave)
        paragrafos.append(limpa)

    trechos = quebrar_em_trechos(paragrafos)
    SAIDA.mkdir(parents=True, exist_ok=True)

    dados = []
    for i, t in enumerate(trechos, 1):
        dados.append({
            "id": f"paliativos-t{i:03d}",
            "fonte": "Arantes, A. C. Q. — curso Como Trazer Paz para a Morte (anotações de aula)",
            "palavras": len(t.split()),
            "suspeitas_transcricao": detectar_suspeitas(t),
            "texto": t,
            "virou_verbete": None,
        })

    (SAIDA / "trechos_paliativos.json").write_text(
        json.dumps({"gerado_em": str(date.today()), "origem": entrada.name, "trechos": dados},
                   ensure_ascii=False, indent=2), encoding="utf-8")

    palavras_limpas = sum(d["palavras"] for d in dados)
    com_suspeita = sum(1 for d in dados if d["suspeitas_transcricao"])
    relatorio = f"""# Relatório de limpeza — {entrada.name}

Gerado em {date.today()} por `scripts/limpar_transcricao.py`.

| Medida | Antes | Depois |
|---|---|---|
| Palavras | {palavras_brutas} | {palavras_limpas} |
| Linhas/parágrafos | {len(linhas_brutas)} | {len(paragrafos)} |
| Trechos para curadoria | — | {len(dados)} |

- Linhas de plataforma/conversa removidas: **{len(removidas)}**
- Parágrafos duplicados removidos: **{duplicadas}**
- Trechos com possível erro de transcrição (revisar à mão): **{com_suspeita}**

## Exemplos de linhas removidas
""" + "\n".join(f"- {r}" for r in removidas[:10]) + """

## Próximo passo
Curadoria: transformar trechos em verbetes seguindo `docs/regras-higienizacao.md`.
"""
    (SAIDA / "relatorio_limpeza.md").write_text(relatorio, encoding="utf-8")
    print(relatorio)


if __name__ == "__main__":
    main()
