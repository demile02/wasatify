create or replace function public.get_teacher_notification_feed()
returns jsonb language sql stable security invoker set search_path = '' as $$
  with feed as (
    (select a.id,'announcement:'||a.id as key,a.title,a.content as body,
      coalesce(a.published_at,a.created_at) as event_at,'/teacher/announcements' as href,'announcement' as kind
      from public.announcements a
      where (select app_private.is_admin()) or ((select app_private.is_teacher()) and a.teacher_id=(select auth.uid()))
      order by a.created_at desc limit 8)
    union all
    (select r.id,'reflection:'||r.id,s.full_name||' mengumpulkan refleksi','Refleksi untuk modul '||m.title||' sudah dikirim.',
      r.created_at,'/teacher/reflections','reflection'
      from public.reflections r join public.profiles s on s.id=r.student_id
      join public.classes c on c.id=s.class_id join public.modules m on m.id=r.module_id
      where (select app_private.is_teacher()) and c.teacher_id=(select auth.uid()) and coalesce(m.created_by,m.teacher_id)=(select auth.uid())
      order by r.created_at desc limit 8)
    union all
    (select a.id,'quiz_attempt:'||a.id,s.full_name||' mengerjakan kuis',q.title||coalesce(' - skor '||a.score::text,''),
      coalesce(a.submitted_at,a.created_at),'/teacher/reports','quiz_attempt'
      from public.quiz_attempts a join public.profiles s on s.id=a.student_id join public.classes c on c.id=s.class_id
      join public.quizzes q on q.id=a.quiz_id join public.modules m on m.id=q.module_id
      where (select app_private.is_teacher()) and c.teacher_id=(select auth.uid()) and coalesce(m.created_by,m.teacher_id)=(select auth.uid())
      order by a.submitted_at desc nulls last,a.created_at desc limit 8)
    union all
    (select p.id,'module_progress:'||p.id,s.full_name||' menyelesaikan modul','Modul '||m.title||' sudah selesai.',
      coalesce(p.completed_at,p.updated_at,p.created_at),'/teacher/classes','module_progress'
      from public.module_progress p join public.profiles s on s.id=p.student_id
      join public.classes c on c.id=s.class_id join public.modules m on m.id=p.module_id
      where (select app_private.is_teacher()) and c.teacher_id=(select auth.uid()) and coalesce(m.created_by,m.teacher_id)=(select auth.uid())
        and (p.status='completed' or p.completed_at is not null)
      order by p.completed_at desc nulls last,p.updated_at desc limit 8)
  ), recent as (select * from feed order by event_at desc,id limit 16)
  select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'notificationKey',f.key,'title',f.title,'body',f.body,
    'createdAt',f.event_at,'href',f.href,'kind',f.kind,'readAt',r.read_at) order by f.event_at desc,f.id),'[]'::jsonb)
    from recent f left join public.notification_reads r on r.notification_key=f.key and r.user_id=(select auth.uid());
$$;
revoke all on function public.get_teacher_notification_feed() from public,anon;
grant execute on function public.get_teacher_notification_feed() to authenticated;
