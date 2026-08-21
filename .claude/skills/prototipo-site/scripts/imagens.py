#!/usr/bin/env python3
"""
Busca imagens de apoio em domínio público para protótipos sem foto própria.

Site sem imagem nenhuma parece pobre, e isso derruba o argumento do protótipo.
Mas foto de banco que finge ser o negócio é pior ainda — "nossa equipe" com
gente que não trabalha lá é o que denuncia template na hora, e em clínica
chega a ser problema de publicidade.

A saída é o tipo de foto: **ambiente, textura, detalhe e material**, que criam
clima sem afirmar nada sobre aquele negócio. As consultas abaixo são escritas
para isso — repare que nenhuma pede rosto, equipe ou fachada.

Fonte: Openverse (WordPress), filtrado em `license=cc0,pdm`. São imagens em
domínio público ou CC0: uso comercial liberado e **sem exigência de
atribuição**. O filtro não é opcional — o Openverse também indexa CC-BY, que
exigiria crédito visível na página do cliente.

Uso:
    python3 .claude/skills/prototipo-site/scripts/imagens.py <slug> <template> [quantidade]
    python3 .claude/skills/prototipo-site/scripts/imagens.py <slug> --busca "textura madeira" 3

Escreve em prototipos/<slug>/banco/:
    relatorio.md   elenco com proporção, licença e origem de cada imagem
    imagens/       arquivos em WebP, redimensionados
    datauris/      o mesmo, em data: URI pronto para colar
"""

import base64
import io
import json
import os
import re
import sys
import urllib.parse
import urllib.request

API = "https://api.openverse.org/v1/images/"
TIMEOUT = 20
UA = "ArkeoSitesBot/1.0 (+https://www.arkeosistemas.com.br)"

LARGURA_ALVO = 1400
QUALIDADE_WEBP = 80
# Abaixo disso a foto borra ao ocupar meia tela.
MIN_LARGURA_ORIGEM = 900

# Consultas por template. Todas pedem ambiente, textura, detalhe ou material —
# nunca pessoa identificável, equipe ou fachada, que são o que faria a imagem
# parecer uma afirmação sobre este negócio específico.
CONSULTAS = {
    "clinica": [
        "dental instruments macro",
        "medical equipment clean white",
        "clinic waiting room interior",
        "stethoscope minimal",
    ],
    "juridico": [
        "law books shelf",
        "office desk documents",
        "classical building columns",
        "fountain pen paper",
    ],
    "food": [
        "fresh ingredients wooden table",
        "coffee cup close up",
        "restaurant table setting",
        "bread texture close up",
    ],
    "beleza": [
        "barber scissors tools",
        "cosmetics bottles minimal",
        "salon interior chair",
        "flowers soft neutral",
    ],
    "servico-local": [
        "workshop tools bench",
        "car engine detail",
        "gym weights equipment",
        "metal texture industrial",
    ],
}


def buscar_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read())


def baixar(url, limite=15_000_000):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.read(limite)


def classificar_formato(largura, altura):
    razao = largura / altura if altura else 1
    if razao >= 2.5:
        return "faixa", razao
    if razao >= 1.4:
        return "paisagem", razao
    if razao >= 0.85:
        return "quadrada", razao
    if razao >= 0.5:
        return "retrato", razao
    return "muito-estreita", razao


def papel_por_formato(formato):
    return {
        "faixa": "faixa de largura total ou fundo de herói",
        "paisagem": "herói, capa de seção ou card largo",
        "quadrada": "grade ou miniatura",
        "retrato": "coluna lateral ou destaque vertical",
        "muito-estreita": "uso restrito",
    }[formato]


def processar(bytes_originais):
    from PIL import Image

    imagem = Image.open(io.BytesIO(bytes_originais))
    largura_origem, altura_origem = imagem.size
    if largura_origem < MIN_LARGURA_ORIGEM:
        return None

    if imagem.mode not in ("RGB", "RGBA"):
        imagem = imagem.convert("RGB")
    if largura_origem > LARGURA_ALVO:
        altura = round(altura_origem * LARGURA_ALVO / largura_origem)
        imagem = imagem.resize((LARGURA_ALVO, altura), Image.LANCZOS)

    saida = io.BytesIO()
    imagem.save(saida, format="WEBP", quality=QUALIDADE_WEBP, method=4)
    largura, altura = imagem.size
    formato, razao = classificar_formato(largura, altura)
    return {
        "bytes": saida.getvalue(),
        "largura": largura,
        "altura": altura,
        "formato": formato,
        "razao": round(razao, 2),
        "papel": papel_por_formato(formato),
    }


def buscar_imagens(consulta, quantidade):
    parametros = urllib.parse.urlencode({
        "q": consulta,
        # Sem este filtro entram CC-BY, que exigem crédito visível — inaceitável
        # numa página que vai para o cliente.
        "license": "cc0,pdm",
        "page_size": max(quantidade * 4, 12),
        "mature": "false",
    })
    try:
        return buscar_json(f"{API}?{parametros}").get("results", [])
    except Exception as erro:
        print(f"  ! busca '{consulta}' falhou: {type(erro).__name__}")
        return []


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)

    slug = sys.argv[1]

    if sys.argv[2] == "--busca":
        consultas = [sys.argv[3]]
        quantidade = int(sys.argv[4]) if len(sys.argv) > 4 else 3
    else:
        template = sys.argv[2]
        if template not in CONSULTAS:
            print(f"Template desconhecido: {template}. Use um de {', '.join(CONSULTAS)}.")
            sys.exit(2)
        consultas = CONSULTAS[template]
        quantidade = int(sys.argv[3]) if len(sys.argv) > 3 else 4

    destino = os.path.join("prototipos", slug, "banco")
    os.makedirs(os.path.join(destino, "imagens"), exist_ok=True)
    os.makedirs(os.path.join(destino, "datauris"), exist_ok=True)

    salvas = []
    vistas = set()

    for consulta in consultas:
        if len(salvas) >= quantidade:
            break
        print(f"buscando: {consulta}")
        for item in buscar_imagens(consulta, quantidade):
            if len(salvas) >= quantidade:
                break
            url = item.get("url")
            if not url or url in vistas:
                continue
            vistas.add(url)

            licenca = (item.get("license") or "").lower()
            # Cinto e suspensório: confere item a item, não só no parâmetro.
            if licenca not in ("cc0", "pdm"):
                continue

            try:
                bruto = baixar(url)
                analise = processar(bruto)
            except Exception:
                continue
            if not analise:
                continue

            nome = re.sub(r"[^a-z0-9]+", "-", (item.get("title") or "imagem").lower())[:36].strip("-")
            nome = f"{nome or 'imagem'}-{len(salvas)}"

            caminho = os.path.join(destino, "imagens", f"{nome}.webp")
            with open(caminho, "wb") as arquivo:
                arquivo.write(analise["bytes"])
            uri = "data:image/webp;base64," + base64.b64encode(analise["bytes"]).decode()
            with open(os.path.join(destino, "datauris", f"{nome}.txt"), "w") as arquivo:
                arquivo.write(uri)

            salvas.append({
                "arquivo": f"{nome}.webp",
                "titulo": (item.get("title") or "")[:60],
                "consulta": consulta,
                "licenca": f"{licenca} {item.get('license_version', '')}".strip(),
                "fonte": item.get("source", ""),
                "pagina": item.get("foreign_landing_url", ""),
                "formato": analise["formato"],
                "razao": analise["razao"],
                "dimensoes": f'{analise["largura"]}x{analise["altura"]}',
                "papel": analise["papel"],
                "kb": len(uri) // 1024,
            })
            print(f"  ok {nome}.webp  {analise['formato']}  {len(uri)//1024} KB")

    linhas = ["# Imagens de apoio (banco de domínio público)", ""]
    if not salvas:
        linhas += ["Nenhuma imagem aproveitável encontrada.", "",
                   "Siga sem foto — a doutrina de design cobre o caso, e página sem imagem",
                   "é melhor que página com imagem ruim.", ""]
    else:
        total = sum(i["kb"] for i in salvas)
        linhas += [
            f"{len(salvas)} imagens, {total} KB somados em data: URI. O arquivo final fica",
            "abaixo de 400 KB — use duas ou três, não todas.", "",
            "**Todas em domínio público ou CC0: uso comercial livre, sem exigir crédito.**",
            "", "Regras de uso em `references/design.md`, seção *Imagens de apoio*. Em resumo:",
            "servem para clima, textura e contexto — nunca para afirmar algo sobre este",
            "negócio. E toda imagem de banco usada entra na seção de placeholders da",
            "página, declarada como ilustrativa.", "",
            "| arquivo | formato | proporção | papel sugerido | licença | KB |",
            "|---|---|---|---|---|---|",
        ]
        for i in salvas:
            linhas.append(
                f'| `{i["arquivo"]}` | {i["formato"]} | {i["razao"]}:1 | {i["papel"]} | '
                f'{i["licenca"]} | {i["kb"]} |'
            )
        linhas += ["", "Origem de cada uma:", ""]
        for i in salvas:
            linhas.append(f'- `{i["arquivo"]}` — "{i["titulo"]}" ({i["fonte"]}) {i["pagina"]}')
        linhas.append("")

    caminho_relatorio = os.path.join(destino, "relatorio.md")
    with open(caminho_relatorio, "w", encoding="utf-8") as arquivo:
        arquivo.write("\n".join(linhas))

    print(json.dumps({
        "imagens": len(salvas),
        "kb_total": sum(i["kb"] for i in salvas),
        "relatorio": caminho_relatorio,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
