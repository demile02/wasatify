-- One catalog request replaces profile/class lookup plus module, lesson, progress and quiz requests.
create or replace function public.get_student_module_catalog(include_quizzes boolean default false)
returns jsonb language sql stable security invoker set search_path = '' as $$
  with visible_modules as materialized (
    select m.id,m.slug,m.title,m.description,m.cover_image_path,m.hero_image_path,m.image_crop_config,
      m.estimated_minutes,m.order_index,
      (select count(*) from public.lessons l where l.module_id=m.id) as lesson_count,
      (select count(*) from public.lesson_progress lp join public.lessons l on l.id=lp.lesson_id and l.module_id=m.id
        where lp.student_id=auth.uid() and lp.completed_at is not null) as completed_lesson_count,
      p.status as progress_status,p.progress_percent,p.completed_at,p.last_accessed_at
    from public.modules m
    join public.profiles s on s.id=auth.uid() and s.role='student'
    join public.classes c on c.id=s.class_id and c.teacher_id=coalesce(m.created_by,m.teacher_id)
    left join public.module_progress p on p.module_id=m.id and p.student_id=auth.uid()
    where m.status='published'
  ) select jsonb_build_object(
    'modules',coalesce((select jsonb_agg(to_jsonb(m) order by m.order_index,m.title,m.id) from visible_modules m),'[]'::jsonb),
    'quizzes',case when include_quizzes then coalesce((select jsonb_agg(jsonb_build_object('id',q.id,'title',q.title,'module_id',q.module_id))
      from public.quizzes q join visible_modules m on m.id=q.module_id where q.is_published),'[]'::jsonb) else '[]'::jsonb end
  );
$$;
revoke all on function public.get_student_module_catalog(boolean) from public,anon;
grant execute on function public.get_student_module_catalog(boolean) to authenticated;
