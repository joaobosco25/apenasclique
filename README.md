# Convite Open House — v3.3

Mini-app romântico e interativo, preparado para GitHub Pages.

## Destaques desta versão
- Cena especial para os olhos com interação por arraste/toque.
- Transições contínuas com um coração-guia entre as cenas.
- Easter egg no coração da cena orbital.
- Galeria com interação, zoom lento e revelação extra.
- Áudio ambiente gerado no navegador: batimento, chimes, cristal, whoosh e acorde de cortina.
- Pré-final silencioso antes do convite.
- Nova cena antes do convite pedindo, de forma leve, uma foto da reação — sem bloquear a experiência se ela preferir não prometer.
- Convite final com cortinas, partículas, rota visual e resposta CONFIRMADO.
- Microtexto adaptativo conforme a pessoa explora a experiência.
- Ajustes específicos para 360x800, 390x844, 412x915 e telas baixas/landscape.

## Publicar no GitHub Pages
1. Envie todo o conteúdo desta pasta para a raiz do repositório.
2. Em Settings > Pages, selecione Deploy from a branch.
3. Escolha a branch principal e a pasta /root.
4. Abra o endereço gerado pelo Pages.

O projeto é 100% front-end e não coleta nem envia respostas para servidor. O botão final apenas abre o WhatsApp com uma mensagem pré-preenchida.


## Compatibilidade mobile v3.1
- iPhone/iOS e Android modernos: experiência completa quando animações do sistema estão ativas.
- Se o aparelho estiver com “reduzir/remover animações” habilitado, o app pergunta se a pessoa quer ativar a experiência completa para este convite.
- GSAP e confetti têm fallback de CDN para reduzir risco de bloqueio de carregamento.

## v3.3
A cena de reação aparece imediatamente antes do convite oficial. Os dois botões continuam para o convite; a opção de foto é apenas uma brincadeira, sem acesso à câmera e sem coleta de imagens.


## V3.3 — sem câmera/reação
A cena de pedido de foto foi removida. O botão “abrir o convite” agora segue diretamente para o convite oficial, com os índices e animações ajustados para não quebrar o fluxo.
