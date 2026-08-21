#!/usr/bin/env python3
"""
Extrai o material real do site atual de um lead: texto, logo, fotos, cores,
contatos e redes sociais.

Um protótipo que reaproveita a logo e as fotos do negócio é incomparavelmente
mais convincente do que um genérico — e resolve a falta de imagem, que é a
maior limitação quando se monta um site sem falar com o dono.

Uso:
    python3 .claude/skills/prototipo-site/scripts/extrair.py <url> <slug>

Escreve em prototipos/<slug>/fonte/:
    relatorio.md   o que foi encontrado, para você ler antes de desenhar
    imagens/       arquivos convertidos para WebP e redimensionados
    datauris/      o mesmo, já em data: URI pronto para colar no HTML

Só stdlib + Pillow. Sem rede além do próprio site do lead.
"""

import base64
import io
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser

TIMEOUT = 15
MAX_HTML = 3_000_000
MAX_IMAGE_BYTES = 12_000_000
UA = "Mozilla/5.0 (compatible; ArkeoSitesBot/1.0; +https://www.arkeosistemas.com.br)"

# Larguras de destino. Foto grande vira data: URI enorme e estoura o limite do
# arquivo, então tudo passa por redimensionamento antes de virar base64.
LARGURA_FOTO = 1100
LARGURA_LOGO = 420
QUALIDADE_WEBP = 78

# Abaixo disto é ícone, pixel de rastreamento ou espaçador — não serve de foto.
MIN_LADO_FOTO = 240


def buscar(url, limite=MAX_HTML):
    req = urllib.request.Request(url, headers={
        "User-Agent": UA,
        "Accept-Language": "pt-BR,pt;q=0.9",
    })
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resposta:
        return resposta.read(limite), resposta.geturl(), resposta.headers


class Coletor(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.titulo = None
        self._em_titulo = False
        self.meta = {}
        self.imagens = []          # (url, contexto)
        self.links = []
        self.titulos = []          # (nivel, texto)
        self._ultimo_titulo = None
        self._nivel_atual = None
        self._buffer = []
        self.texto = []
        self._ignorar = 0
        self._profundidade_cabecalho = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script", "style", "noscript"):
            self._ignorar += 1
        elif tag == "title":
            self._em_titulo = True
        elif tag == "meta":
            chave = (a.get("name") or a.get("property") or "").lower()
            if chave and a.get("content"):
                self.meta.setdefault(chave, a["content"].strip())
        elif tag == "link":
            rel = (a.get("rel") or "").lower()
            if "icon" in rel and a.get("href"):
                self.imagens.append({"src": a["href"], "contexto": "favicon",
                                     "alt": "", "secao": None})
        elif tag == "img":
            src = a.get("src") or a.get("data-src")
            if not src and a.get("srcset"):
                src = a["srcset"].split(",")[0].strip().split(" ")[0]
            if src:
                pistas = " ".join(filter(None, [
                    a.get("class", ""), a.get("id", ""), a.get("alt", ""),
                ])).lower()
                contexto = "logo" if ("logo" in pistas or self._profundidade_cabecalho > 0) else "foto"
                # `alt` e o título logo acima dizem em que seção a imagem vivia
                # no site original — é a melhor pista de para que ela serve.
                self.imagens.append({
                    "src": src,
                    "contexto": contexto,
                    "alt": (a.get("alt") or "").strip()[:120],
                    "secao": self._ultimo_titulo,
                })
        elif tag in ("header", "nav"):
            self._profundidade_cabecalho += 1
        elif tag == "a" and a.get("href"):
            self.links.append(a["href"])
        elif tag in ("h1", "h2", "h3"):
            self._nivel_atual = int(tag[1])
            self._buffer = []

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript"):
            self._ignorar = max(0, self._ignorar - 1)
        elif tag == "title":
            self._em_titulo = False
        elif tag in ("header", "nav"):
            self._profundidade_cabecalho = max(0, self._profundidade_cabecalho - 1)
        elif tag in ("h1", "h2", "h3") and self._nivel_atual:
            texto = " ".join("".join(self._buffer).split())
            if texto:
                self.titulos.append((self._nivel_atual, texto))
                self._ultimo_titulo = texto[:80]
            self._nivel_atual = None
            self._buffer = []

    def handle_data(self, dados):
        if self._ignorar:
            return
        if self._em_titulo:
            self.titulo = (self.titulo or "") + dados
        if self._nivel_atual:
            self._buffer.append(dados)
        limpo = dados.strip()
        if limpo:
            self.texto.append(limpo)


def absolutizar(base, href):
    if not href:
        return None
    href = href.strip()
    if href.startswith("data:"):
        return None
    return urllib.parse.urljoin(base, href)


def cores_do_css(html):
    """Hexadecimais mais frequentes no CSS embutido — ponto de partida da paleta."""
    achados = re.findall(r"#([0-9a-fA-F]{6})\b", html)
    contagem = {}
    for cor in achados:
        c = "#" + cor.lower()
        # Preto, branco e cinzas puros não dizem nada sobre a identidade.
        if c in ("#000000", "#ffffff") or len(set(cor.lower())) == 1:
            continue
        contagem[c] = contagem.get(c, 0) + 1
    return sorted(contagem.items(), key=lambda kv: -kv[1])[:12]


def classificar_formato(largura, altura):
    """Proporção manda no uso: faixa larga não vira card quadrado sem cortar."""
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


def analisar_conteudo(imagem):
    """
    Separa foto de elemento gráfico, e detecta recorte transparente.

    Importa para o casting: logo com fundo transparente pode ir sobre faixa de
    cor; foto não pode virar ícone; gráfico chapado não aguenta ampliação de
    tela cheia.
    """
    from PIL import Image

    amostra = imagem.convert("RGB").resize((80, 80), Image.LANCZOS)
    cores = amostra.getcolors(maxcolors=80 * 80)
    variedade = len(cores) if cores else 6400
    if variedade < 60:
        tipo = "grafico"          # logo, selo, ilustração chapada
    elif variedade < 900:
        tipo = "misto"            # banner com texto sobre foto
    else:
        tipo = "foto"

    transparente = False
    if imagem.mode in ("RGBA", "LA"):
        canal = imagem.getchannel("A")
        transparente = canal.getextrema()[0] < 250

    dominantes = []
    try:
        reduzida = amostra.quantize(colors=5, method=Image.MEDIANCUT)
        paleta = reduzida.getpalette()[:15]
        contagens = sorted(reduzida.getcolors(), reverse=True)
        for _, indice in contagens[:3]:
            r, g, b = paleta[indice * 3: indice * 3 + 3]
            dominantes.append(f"#{r:02x}{g:02x}{b:02x}")
    except Exception:
        pass

    return tipo, transparente, dominantes


def sugerir_papel(contexto, formato, tipo, transparente, largura):
    """Sugestão de uso. É ponto de partida — quem decide é quem olha a imagem."""
    if contexto == "favicon" or (transparente and tipo == "grafico" and largura <= 600):
        return "logo / marca"
    if contexto == "logo":
        return "logo / marca"
    if tipo == "grafico":
        return "selo ou elemento gráfico — não amplie"
    if formato == "faixa":
        return "faixa de largura total ou fundo de herói"
    if formato == "paisagem":
        return "herói, capa de seção ou card largo"
    if formato == "quadrada":
        return "grade de serviços, card ou miniatura"
    if formato == "retrato":
        return "coluna lateral, card alto ou destaque vertical"
    return "uso restrito — proporção difícil de encaixar"


def processar_imagem(bytes_originais, contexto):
    """Redimensiona e converte para WebP. Devolve (bytes, largura, altura, formato)."""
    from PIL import Image

    imagem = Image.open(io.BytesIO(bytes_originais))
    largura_original, altura_original = imagem.size

    if contexto == "logo" or contexto == "favicon":
        alvo = LARGURA_LOGO
    else:
        alvo = LARGURA_FOTO
        if min(largura_original, altura_original) < MIN_LADO_FOTO:
            return None

    if imagem.mode in ("P", "LA"):
        imagem = imagem.convert("RGBA")
    elif imagem.mode not in ("RGB", "RGBA"):
        imagem = imagem.convert("RGB")

    if largura_original > alvo:
        altura = round(altura_original * alvo / largura_original)
        imagem = imagem.resize((alvo, altura), Image.LANCZOS)

    tipo, transparente, dominantes = analisar_conteudo(imagem)
    largura, altura = imagem.size
    formato, razao = classificar_formato(largura, altura)

    saida = io.BytesIO()
    imagem.save(saida, format="WEBP", quality=QUALIDADE_WEBP, method=4)
    return {
        "bytes": saida.getvalue(),
        "largura": largura,
        "altura": altura,
        "formato": formato,
        "razao": round(razao, 2),
        "tipo": tipo,
        "transparente": transparente,
        "dominantes": dominantes,
        "papel": sugerir_papel(contexto, formato, tipo, transparente, largura),
    }


def main():
    if len(sys.argv) != 3:
        print(__doc__)
        sys.exit(2)

    url_inicial, slug = sys.argv[1], sys.argv[2]
    if not urllib.parse.urlparse(url_inicial).scheme:
        url_inicial = "https://" + url_inicial

    destino = os.path.join("prototipos", slug, "fonte")
    os.makedirs(os.path.join(destino, "imagens"), exist_ok=True)
    os.makedirs(os.path.join(destino, "datauris"), exist_ok=True)

    try:
        bruto, url_final, _ = buscar(url_inicial)
    except Exception as erro:
        print(f"ERRO: o site não abriu ({type(erro).__name__}: {erro})")
        print("Siga sem material do site atual — provavelmente é um lead 'site_quebrado'.")
        sys.exit(1)

    html = bruto.decode("utf-8", errors="replace")
    with open(os.path.join(destino, "pagina.html"), "w", encoding="utf-8") as arquivo:
        arquivo.write(html)

    coletor = Coletor()
    coletor.feed(html)

    texto_corrido = " ".join(coletor.texto)
    texto_corrido = re.sub(r"\s+", " ", texto_corrido).strip()

    telefones = sorted(set(re.findall(r"\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}", texto_corrido)))[:8]
    emails = sorted(set(re.findall(r"[\w.+-]+@[\w-]+\.[\w.]{2,}", html)))[:8]

    sociais = {}
    for href in coletor.links:
        alvo = absolutizar(url_final, href) or ""
        for rede in ("instagram.com", "facebook.com", "linkedin.com", "youtube.com", "tiktok.com", "wa.me"):
            if rede in alvo and rede not in sociais:
                sociais[rede] = alvo

    # ── imagens ──────────────────────────────────────────────────────────
    vistas = set()
    salvas = []
    for item in coletor.imagens:
        alvo = absolutizar(url_final, item["src"])
        if not alvo or alvo in vistas:
            continue
        vistas.add(alvo)
        if len(salvas) >= 14:
            break
        try:
            dados, _, cabecalhos = buscar(alvo, MAX_IMAGE_BYTES)
        except Exception:
            continue

        tipo_http = (cabecalhos.get("Content-Type") or "").lower()
        nome_base = re.sub(r"[^a-z0-9]+", "-", os.path.basename(urllib.parse.urlparse(alvo).path).lower())[:40] or f"img{len(salvas)}"

        # SVG já é leve e escala sem perda — vai inteiro, sem passar pelo PIL.
        if "svg" in tipo_http or alvo.lower().endswith(".svg"):
            if len(dados) > 120_000:
                continue
            caminho = os.path.join(destino, "imagens", f"{nome_base}.svg")
            with open(caminho, "wb") as arquivo:
                arquivo.write(dados)
            uri = "data:image/svg+xml;base64," + base64.b64encode(dados).decode()
            with open(os.path.join(destino, "datauris", f"{nome_base}.txt"), "w") as arquivo:
                arquivo.write(uri)
            salvas.append({
                "arquivo": os.path.basename(caminho), "origem": alvo,
                "alt": item["alt"], "secao": item["secao"],
                "formato": "vetor", "razao": None, "tipo": "grafico",
                "transparente": True, "dominantes": [],
                "papel": "logo / marca" if item["contexto"] in ("logo", "favicon") else "elemento gráfico",
                "bytes_datauri": len(uri),
            })
            continue

        try:
            analise = processar_imagem(dados, item["contexto"])
        except Exception:
            continue
        if not analise:
            continue

        caminho = os.path.join(destino, "imagens", f"{nome_base}.webp")
        with open(caminho, "wb") as arquivo:
            arquivo.write(analise["bytes"])
        uri = "data:image/webp;base64," + base64.b64encode(analise["bytes"]).decode()
        with open(os.path.join(destino, "datauris", f"{nome_base}.txt"), "w") as arquivo:
            arquivo.write(uri)

        salvas.append({
            "arquivo": os.path.basename(caminho), "origem": alvo,
            "alt": item["alt"], "secao": item["secao"],
            "formato": analise["formato"], "razao": analise["razao"],
            "tipo": analise["tipo"], "transparente": analise["transparente"],
            "dominantes": analise["dominantes"], "papel": analise["papel"],
            "largura": analise["largura"], "altura": analise["altura"],
            "bytes_datauri": len(uri),
        })

    # ── relatório ────────────────────────────────────────────────────────
    linhas = [f"# Material extraído de {url_final}", ""]
    if url_final != url_inicial:
        linhas.append(f"> Redirecionou de {url_inicial}")
        linhas.append("")

    linhas += ["## Identidade", "",
               f"- **Título:** {(coletor.titulo or '').strip() or '(vazio)'}",
               f"- **Descrição:** {coletor.meta.get('description', '(vazia)')}",
               f"- **og:title:** {coletor.meta.get('og:title', '—')}",
               f"- **Gerador:** {coletor.meta.get('generator', '—')}", ""]

    cores = cores_do_css(html)
    if cores:
        linhas += ["## Cores mais usadas no CSS", "",
                   "Ponto de partida da paleta — a identidade do negócio, não a sua.", ""]
        linhas += [f"- `{cor}` ({n}x)" for cor, n in cores]
        linhas.append("")

    if coletor.titulos:
        linhas += ["## Estrutura de títulos", "",
                   "É o que o negócio diz que faz. Use como base dos serviços.", ""]
        linhas += [f"{'  ' * (n - 1)}- (h{n}) {t}" for n, t in coletor.titulos[:40]]
        linhas.append("")

    if telefones or emails or sociais:
        linhas += ["## Contatos publicados", ""]
        linhas += [f"- Telefone: `{t}`" for t in telefones]
        linhas += [f"- E-mail: `{e}`" for e in emails]
        linhas += [f"- {rede}: {alvo}" for rede, alvo in sociais.items()]
        linhas.append("")

    if salvas:
        total = sum(i["bytes_datauri"] for i in salvas)
        linhas += ["## Elenco de imagens", "",
                   f"Somando todas: **{total // 1024} KB** em data: URI. O arquivo final fica "
                   f"abaixo de 400 KB, então escolha — não use todas.", "",
                   "**Abra os arquivos em `fonte/imagens/` e olhe cada um antes de decidir onde "
                   "vai.** A coluna *papel sugerido* vem da proporção e do tipo de conteúdo; "
                   "ela evita erro grosseiro (foto de faixa virando ícone), mas não sabe o que "
                   "está retratado.", "",
                   "| arquivo | formato | proporção | tipo | cores | papel sugerido | alt / seção | KB |",
                   "|---|---|---|---|---|---|---|---|"]
        # Marca primeiro, depois da mais leve para a mais pesada.
        for item in sorted(salvas, key=lambda i: ("logo" not in i["papel"], i["bytes_datauri"])):
            razao = f'{item["razao"]}:1' if item.get("razao") else "vetor"
            cores = " ".join(item["dominantes"]) or "—"
            contexto = " / ".join(filter(None, [item["alt"], item["secao"]])) or "—"
            transp = " (fundo transparente)" if item["transparente"] else ""
            linhas.append(
                f'| `{item["arquivo"]}` | {item["formato"]} | {razao} | {item["tipo"]}{transp} | '
                f'{cores} | {item["papel"]} | {contexto} | {item["bytes_datauri"] // 1024} |'
            )
        linhas += ["",
                   "Como ler: **faixa** (≥2.5:1) só funciona em largura total ou fundo de herói. "
                   "**quadrada** é a única que entra em grade sem cortar. **retrato** pede coluna. "
                   "**gráfico** não aguenta ampliação — não use em tela cheia. "
                   "**fundo transparente** pode ir sobre faixa de cor.", ""]
    else:
        linhas += ["## Imagens", "", "Nenhuma imagem aproveitável encontrada.", ""]

    linhas += ["## Texto da página", "",
               "Fonte da verdade sobre o que o negócio oferece. O que está publicado aqui "
               "é afirmação do próprio negócio — pode ser reaproveitado com fidelidade. "
               "O que **não** estiver aqui continua proibido de inventar.", "",
               "```", texto_corrido[:6000], "```", ""]

    caminho_relatorio = os.path.join(destino, "relatorio.md")
    with open(caminho_relatorio, "w", encoding="utf-8") as arquivo:
        arquivo.write("\n".join(linhas))

    print(json.dumps({
        "url_final": url_final,
        "relatorio": caminho_relatorio,
        "imagens": len(salvas),
        "kb_datauri_total": sum(i["bytes_datauri"] for i in salvas) // 1024,
        "titulos": len(coletor.titulos),
        "caracteres_texto": len(texto_corrido),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
