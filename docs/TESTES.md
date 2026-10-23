# Open For You: testes de uma ponta a outra

Faz os testes por ordem. Em cada passo, o que deves ver está entre parênteses. Se algo falhar, anota o número do teste e envia uma captura de ecrã.

## Antes de começar

- **Cartão de teste Stripe:** `4242 4242 4242 4242`, validade `12/30`, CVC `123`. Para testar uma recusa: `4000 0000 0000 0002`.
- **Duas contas:** a tua (administradora) e uma de teste, por exemplo `jose.maria.garcia.661991+teste@gmail.com` (as mensagens chegam à tua caixa de entrada).
- **Duas janelas do navegador:** a normal e uma **janela anónima** (para ver o site como visitante).
- **Ficheiros de teste:** um áudio curto (MP3 ou M4A, menos de 50 MB), um vídeo curto (menos de 50 MB), duas imagens JPG, um PDF pequeno (serve para o excerto e para o eBook).
- **Zoom:** a tua conta gratuita, com a reunião de teste.
- **Dados antigos:** apaga em `/admin` a aula de teste antiga se quiseres começar limpa.

## A. Site público (janela anónima)

1. Abre a homepage. (O título, a fotografia, os três cartões "Esta semana" e o menu: Esta semana, Acesso completo, Livro, Quem sou, Entrar.)
2. Abre `/acesso-completo`. (39 € no primeiro mês, 59 €/mês depois, renovação automática à vista.)
3. Inscreve-te na newsletter com o email de teste. (Mensagem de agradecimento.) Repete com o mesmo email. (A mesma mensagem, sem erro.) No Supabase, tabela `newsletter_subscribers`, aparece uma linha "pending".
4. Abre os links do rodapé (Privacidade, Termos, Cancelamento). (Mostram "em preparação". As regras da comunidade mostram o rascunho.)
5. Abre `/admin`, `/conta`, `/praticar`, `/calendario`, `/comunidade`. (Pedem para entrar.)

## B. Conta e perfil

6. Regista a conta de teste em `/registo` (nome, email, palavra-passe com 10 ou mais caracteres, aceitar os termos). (Mensagem verde. Chega o email de confirmação. O link leva a A minha conta.)
7. Termina a sessão e volta a entrar. Tenta uma palavra-passe errada. ("Email ou palavra-passe incorretos.")
8. Em `/recuperar-password`, pede um link e define uma palavra-passe nova. (Entras em A minha conta.)
9. Em A minha conta, muda o nome e o fuso horário e guarda. ("Perfil guardado." Fica guardado ao atualizar a página.)
10. Clica em "Descarregar os meus dados". (Um ficheiro JSON com o teu perfil.)
11. Muda a palavra-passe em A minha conta. ("Palavra-passe alterada.")

## C. Conteúdos, semana grátis e biblioteca (como administradora)

12. Abre `/admin`. (O painel. O botão verde "Administração" no menu.)
13. Em Conteúdos, adiciona uma **meditação** com áudio, uma **aula** com vídeo e um **som**, todos "Publicado" e "Só membros". (Aparecem na lista.)
14. Em Semana grátis, cria uma semana que inclua hoje, com os três conteúdos. (Fica marcada "Agora".)
15. Na janela anónima, abre a homepage e `/esta-semana`. (Os três conteúdos tocam, sem login nem formulário.)
16. Como administradora, abre `/praticar`. (Aparecem os três. Abre um, toca, usa "Guardar nos favoritos" e "Marcar como concluída". O separador Favoritos mostra-o.)
17. Cria um conteúdo "Publicado" com data futura em "Publicar a partir de". (Não aparece em `/praticar` até essa data.)

## D. Subscrição e acesso de membro (conta de teste)

18. Com a conta de teste, abre `/praticar`, `/calendario` e `/comunidade`. (Só vês o gratuito em `/praticar`. Calendário e comunidade dizem "é para membros". Um conteúdo só para membros dá "Este conteúdo é para membros".)
19. Abre `/subscrever`. (Hoje 39 €. Próxima renovação 59 € com a data.) Marca as duas caixas e continua. Paga com o cartão `4242`. (Voltas a "Bem-vindo ao Open For You".)
20. Em A minha conta. ("Acesso completo ativo", com a próxima renovação.) Abre `/praticar`. (Vês tudo.) O menu já não mostra "Acesso completo".
21. No Stripe, Desenvolvedores > Webhooks. (As entregas aparecem com sucesso, sem falhas.)
22. Em A minha conta, "Gerir subscrição e faturas". (Abre o portal do Stripe. Cancela a subscrição.) De volta ao site. ("Termina a ... Manténs o acesso até lá.")
23. Tenta pagar com o cartão `4000 0000 0000 0002`. (O Stripe recusa e não é ativado acesso.)

## E. Aulas em direto

24. Em `/admin/aulas`, cria uma aula para daqui a 10 minutos (hora de Lisboa), com "Repetir mais" `1`. (Aparecem duas aulas.)
25. Em Gerir, cola o link do Zoom e clica em Guardar ligações. ("Ligações guardadas.")
26. Com a conta de teste (membro), abre `/calendario`. (Vês as aulas, na hora do teu fuso.) Abre a aula. (Contagem decrescente. "Confirmar presença" funciona. Os botões Google Calendar e .ics funcionam.)
27. Quando a sala abrir (15 minutos antes), entra na sala de espera com o membro. (Contagem e mensagem de boas-vindas.) No painel, "Na sala de espera agora: 1".
28. No painel, escreve um aviso de atraso e clica em Avisar. (Aparece na sala do membro **sem recarregar**.) Retira-o.
29. Clica em "Abrir aula no Zoom". (A sala muda sozinha para "A aula está em direto". "Entrar agora na aula" abre o Zoom.)
30. Clica em "Pausar novas entradas", e com o membro tenta entrar. (Aparece a mensagem de entradas fechadas.) Reabre.
31. Clica em "Terminar aula". (A sala diz que terminou.) Cancela a segunda aula. (Mostra "Cancelada".)
32. Adiciona uma gravação em Conteúdos (aula de Yoga publicada) e associa-a à aula em Gerir. (O membro vê "Ver a gravação".)
33. Com uma conta **sem subscrição**, abre a página da aula. (Dizem que é para membros e nunca aparece o link do Zoom.)

## F. Comunidade

34. Com o membro, abre `/comunidade` e publica (aceitando as regras). (Aparece logo.) Publica com o tema da semana marcado. (Mostra "Tema: ...".)
35. Anexa uma fotografia sem marcar a caixa de autorização. (Pede a confirmação.) Marca-a. (A publicação aparece com a fotografia.)
36. Comenta, dá um coração, edita o texto e elimina uma publicação. (Tudo funciona.)
37. Entra como administradora em `/comunidade`. (Vês a publicação com o nome do membro como "Nome A.".) Comenta e denuncia uma publicação do membro.
38. Em `/admin/comunidade`, trata a denúncia: retira o conteúdo. (Desaparece do feed.)
39. Fixa uma publicação no topo e fecha-lhe os comentários. (O membro vê "Fixada" e "Os comentários desta publicação estão fechados.")
40. Suspende o membro 7 dias. (O membro vê "O teu acesso à comunidade está suspenso".) Levanta a suspensão. (Volta a entrar.)
41. Passa o modo de moderação para "Aprovar cada publicação antes de aparecer". O membro publica. ("Ficou a aguardar aprovação" e só ele a vê.) Aprova. (Aparece a todos.) Publica outra e recusa com uma nota. (O membro vê a nota.) O membro edita. (Volta à fila.) Volta ao modo "Publicar logo".
42. Com uma conta sem subscrição, abre `/comunidade`. (É para membros.)

## G. eBook

43. Em `/admin/livro`, carrega o PDF do eBook, o excerto (PDF) e a capa. Escolhe a meditação exclusiva e põe um link do Kindle. Confirma o preço 14. Guarda. ("Guardado.")
44. Na janela anónima, abre `/livro`. (A capa, 14 €, "Ler o excerto" abre o PDF, "Ver no Kindle" abre o link.)
45. Tenta comprar sem marcar as caixas. ("Aceita as duas condições.") Marca-as e compra com o cartão `4242`, sem conta. (O Stripe pede o email. Depois chegas a "A tua compra".)
46. Na página da compra, clica em "Descarregar o eBook". (O ficheiro descarrega. O contador desce de 5 para 4.) A meditação exclusiva toca. Os botões "Criar conta gratuita" e "Conhecer o acesso completo" funcionam.
47. Descarrega o eBook até acabarem. (O botão desaparece. Se forçares o link de download, volta com a mensagem de limite.)
48. Em `/admin/livro`, vê a compra na lista, com o email, 14 € e os downloads.
49. Muda o preço para 12 no painel. (Em `/livro` aparece 12 € passados até 5 minutos.) Compra de novo. (O Stripe cobra 12 €.) Repõe 14.
50. No Stripe, reembolsa o pagamento. (Passado um momento, a página da compra diz "reembolsada" e o download deixa de funcionar.)
51. Abre `/livro/acesso/abc`. (Página não encontrada.)

## H. Conta, privacidade e segurança

52. Com a conta de teste (com subscrição, publicação e fotografia), elimina a conta em A minha conta. (Volta à homepage.) No Stripe, a subscrição fica cancelada. No Supabase, o utilizador, as publicações e as fotografias desaparecem. Os registos de compra do eBook ficam (são registos de venda).
53. Com a conta de teste (sem ser admin), abre `/admin`. (Página não encontrada.)
54. Sem sessão, abre `/api/conta/exportar`. (Erro de sessão necessária, não dados.)
55. Copia o link de download do eBook (o endereço do Supabase para onde és redirecionada) e abre-o passados 2 minutos. (Já não funciona.)

## I. Telemóvel

56. Abre o site no telemóvel e percorre: homepage, menu, `/esta-semana`, `/praticar`, `/comunidade`, uma aula e a sala de espera. (Tudo legível, botões fáceis de tocar, sem texto cortado.)

## Problemas conhecidos (aceites por agora)

- As datas das aulas aparecem com maiúsculas a mais ("Sexta-Feira, 23 De Outubro"). É só estético.
- Os emails (confirmação de newsletter, lembretes de aulas, entrega do eBook, recibos) ainda não existem: dependem do Resend.
- O link do Zoom que estás a usar é o teu ID pessoal: serve para testar, mas numa aula real cria uma reunião nova por aula, com código de acesso.
- Os textos legais são marcadores ou rascunhos e têm de ser revistos por um jurista.
- O IVA do preço (59 € e 14 €) está por decidir com o contabilista.
