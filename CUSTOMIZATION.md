# Guia de personalização

Este arquivo é para quem vai **operar o site no dia a dia** (o cliente/dono do negócio) — o `README.md` é focado em portfólio/documentação técnica; este aqui é o "como eu mudo as coisas".

## Serviços e cupons de promoção
Não são editados por arquivo — use o painel administrativo (`admin.html`). Veja `SETUP.md` para criar seu acesso.

## Trocar textos do site (fora serviços/cupons)
Abra `index.html` num editor de texto (recomendo o [VS Code](https://code.visualstudio.com/), gratuito). O conteúdo está organizado em blocos comentados:

```html
<!-- ============ HERO ============ -->
<!-- ============ SOBRE ============ -->
<!-- ============ SERVIÇOS ============ -->
<!-- ============ PROMOÇÕES / CUPONS ============ -->
<!-- ============ POMBOS ============ -->
<!-- ============ EXPERIÊNCIA ============ -->
<!-- ============ DEPOIMENTOS ============ -->
<!-- ============ CLIENTES ============ -->
<!-- ============ CONTATO ============ -->
```

## Trocar o número de WhatsApp
Aparece no formato `https://wa.me/5551996597444?text=...` em `index.html` e `js/script.js`. Procure por `5551996597444` (Ctrl+F ou Cmd+F) em cada arquivo e substitua pelo novo número (formato `55` + DDD + número, sem espaços/traços).

## Trocar cores
Centralizadas no topo de `css/style.css` (e `css/admin.css` para o painel), dentro de `:root`:

```css
:root{
  --navy-950:#060f1f;   /* fundo escuro principal */
  --teal-500:#007f9a;   /* teal/verde-azulado da marca */
  --blue-500:#1a8ad9;   /* azul da marca */
}
```

## Trocar o logo
Substitua `images/logo.png` por outro PNG com o mesmo nome.

## Trocar o selo "Empresa Gaúcha"
Substitua `images/selo-gaucha.png`. Ele é usado em dois tamanhos (hero e rodapé) controlados por CSS — não precisa duplicar o arquivo.

## Trocar as fotos da equipe/carro
- `images/equipe-escritorio.jpg` e `images/carro-megaport.jpg` — aparecem na seção "Sobre" como `<img>` normal no `index.html`. Substitua o arquivo mantendo o nome, ou troque o `src` se usar outro nome.
- `images/equipe-pombos-instalacao.jpg` — é diferente: aparece como **fundo** do card na seção "Controle de Pombos" (não é uma tag `<img>`, é definida em `css/style.css`, na regra `.pombos-visual`). Para trocar, substitua o arquivo mantendo o nome, ou edite o caminho dentro de `background-image` nesse arquivo CSS. Se a foto nova tiver um enquadramento muito diferente (pessoa mais para a esquerda/direita, por exemplo), ajuste também `background-position` logo abaixo — o segundo valor (ex: `52%`) controla a altura vertical mostrada.

## Trocar os depoimentos
Procure por `DEPOIMENTOS` no `index.html` — cada depoimento é um bloco `.testimonial-card` com o texto e um nome de autor.

## Adicionar um novo ícone de serviço
Abra `js/icons.js` e siga as instruções no topo do arquivo. O ícone novo aparece automaticamente no seletor visual do painel admin.

## Como testar mudanças localmente
Abra `index.html` (ou `admin.html`) direto no navegador (duplo clique) depois de editar. Como os dados vêm do Supabase pela internet, funciona normalmente mesmo sem servidor local.

## Como publicar mudanças de código
Se você editar `index.html`, algum CSS ou JS, suba a alteração para o GitHub (upload pelo site ou `git push`). A Vercel publica automaticamente em menos de um minuto. Serviços e cupons **não** passam por esse fluxo — são instantâneos direto pelo painel admin.
