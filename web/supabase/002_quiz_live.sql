-- PersisteApp · quiz final en vivo: apertura por el docente, límite por pregunta e integridad
-- (REQ-29, REQ-30 CA1b, REQ-35). Diseño: specs/02-design.md §12.2 y §12.5.
-- Ejecutar una vez en el SQL editor de Supabase, después de 001_quiz.sql.
-- Es idempotente: se puede volver a ejecutar sin perder datos.

-- 1. Estado del quiz por sala: sin abrir (opened null), abierto, cerrado (closed no null).
alter table rooms add column if not exists quiz_opened_at timestamptz;
alter table rooms add column if not exists quiz_closed_at timestamptz;

-- 2. Salidas de la pestaña y bloqueo (REQ-35 CA3, CA4).
alter table participants add column if not exists exits smallint not null default 0 check (exits >= 0);
alter table participants add column if not exists blocked_at timestamptz;

-- 3. Límite de cada pregunta, fijado por el servidor al mostrarla, y respuestas vencidas (REQ-35 CA1, CA2).
alter table quiz_answers add column if not exists limit_seconds smallint not null default 60
  check (limit_seconds between 10 and 120);
alter table quiz_answers add column if not exists timed_out boolean not null default false;

-- Estado de una respuesta: pendiente (todo null) o respondida; option_index es null solo si venció.
alter table quiz_answers drop constraint if exists quiz_answers_check;
alter table quiz_answers drop constraint if exists quiz_answers_state;
alter table quiz_answers add constraint quiz_answers_state check (
  (answered_at is null and option_index is null and correct is null and not timed_out)
  or (answered_at is not null and correct is not null and (option_index is null) = timed_out)
);

-- 4. Vistas con el límite de cada pregunta como tope (antes, 60 s fijos).
--    Se borran y se crean de nuevo porque cambian sus columnas.
drop view if exists room_ranking;
drop view if exists answer_times;

create view answer_times with (security_invoker = true) as
  select qa.participant_id,
         qa.lesson_id,
         qa.question_id,
         qa.option_index,
         qa.correct,
         qa.timed_out,
         qa.shown_at,
         qa.answered_at,
         qa.limit_seconds,
         least(extract(epoch from qa.answered_at - qa.shown_at), qa.limit_seconds)::numeric(6, 2) as seconds
  from quiz_answers qa
  where qa.answered_at is not null;

-- Aciertos y desempate por tiempo en las correctas (REQ-30 CA1). Orden: score desc, correct_seconds asc.
create view room_ranking with (security_invoker = true) as
  select p.room_id,
         p.id                                                   as participant_id,
         p.name,
         p.student_code,
         p.exits,
         p.blocked_at,
         count(t.question_id) filter (where t.correct)          as score,
         coalesce(sum(t.seconds) filter (where t.correct), 0)   as correct_seconds,
         count(t.question_id)                                   as answered
  from participants p
  left join answer_times t on t.participant_id = p.id
  group by p.id;

-- 5. Suma una salida de forma atómica y bloquea a la segunda (REQ-35 CA3).
create or replace function register_exit(p_participant uuid)
returns table (exits smallint, blocked boolean)
language sql
as $$
  update participants
     set exits = participants.exits + 1,
         blocked_at = case when participants.exits + 1 >= 2 then coalesce(participants.blocked_at, now())
                           else participants.blocked_at end
   where id = p_participant
  returning participants.exits, participants.blocked_at is not null;
$$;

-- Permisos: igual que 001 (solo el servidor, con la secret key).
revoke all on answer_times, room_ranking from anon, authenticated;
grant select on answer_times, room_ranking to service_role;
revoke all on function register_exit(uuid) from public, anon, authenticated;
grant execute on function register_exit(uuid) to service_role;
