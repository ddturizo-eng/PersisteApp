-- PersisteApp · salas, respuestas del quiz y ranking (REQ-28, REQ-29, REQ-30).
-- Diseño: specs/02-design.md §11.2. Ejecutar una vez en el SQL editor de Supabase.
-- Es idempotente: se puede volver a ejecutar sin perder datos.
--
-- Seguridad (P3, P10): solo el servidor de Next.js lee y escribe, con la secret key
-- (SUPABASE_SERVICE_ROLE_KEY). RLS queda activado y SIN políticas, y se revocan los
-- permisos de anon y authenticated, así la clave pública no puede leer ni escribir nada.

create table if not exists rooms (
  id          uuid primary key default gen_random_uuid(),
  code        char(6) not null unique
              check (code ~ '^[A-HJ-NP-Z2-9]{6}$'),     -- sin I, O, 0 ni 1 para no confundirlos
  label       text not null check (length(label) between 1 and 60),  -- "Grupo 8:00"
  session     smallint not null default 1 check (session in (1, 2)),
  created_at  timestamptz not null default now(),
  closed_at   timestamptz                                 -- null = abierta
);

create table if not exists participants (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references rooms(id) on delete cascade,
  name          text not null check (length(name) between 2 and 60),
  student_code  text not null check (length(student_code) between 3 and 20),
  token         uuid not null unique default gen_random_uuid(),  -- va en la cookie httpOnly pa_participant
  created_at    timestamptz not null default now(),
  unique (room_id, student_code)                                   -- volver a entrar reutiliza el participante
);

create table if not exists quiz_answers (
  participant_id uuid not null references participants(id) on delete cascade,
  lesson_id      text not null,
  question_id    text not null,
  shown_at       timestamptz not null default now(),  -- lo fija el servidor al mostrar la pregunta
  option_index   smallint check (option_index >= 0),  -- índice en el JSON original, no en el orden barajado; null hasta responder
  correct        boolean,
  answered_at    timestamptz,
  primary key (participant_id, lesson_id, question_id),  -- el primer intento gana (REQ-29 CA3)
  check ((answered_at is null) = (option_index is null) and (answered_at is null) = (correct is null))
);

create index if not exists participants_room_idx on participants (room_id);
create index if not exists quiz_answers_lesson_idx on quiz_answers (lesson_id, question_id);

-- Tiempo por pregunta con tope de 60 s (REQ-30 CA1b).
-- security_invoker: la vista respeta el RLS de la tabla en vez de saltárselo.
create or replace view answer_times with (security_invoker = true) as
  select qa.*,
         least(extract(epoch from qa.answered_at - qa.shown_at), 60)::numeric(6, 2) as seconds
  from quiz_answers qa
  where qa.answered_at is not null;

-- Aciertos y desempate por tiempo en las correctas (REQ-30 CA1).
-- Orden esperado: score desc, correct_seconds asc.
create or replace view room_ranking with (security_invoker = true) as
  select p.room_id,
         p.id                                                   as participant_id,
         p.name,
         p.student_code,
         count(t.question_id) filter (where t.correct)          as score,
         coalesce(sum(t.seconds) filter (where t.correct), 0)   as correct_seconds,
         count(t.question_id)                                   as answered
  from participants p
  left join answer_times t on t.participant_id = p.id
  group by p.id;

-- RLS activado y sin políticas: anon y authenticated no ven ninguna fila.
alter table rooms        enable row level security;
alter table participants enable row level security;
alter table quiz_answers enable row level security;

-- Además, sin permisos para las claves públicas (también sobre las vistas).
revoke all on rooms, participants, quiz_answers, answer_times, room_ranking from anon, authenticated;

-- service_role salta RLS; se le dan permisos por si el proyecto no expone tablas nuevas automáticamente.
grant select, insert, update, delete on rooms, participants, quiz_answers to service_role;
grant select on answer_times, room_ranking to service_role;
