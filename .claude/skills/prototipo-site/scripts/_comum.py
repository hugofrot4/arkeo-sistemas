#!/usr/bin/env python3
"""
Funções compartilhadas por `extrair.py` (site atual do lead) e
`instagram.py` (perfil público).

As duas fontes entregam a mesma coisa — logo, fotos e identidade visual — e o
tratamento é idêntico: classificar a proporção, separar foto de gráfico,
redimensionar, converter para WebP e tirar a paleta da marca. O que muda é só
de onde os bytes vêm.
"""

import io
import urllib.request

TIMEOUT = 15
MAX_IMAGE_BYTES = 12_000_000
UA = "Mozilla/5.0 (compatible; ArkeoSitesBot/1.0; +https://www.arkeosistemas.com.br)"

# Larguras de destino. Foto grande vira data: URI enorme e estoura o limite do
# arquivo, então tudo passa por redimensionamento antes de virar base64.
LARGURA_FOTO = 1100
LARGURA_LOGO = 420
QUALIDADE_WEBP = 78

# Abaixo disto é ícone, pixel de rastreamento ou espaçador — não serve de foto.
MIN_LADO_FOTO = 240


def buscar(url, limite=3_000_000, cabecalhos=None):
    headers = {"User-Agent": UA, "Accept-Language": "pt-BR,pt;q=0.9"}
    if cabecalhos:
        headers.update(cabecalhos)
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as resposta:
        return resposta.read(limite), resposta.geturl(), resposta.headers


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


def _hsl(r, g, b):
    r, g, b = r / 255, g / 255, b / 255
    alto, baixo = max(r, g, b), min(r, g, b)
    luz = (alto + baixo) / 2
    if alto == baixo:
        return 0.0, 0.0, luz
    d = alto - baixo
    sat = d / (2 - alto - baixo) if luz > 0.5 else d / (alto + baixo)
    if alto == r:
        matiz = ((g - b) / d + (6 if g < b else 0)) / 6
    elif alto == g:
        matiz = ((b - r) / d + 2) / 6
    else:
        matiz = ((r - g) / d + 4) / 6
    return matiz, sat, luz


def _hex(r, g, b):
    return f"#{int(r):02x}{int(g):02x}{int(b):02x}"


def _misturar(cor, alvo, fator):
    """Interpola entre duas cores. Usado para derivar surface e ink da marca."""
    return tuple(round(c + (a - c) * fator) for c, a in zip(cor, alvo))


def _luminancia(cor):
    def canal(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (canal(c) for c in cor)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _contraste(a, b):
    la, lb = _luminancia(a), _luminancia(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def _escurecer_ate_contrastar(cor, fundo=(255, 255, 255), minimo=4.5):
    """
    Escurece a cor da marca até ela passar no contraste, preservando o matiz.

    Azul de logo costuma ficar em 3:1 sobre branco — bonito na marca, ilegível
    como cor de link. Escurecer mantém a identidade; trocar a cor, não.
    """
    atual = list(cor)
    for _ in range(24):
        if _contraste(tuple(atual), fundo) >= minimo:
            break
        atual = [max(0, round(c * 0.92)) for c in atual]
    return tuple(atual)


def _distancia_matiz(a, b):
    """Distância entre dois matizes em graus, no círculo (0..180)."""
    d = abs(a - b) % 360
    return min(d, 360 - d)


def _representante(cores, criterio):
    """
    Escolhe a cor que representa um grupo de matiz.

    Prefere as vívidas: a antialiasing da logo produz muita variação pálida da
    mesma cor, e é a versão saturada que a marca de fato usa.
    """
    vividas = [c for c in cores if _hsl(*c)[1] >= 0.35]
    candidatas = vividas or list(cores)
    return criterio(candidatas)


def paleta_da_logo(imagem):
    """
    Cores da marca a partir da logo, e uma paleta de quatro papéis derivada
    delas.

    O protótipo precisa parecer do cliente, não da agência — e o único elemento
    de identidade que temos é a logo. Por isso ela manda na paleta mesmo quando
    há referência visual: a referência dá estrutura e clima, a logo dá a cor.

    Pixel transparente é descartado (logo costuma vir recortada), e cinza,
    branco e preto também: são o texto da logo, não a cor da marca.

    ## Por que agrupar por matiz, e não contar pixel

    Contar pixel elege a cor que ocupa mais área, que quase nunca é a cor de
    acento. Numa logo com monograma teal e uma letra laranja, o teal e as suas
    variações pálidas tomam as três primeiras posições e o laranja não aparece
    — o acento acaba saindo de um teal desbotado, que ao ser escurecido para
    passar no contraste vira cinza.

    Então os pixels são agrupados por **faixa de matiz**, e cada faixa pesa
    pela soma da saturação e não pela contagem. Uma área pequena e vívida
    ganha de uma área grande e lavada, que é exatamente o critério de quem
    olha a logo.

    O acento é obrigado a vir de um matiz **distante** do primary. Sem isso o
    acento vira um tom do primary, e a página perde a segunda cor da marca.
    """
    from PIL import Image

    if imagem.mode == "P":
        imagem = imagem.convert("RGBA")
    tem_alfa = imagem.mode in ("RGBA", "LA")
    amostra = imagem.convert("RGBA").resize((120, 120), Image.LANCZOS)

    # 24 faixas de 15° cada — fino o bastante para separar laranja de amarelo.
    FAIXAS = 24
    largura_faixa = 360 / FAIXAS
    faixas = {}

    for r, g, b, a in amostra.getdata():
        if tem_alfa and a < 200:
            continue
        matiz, sat, luz = _hsl(r, g, b)
        # Neutro e quase-neutro não são a cor da marca.
        if sat < 0.18 or luz < 0.08 or luz > 0.94:
            continue
        faixa = int(matiz * 360 // largura_faixa) % FAIXAS
        alvo = faixas.setdefault(faixa, {"peso": 0.0, "cores": {}})
        # Peso pela saturação: área grande e lavada não ganha de área
        # pequena e vívida.
        alvo["peso"] += sat * sat
        chave = (r // 24 * 24, g // 24 * 24, b // 24 * 24)
        alvo["cores"][chave] = alvo["cores"].get(chave, 0) + 1

    if not faixas:
        return None

    ordenadas = sorted(faixas.items(), key=lambda kv: -kv[1]["peso"])[:3]

    # De cada faixa saem dois representantes: o mais escuro, que serve de fundo
    # de faixa, e o mais vívido, que serve de botão.
    candidatas = []
    for _, dados in ordenadas:
        escura = _representante(dados["cores"], lambda cs: min(cs, key=lambda c: _hsl(*c)[2]))
        vivida = _representante(dados["cores"], lambda cs: max(cs, key=lambda c: _hsl(*c)[1]))
        candidatas.append({"escura": escura, "vivida": vivida})

    # Primary é a faixa que **consegue ficar escura** — vai levar texto branco
    # por cima. Laranja e amarelo nunca escurecem sem virar marrom, então
    # perdem esse papel para o azul ou o verde da mesma logo, mesmo quando
    # ocupam mais área.
    dono_primary = min(candidatas, key=lambda c: _hsl(*c["escura"])[2])
    primary = dono_primary["escura"]
    matiz_primary = _hsl(*primary)[0] * 360

    # Accent é a faixa mais vívida entre as de matiz distante. Perto demais
    # seria um tom do primary, não a segunda cor da marca.
    distantes = [
        c for c in candidatas
        if c is not dono_primary
        and _distancia_matiz(_hsl(*c["vivida"])[0] * 360, matiz_primary) >= 40
    ]
    if distantes:
        accent = max(distantes, key=lambda c: _hsl(*c["vivida"])[1])["vivida"]
    else:
        # Logo de uma cor só: o acento sai da própria faixa, na versão vívida.
        accent = dono_primary["vivida"]

    # As cores mostradas no relatório: uma por faixa, na versão vívida.
    marca = [c["vivida"] for c in candidatas]

    accent_legivel = _escurecer_ate_contrastar(accent)
    return {
        "marca": [_hex(*c) for c in marca],
        "accent_ajustado": accent_legivel != accent,
        "contraste_accent": round(_contraste(accent_legivel, (255, 255, 255)), 2),
        "sugestao": {
            # Escurecido só o quanto o texto branco por cima exigir. Faixa de
            # marca com contraste insuficiente é o erro mais visível no
            # celular, e escurecer além disso já trai a cor da logo.
            "primary": _hex(*_escurecer_ate_contrastar(primary, (255, 255, 255), 4.5)),
            "accent": _hex(*accent_legivel),
            # Tinta clara da própria marca: tira o branco puro sem trair a cor.
            "surface": _hex(*_misturar(primary, (255, 255, 255), 0.94)),
            "ink": _hex(*_misturar(primary, (0, 0, 0), 0.68)),
        },
    }


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
    paleta = paleta_da_logo(imagem) if contexto in ("logo", "favicon") else None

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
        "paleta": paleta,
    }
