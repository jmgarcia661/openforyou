-- Dados de demonstração (apenas desenvolvimento/staging).
-- Os ficheiros de áudio/vídeo têm de ser carregados no bucket "media"
-- e o campo media_path atualizado com o caminho real.

with items as (
  insert into public.content_items
    (kind, title, description, duration_min, teacher, level, goal, access, status)
  values
    ('yoga', 'Yoga para libertar costas e ombros',
     'Uma prática suave para soltar a tensão acumulada ao longo do dia.',
     25, 'José Maria Garcia', 'Todos os níveis', 'Costas e ombros', 'premium', 'published'),
    ('meditation', 'Criar espaço',
     'Uma meditação curta para fazer uma pausa e voltar à respiração.',
     8, 'José Maria Garcia', null, 'Clareza', 'premium', 'published'),
    ('sound', 'Floresta depois da chuva',
     'Um ambiente sonoro para relaxar, meditar ou acompanhar o trabalho.',
     15, null, null, 'Relaxar', 'premium', 'published')
  returning id, kind
)
insert into public.weekly_free (starts_on, ends_on, theme, reflection, yoga_id, meditation_id, sound_id)
select
  date_trunc('week', current_date)::date,
  (date_trunc('week', current_date) + interval '6 days')::date,
  'Criar espaço',
  'Esta semana, experimenta parar três vezes por dia durante um minuto. Sem fazer nada de especial.',
  (select id from items where kind = 'yoga'),
  (select id from items where kind = 'meditation'),
  (select id from items where kind = 'sound');
