#!/usr/bin/env python3
"""
Extrai logo, fotos e identidade de um perfil público do Instagram.

Muitos negócios locais não têm site, só Instagram — e para eles esta é a única
fonte de material real. Sem isso o protótipo cai em imagem de banco, que é bem
pior: as fotos do perfil são do negócio de verdade, do espaço dele, do trabalho
dele.

## Como funciona, e o que isso implica

O `curl` puro num perfil devolve só o shell do aplicativo. Os dados vêm do
endpoint interno que a própria página consome, e ele responde quando se manda
o cabeçalho `x-ig-app-id` que o app web usa.

Duas consequências que valem saber:

- **É endpoint interno, não API publicada.** Pode mudar ou parar sem aviso. Se
  parar, o script falha com mensagem clara e o caminho manual continua valendo
  — abrir o perfil, salvar a logo em `fonte/imagens/` e colar a bio no campo
  de observações do lead.
- **Só perfil público**, e em volume baixo. Isto roda alguns leads por dia,
  como quem abre o perfil no navegador. Rajada leva a bloqueio de IP.

Uso:
    python3 .claude/skills/prototipo-site/scripts/instagram.py <perfil> <slug> [qtd_fotos]

    <perfil> aceita "arkeosistemas", "@arkeosistemas" ou a URL completa.

Escreve em prototipos/<slug>/fonte/, no mesmo formato de `extrair.py`.
"""

import base64
import json
import os
import re
import sys
import urllib.error
import urllib.parse

from _comum import buscar, paleta_da_logo, processar_imagem

# Identificador do aplicativo web do Instagram. Sem ele o endpoint devolve o
# shell em vez do JSON do perfil.
APP_ID = "936619743392459"
API = "https://www.instagram.com/api/v1/users/web_profile_info/?username="

MAX_FOTOS_PADRAO = 6


def handle_de(entrada: str) -> str:
    """Aceita URL completa, @arroba ou o nome puro."""
    valor = entrada.strip().rstrip("/")
    if "instagram.com" in valor:
        caminho = urllib.parse.urlparse(valor).path.strip("/")
        valor = caminho.split("/")[0] if caminho else ""
    return valor.lstrip("@")


def buscar_perfil(handle: str) -> dict:
    cabecalhos = {
        "x-ig-app-id": APP_ID,
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
        ),
        "Accept": "application/json",
    }
    bruto, _, _ = buscar(API + urllib.parse.quote(handle), 4_000_000, cabecalhos)
    dados = json.loads(bruto)
    usuario = (dados.get("data") or {}).get("user")
    if not usuario:
        raise ValueError("perfil sem dados — pode ser privado, inexistente ou renomeado")
    return usuario


def fotos_do_perfil(usuario: dict, limite: int):
    """
    Fotos do feed, das mais recentes para as mais antigas.

    Vídeo fica de fora: o protótipo é um arquivo único e um MP4 em data: URI
    estouraria o limite sozinho. Carrossel entra pela imagem de capa.
    """
    selecionadas = []
    for aresta in (usuario.get("edge_owner_to_timeline_media") or {}).get("edges", []):
        no = aresta.get("node") or {}
        if no.get("__typename") == "GraphVideo":
            continue
        url = no.get("display_url")
        if not url:
            continue
        legenda = ""
        legendas = (no.get("edge_media_to_caption") or {}).get("edges", [])
        if legendas:
            legenda = (legendas[0].get("node") or {}).get("text", "")[:140]
        selecionadas.append({
            "url": url,
            "legenda": " ".join(legenda.split()),
            "curtidas": (no.get("edge_liked_by") or {}).get("count", 0),
        })
        if len(selecionadas) >= limite:
            break
    return selecionadas


def salvar(dados: bytes, contexto: str, nome: str, destino: str):
    analise = processar_imagem(dados, contexto)
    if not analise:
        return None
    caminho = os.path.join(destino, "imagens", f"{nome}.webp")
    with open(caminho, "wb") as arquivo:
        arquivo.write(analise["bytes"])
    uri = "data:image/webp;base64," + base64.b64encode(analise["bytes"]).decode()
    with open(os.path.join(destino, "datauris", f"{nome}.txt"), "w") as arquivo:
        arquivo.write(uri)
    analise["arquivo"] = f"{nome}.webp"
    analise["bytes_datauri"] = len(uri)
    return analise


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)

    handle = handle_de(sys.argv[1])
    slug = sys.argv[2]
    limite = int(sys.argv[3]) if len(sys.argv) > 3 else MAX_FOTOS_PADRAO

    if not handle:
        print("ERRO: não consegui ler o nome do perfil.")
        sys.exit(2)

    destino = os.path.join("prototipos", slug, "fonte")
    os.makedirs(os.path.join(destino, "imagens"), exist_ok=True)
    os.makedirs(os.path.join(destino, "datauris"), exist_ok=True)

    try:
        usuario = buscar_perfil(handle)
    except urllib.error.HTTPError as erro:
        print(f"ERRO: o Instagram respondeu {erro.code}.")
        print("Se for 401 ou 429, é bloqueio — espere um pouco ou siga pelo caminho manual:")
        print("abra o perfil, salve a logo em fonte/imagens/ e cole a bio nas observações do lead.")
        sys.exit(1)
    except Exception as erro:
        print(f"ERRO: {type(erro).__name__}: {erro}")
        print("Siga pelo caminho manual — abra o perfil e salve a logo em fonte/imagens/.")
        sys.exit(1)

    salvas = []
    paleta = None

    url_logo = usuario.get("profile_pic_url_hd") or usuario.get("profile_pic_url")
    if url_logo:
        try:
            bruto, _, _ = buscar(url_logo, 8_000_000)
            analise = salvar(bruto, "logo", "ig-logo", destino)
            if analise:
                analise["papel"] = "logo / marca"
                analise["legenda"] = "foto de perfil"
                salvas.append(analise)
                paleta = analise.get("paleta")
        except Exception:
            print("  ! não consegui baixar a foto de perfil")

    for i, foto in enumerate(fotos_do_perfil(usuario, limite)):
        try:
            bruto, _, _ = buscar(foto["url"], 12_000_000)
            analise = salvar(bruto, "foto", f"ig-post-{i}", destino)
        except Exception:
            continue
        if analise:
            analise["legenda"] = foto["legenda"]
            salvas.append(analise)
            print(f"  ok {analise['arquivo']}  {analise['formato']}  {analise['bytes_datauri']//1024} KB")

    # ── relatório ────────────────────────────────────────────────────────
    linhas = [f"# Material extraído do Instagram @{handle}", ""]

    linhas += ["## Identidade", ""]
    for rotulo, valor in [
        ("Nome no perfil", usuario.get("full_name")),
        ("Categoria", usuario.get("business_category_name") or usuario.get("category_name")),
        ("Site informado na bio", usuario.get("external_url")),
        ("Seguidores", (usuario.get("edge_followed_by") or {}).get("count")),
        ("Publicações", (usuario.get("edge_owner_to_timeline_media") or {}).get("count")),
    ]:
        if valor:
            linhas.append(f"- **{rotulo}:** {valor}")
    linhas.append("")

    bio = usuario.get("biography") or ""
    if bio.strip():
        linhas += [
            "## Bio", "",
            "É afirmação do próprio negócio — pode ser reaproveitada com fidelidade.", "",
            "```", bio.strip(), "```", "",
        ]

    if usuario.get("external_url"):
        linhas += [
            "> A bio informa um site. Se ele abrir, rode `extrair.py` nele também —",
            "> site rende mais texto e mais contexto que o perfil.", "",
        ]

    if paleta:
        s_ = paleta["sugestao"]
        linhas += [
            "## Paleta da marca (vinda da foto de perfil)", "",
            "**Use esta paleta.** A logo é o único elemento de identidade que temos, e o",
            "protótipo precisa parecer do cliente. Vale mesmo havendo referência visual:",
            "a referência dá estrutura e clima, a logo dá a cor.", "",
            "Cores encontradas: " + " ".join(f"`{c}`" for c in paleta["marca"]), "",
            "```css",
            f"--primary: {s_['primary']};",
            f"--accent:  {s_['accent']};",
            f"--surface: {s_['surface']};",
            f"--ink:     {s_['ink']};",
            "```", "",
            f"Acento em {paleta['contraste_accent']}:1 sobre branco"
            + (" — escurecido a partir da cor da logo, preservando o matiz."
               if paleta["accent_ajustado"] else "."),
            "",
        ]

    if salvas:
        total = sum(i["bytes_datauri"] for i in salvas)
        linhas += [
            "## Elenco de imagens", "",
            f"Somando todas: **{total // 1024} KB** em data: URI. O arquivo final fica",
            "abaixo de 400 KB, então escolha — não use todas.", "",
            "**Abra os arquivos em `fonte/imagens/` e olhe cada um.** São fotos reais do",
            "negócio: valem muito mais que imagem de banco, mas nem toda foto de feed",
            "serve num site — descarte print, card de texto, foto escura e imagem com",
            "promoção antiga embutida.", "",
            "| arquivo | formato | proporção | tipo | papel sugerido | legenda | KB |",
            "|---|---|---|---|---|---|---|",
        ]
        for item in sorted(salvas, key=lambda i: ("logo" not in i["papel"], i["bytes_datauri"])):
            linhas.append(
                f'| `{item["arquivo"]}` | {item["formato"]} | {item["razao"]}:1 | {item["tipo"]} | '
                f'{item["papel"]} | {(item.get("legenda") or "—")[:50]} | '
                f'{item["bytes_datauri"] // 1024} |'
            )
        linhas += ["",
                   "Fotos do feed costumam ser quadradas ou em retrato 4:5 — encaixam bem em",
                   "grade e coluna, e mal em faixa de largura total.", ""]
    else:
        linhas += ["## Imagens", "", "Nenhuma imagem aproveitável foi baixada.", ""]

    # Não sobrescreve o relatório do site, quando já existe um.
    nome_relatorio = "relatorio.md"
    if os.path.exists(os.path.join(destino, nome_relatorio)):
        nome_relatorio = "relatorio-instagram.md"
    caminho_relatorio = os.path.join(destino, nome_relatorio)
    with open(caminho_relatorio, "w", encoding="utf-8") as arquivo:
        arquivo.write("\n".join(linhas))

    print(json.dumps({
        "perfil": handle,
        "relatorio": caminho_relatorio,
        "imagens": len(salvas),
        "kb_datauri_total": sum(i["bytes_datauri"] for i in salvas) // 1024,
        "site_na_bio": usuario.get("external_url"),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
