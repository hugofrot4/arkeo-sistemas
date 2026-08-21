#!/usr/bin/env python3
"""
Extrai logo, fotos e identidade de um perfil público do Instagram.

Muitos negócios locais não têm site, só Instagram — e para eles esta é a única
fonte de material real. Sem isso o protótipo cai em imagem de banco, que é bem
pior: as fotos do perfil são do negócio de verdade, do espaço dele, do trabalho
dele.

## Dois caminhos, nesta ordem

1. **Endpoint interno** (`/api/v1/users/web_profile_info/`), com o cabeçalho
   `x-ig-app-id` que o aplicativo web usa. É rápido — dois segundos — e devolve
   a foto de perfil em alta e as legendas de verdade. Também é o que **responde
   429 com facilidade**.

2. **Navegador de verdade** (Chromium via Playwright), quando o primeiro falha.
   Mais lento — uns trinta segundos — mas passa onde requisição não passa.

O motivo de precisar do navegador: quando o endpoint bloqueia, `curl` no perfil
devolve o *login wall* — 600 KB de HTML sem um único `scontent`, sem
`profile_pic_url`, com `<title>Instagram</title>`. O perfil público é montado
por JavaScript, e só um navegador o executa.

## O que muda quando cai no navegador

O relatório avisa qual caminho foi usado, porque o material não é equivalente:

- **Foto de perfil pequena.** A URL vem assinada para o recorte servido, quase
  sempre 150px. Trocar `s150x150` por `s320x320`, `s1080x1080` ou tirar o `stp`
  invalida a assinatura — 403 nos quatro casos. Quando só houver 150px, **não
  amplie o selo além disso** no protótipo.
- **Fotos do feed em 640px**, contra o `display_url` cheio do endpoint.
- **Texto alternativo no lugar da legenda.** Troca boa: o alternativo do
  Instagram inclui OCR do texto dentro da imagem, que é justamente o que
  denuncia card de texto — e às vezes entrega fato do negócio (lista de
  especialidades, dias de atendimento) que a legenda não traz.
- **Vídeos entram pela capa**, marcados como tal.

## Limites que continuam valendo

- **É endpoint interno e é navegação automatizada, não API publicada.** Pode
  mudar ou parar sem aviso.
- **Só perfil público**, e em volume baixo. Isto roda alguns leads por dia,
  como quem abre o perfil no navegador. Rajada leva a bloqueio de IP.
- Falhando os dois, o caminho manual continua valendo — abrir o perfil, salvar
  a logo em `fonte/imagens/` e colar a bio nas observações do lead.

Uso:
    python3 .claude/skills/prototipo-site/scripts/instagram.py <perfil> <slug> [qtd_fotos]

    <perfil> aceita "arkeosistemas", "@arkeosistemas" ou a URL completa.

Escreve em prototipos/<slug>/fonte/, no mesmo formato de `extrair.py`.
"""

import base64
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse

from _comum import buscar, paleta_da_logo, processar_imagem

# Identificador do aplicativo web do Instagram. Sem ele o endpoint devolve o
# shell em vez do JSON do perfil.
APP_ID = "936619743392459"
API = "https://www.instagram.com/api/v1/users/web_profile_info/?username="

MAX_FOTOS_PADRAO = 6

# Resolvido a partir do próprio arquivo: o script tem que rodar de qualquer
# diretório, e o Playwright está instalado aqui dentro, não no projeto.
DIR_SCRIPTS = os.path.dirname(os.path.abspath(__file__))
COLETOR = os.path.join(DIR_SCRIPTS, "_ig_navegador.mjs")

# O navegador precisa carregar a página, rolar quatro vezes e baixar as imagens.
TIMEOUT_NAVEGADOR = 180


def handle_de(entrada: str) -> str:
    """Aceita URL completa, @arroba ou o nome puro."""
    valor = entrada.strip().rstrip("/")
    if "instagram.com" in valor:
        caminho = urllib.parse.urlparse(valor).path.strip("/")
        valor = caminho.split("/")[0] if caminho else ""
    return valor.lstrip("@")


def buscar_perfil(handle: str) -> dict:
    """Perfil pelo endpoint interno. Levanta HTTPError em 401/429."""
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

    Vídeo fica de fora neste caminho: o endpoint entrega o `display_url` cheio,
    e um MP4 em data: URI estouraria o limite do arquivo sozinho. Carrossel
    entra pela imagem de capa.
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
        })
        if len(selecionadas) >= limite:
            break
    return selecionadas


def coletar_via_api(handle: str, limite: int) -> dict:
    """Caminho rápido. Baixa as imagens por requisição comum."""
    usuario = buscar_perfil(handle)

    logo = None
    url_logo = usuario.get("profile_pic_url_hd") or usuario.get("profile_pic_url")
    if url_logo:
        try:
            logo, _, _ = buscar(url_logo, 8_000_000)
        except Exception:
            print("  ! não consegui baixar a foto de perfil")

    posts = []
    for foto in fotos_do_perfil(usuario, limite):
        try:
            bruto, _, _ = buscar(foto["url"], 12_000_000)
        except Exception:
            continue
        posts.append({"bytes": bruto, "legenda": foto["legenda"], "tipo": "foto"})

    return {
        "via": "endpoint interno",
        "handle": handle,
        "nome": usuario.get("full_name"),
        "categoria": usuario.get("business_category_name") or usuario.get("category_name"),
        "site": usuario.get("external_url"),
        "bio": usuario.get("biography") or "",
        "seguidores": (usuario.get("edge_followed_by") or {}).get("count"),
        "publicacoes": (usuario.get("edge_owner_to_timeline_media") or {}).get("count"),
        "destaques": [],
        "logo": logo,
        "logo_pequena": False,
        "posts": posts,
    }


def coletar_via_navegador(handle: str, limite: int) -> dict:
    """
    Caminho lento. Abre o perfil no Chromium, que executa o JavaScript e
    devolve a página pública inteira — onde requisição só recebe o login wall.
    """
    if not os.path.exists(COLETOR):
        raise RuntimeError(f"coletor não encontrado em {COLETOR}")
    if shutil.which("node") is None:
        raise RuntimeError("node não está no PATH")

    temporario = tempfile.mkdtemp(prefix="ig-")
    try:
        processo = subprocess.run(
            ["node", COLETOR, handle, temporario, str(limite)],
            capture_output=True, text=True, timeout=TIMEOUT_NAVEGADOR,
            cwd=DIR_SCRIPTS,  # o Playwright está no node_modules daqui
        )
        if processo.returncode != 0:
            detalhe = (processo.stderr or processo.stdout or "").strip().splitlines()
            raise RuntimeError(detalhe[-1] if detalhe else "o coletor falhou sem mensagem")

        colhido = json.loads(processo.stdout.strip().splitlines()[-1])

        def ler(nome):
            caminho = os.path.join(temporario, nome)
            if not nome or not os.path.exists(caminho):
                return None
            with open(caminho, "rb") as arquivo:
                return arquivo.read()

        logo_info = colhido.get("logo") or {}
        logo = ler(logo_info.get("arquivo"))

        posts = []
        for post in colhido.get("posts", []):
            bruto = ler(post.get("arquivo"))
            if bruto:
                posts.append({
                    "bytes": bruto,
                    "legenda": post.get("alt", ""),
                    "tipo": post.get("tipo", "foto"),
                })

        return {
            "via": "navegador",
            "handle": handle,
            "nome": colhido.get("nome"),
            "categoria": None,  # não aparece para quem não está logado
            "site": colhido.get("site"),
            "bio": colhido.get("bio") or "",
            "seguidores": colhido.get("seguidores"),
            "publicacoes": colhido.get("publicacoes"),
            "destaques": colhido.get("destaques") or [],
            "logo": logo,
            "logo_pequena": not logo_info.get("ampliada", False),
            "posts": posts,
        }
    finally:
        shutil.rmtree(temporario, ignore_errors=True)


def coletar(handle: str, limite: int) -> dict:
    """Endpoint interno primeiro, navegador quando ele bloquear."""
    try:
        return coletar_via_api(handle, limite)
    except Exception as erro:
        motivo = f"HTTP {erro.code}" if isinstance(erro, urllib.error.HTTPError) else str(erro)
        print(f"  endpoint interno falhou ({motivo}) — abrindo o perfil no navegador")

    return coletar_via_navegador(handle, limite)


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
        perfil = coletar(handle, limite)
    except Exception as erro:
        print(f"ERRO: os dois caminhos falharam — {type(erro).__name__}: {erro}")
        print("Siga pelo caminho manual: abra o perfil, salve a logo em")
        print(f"{os.path.join(destino, 'imagens')}/ e cole a bio nas observações do lead.")
        sys.exit(1)

    print(f"  material colhido pelo {perfil['via']}")

    salvas = []
    paleta = None

    if perfil["logo"]:
        analise = salvar(perfil["logo"], "logo", "ig-logo", destino)
        if analise:
            analise["papel"] = "logo / marca"
            analise["legenda"] = "foto de perfil"
            salvas.append(analise)
            paleta = analise.get("paleta")

    for i, post in enumerate(perfil["posts"]):
        analise = salvar(post["bytes"], "foto", f"ig-post-{i}", destino)
        if analise:
            analise["legenda"] = post["legenda"]
            analise["tipo_post"] = post["tipo"]
            salvas.append(analise)
            print(f"  ok {analise['arquivo']}  {analise['formato']}  {analise['bytes_datauri']//1024} KB")

    # ── relatório ────────────────────────────────────────────────────────
    linhas = [f"# Material extraído do Instagram @{handle}", ""]

    if perfil["via"] == "navegador":
        linhas += [
            "> Colhido **pelo navegador** — o endpoint interno estava bloqueado. As fotos",
            "> vêm em 640px em vez do tamanho cheio, e no lugar da legenda vem o texto",
            "> alternativo do Instagram, que inclui OCR do texto dentro da imagem.",
            "",
        ]

    linhas += ["## Identidade", ""]
    for rotulo, valor in [
        ("Nome no perfil", perfil.get("nome")),
        ("Categoria", perfil.get("categoria")),
        ("Site informado na bio", perfil.get("site")),
        ("Seguidores", perfil.get("seguidores")),
        ("Publicações", perfil.get("publicacoes")),
    ]:
        if valor:
            linhas.append(f"- **{rotulo}:** {valor}")
    linhas.append("")

    if perfil.get("destaques"):
        linhas += [
            "## Destaques do perfil", "",
            "Os nomes dos destaques dizem que informação existe — e onde ela está hoje.",
            "Um destaque chamado *Horário* ou *Convênios* costuma ser o dado que falta na",
            "página. **O conteúdo não vem por aqui**: peça ao cliente ou registre em",
            "placeholders.", "",
            " · ".join(f"**{d}**" for d in perfil["destaques"]), "",
        ]

    bio = perfil.get("bio") or ""
    if bio.strip():
        linhas += [
            "## Bio", "",
            "É afirmação do próprio negócio — pode ser reaproveitada com fidelidade.", "",
            "```", bio.strip(), "```", "",
        ]

    if perfil.get("site"):
        linhas += [
            "> A bio informa um site. Se ele abrir, rode `extrair.py` nele também —",
            "> site rende mais texto e mais contexto que o perfil.", "",
        ]
        if "linktr.ee" in (perfil["site"] or ""):
            linhas += [
                "> É um Linktree. Vale abrir: costuma trazer o WhatsApp de verdade e as",
                "> outras redes. **Mas não use o avatar de lá como logo** — ele não",
                "> acompanha a troca de marca no Instagram e pode estar anos atrasado.",
                "",
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
            legenda = (item.get("legenda") or "—").replace("|", "/")[:70]
            linhas.append(
                f'| `{item["arquivo"]}` | {item["formato"]} | {item["razao"]}:1 | {item["tipo"]} | '
                f'{item["papel"]} | {legenda} | {item["bytes_datauri"] // 1024} |'
            )
        linhas += ["",
                   "Fotos do feed costumam ser quadradas ou em retrato 4:5 — encaixam bem em",
                   "grade e coluna, e mal em faixa de largura total.", ""]

        if perfil["via"] == "navegador":
            linhas += [
                "A coluna *legenda* aqui é o texto alternativo, não a legenda escrita pelo",
                "dono, e está cortada para caber na tabela. O texto inteiro vem abaixo.", "",
            ]

            # O alternativo do Instagram inclui OCR do texto dentro da imagem, e
            # é onde costuma estar o conteúdo que a bio não tem. Cortado na
            # tabela ele não serve para nada — aqui vai inteiro.
            com_texto = [i for i in salvas if len(i.get("legenda") or "") > 60]
            if com_texto:
                linhas += [
                    "### Texto dentro das imagens", "",
                    "O Instagram descreve o que está **dentro** de cada imagem, com OCR.",
                    "Serve para duas coisas, nesta ordem de valor:", "",
                    "1. **Achar fato publicado que não está na bio** — lista de serviços, dias",
                    "   de atendimento, telefone, slogan. É afirmação do próprio negócio e",
                    "   pode ir para a página, citada com fidelidade.",
                    "2. **Descartar card de texto**, que não serve como foto de site.", "",
                    "O OCR erra e repete palavra. **Confira na imagem antes de copiar para a",
                    "página** — dado errado sobre o próprio negócio é o que queima o lead.", "",
                ]
                for item in com_texto:
                    texto = " ".join((item.get("legenda") or "").split())[:400]
                    linhas += [f'**`{item["arquivo"]}`** — {texto}', ""]
        if perfil.get("logo_pequena"):
            linhas += [
                "### A logo veio pequena", "",
                "A URL da foto de perfil é assinada para o recorte servido, quase sempre",
                "150px, e as variantes maiores dão 403. **Esse é o tamanho que existe** —",
                "não amplie o selo além dele no protótipo, ou a logo aparece borrada",
                "justamente no elemento que o dono olha primeiro.", "",
            ]
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
        "via": perfil["via"],
        "relatorio": caminho_relatorio,
        "imagens": len(salvas),
        "kb_datauri_total": sum(i["bytes_datauri"] for i in salvas) // 1024,
        "site_na_bio": perfil.get("site"),
        "destaques": perfil.get("destaques"),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
