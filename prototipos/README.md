# Protótipos

Área de trabalho local dos protótipos de site da prospecção.

Um diretório por lead:

```
prototipos/
  clinica-sorriso-vivo/
    index.html      ← o site, arquivo único
    abordagem.txt   ← as 4 mensagens de WhatsApp, separadas por ---
```

## Como gerar

1. No admin, aba **Prospecção → Leads**, abra o lead e clique em **Gerar protótipo**.
2. Copie o **brief**.
3. Aqui no Claude Code: `/prototipo-site`, cole o brief e anexe as imagens de inspiração.
4. Abra `prototipos/<slug>/index.html` no navegador e peça os ajustes que quiser.
5. Quando estiver bom, volte ao modal do admin, suba o `index.html` e cole o `abordagem.txt`.

O sistema publica em `arkeosistemas.com.br/p/<slug>` e agenda a sequência de quatro toques.

## Sobre o versionamento

O conteúdo desta pasta é ignorado pelo git (ver `.gitignore` ao lado). São dezenas de arquivos por mês, específicos de cada lead, e a versão que importa fica publicada no banco depois do upload.

Se quiser guardar um caso como referência de design, mova para fora daqui ou remova a linha do `.gitignore`.
