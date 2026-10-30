create or replace function public.save_teacher_module(
  module_id_input uuid, module_input jsonb, lessons_input jsonb, quiz_input jsonb,
  questions_input jsonb, cover_input jsonb default null, notification_input jsonb default null
) returns uuid language plpgsql security invoker set search_path = '' as $$
declare
  saved_module uuid; saved_quiz uuid; module_row public.modules%rowtype; lesson_row public.lessons%rowtype;
  question_row public.quiz_questions%rowtype; quiz_row public.quizzes%rowtype; cover_row public.media_assets%rowtype;
  item jsonb; lesson_ids uuid[]:='{}'; question_ids uuid[]:='{}'; affected integer;
begin
  if not (app_private.is_teacher() or app_private.is_admin()) then raise exception 'Akses hanya untuk guru atau admin.'; end if;
  if jsonb_typeof(lessons_input) is distinct from 'array' or jsonb_array_length(lessons_input)>100
    or jsonb_typeof(questions_input) is distinct from 'array' or jsonb_array_length(questions_input)>100 then
    raise exception 'Daftar materi atau pertanyaan tidak valid.';
  end if;
  module_row:=jsonb_populate_record(null::public.modules,module_input);
  if module_id_input is null then
    insert into public.modules(teacher_id,created_by,class_id,title,slug,description,cover_image_path,hero_image_path,image_crop_config,
      difficulty,tags,status,is_public,estimated_minutes,order_index,published_at)
    values(auth.uid(),auth.uid(),module_row.class_id,module_row.title,module_row.slug,module_row.description,
      module_row.cover_image_path,module_row.hero_image_path,module_row.image_crop_config,module_row.difficulty,module_row.tags,
      module_row.status,module_row.is_public,module_row.estimated_minutes,module_row.order_index,module_row.published_at)
    returning id into saved_module;
  else
    perform 1 from public.modules where id=module_id_input for update;
    update public.modules set class_id=module_row.class_id,title=module_row.title,slug=module_row.slug,description=module_row.description,
      cover_image_path=module_row.cover_image_path,hero_image_path=module_row.hero_image_path,image_crop_config=module_row.image_crop_config,
      difficulty=module_row.difficulty,tags=module_row.tags,status=module_row.status,is_public=module_row.is_public,
      estimated_minutes=module_row.estimated_minutes,order_index=module_row.order_index,published_at=module_row.published_at
      where id=module_id_input returning id into saved_module;
    if saved_module is null then raise exception 'Modul tidak ditemukan atau tidak dapat diedit.'; end if;
  end if;
  for item in select value from jsonb_array_elements(lessons_input) loop
    lesson_row:=jsonb_populate_record(null::public.lessons,item);
    lesson_row.id:=coalesce(lesson_row.id,gen_random_uuid());
    if lesson_row.id=any(lesson_ids) then raise exception 'ID pelajaran duplikat.'; end if;
    insert into public.lessons(id,module_id,title,slug,type,content,key_points,video_url,infographic_url,infographic_asset_id,
      reflection_prompt,order_index,estimated_minutes)
    values(lesson_row.id,saved_module,lesson_row.title,lesson_row.slug,'article',lesson_row.content,lesson_row.key_points,
      lesson_row.video_url,lesson_row.infographic_url,lesson_row.infographic_asset_id,lesson_row.reflection_prompt,lesson_row.order_index,5)
    on conflict(id) do update set title=excluded.title,content=excluded.content,key_points=excluded.key_points,
      video_url=excluded.video_url,infographic_url=excluded.infographic_url,infographic_asset_id=excluded.infographic_asset_id,
      reflection_prompt=excluded.reflection_prompt,order_index=excluded.order_index
      where public.lessons.module_id=saved_module;
    get diagnostics affected=row_count;
    if affected<>1 then raise exception 'Pelajaran tidak termasuk modul ini.'; end if;
    lesson_ids:=array_append(lesson_ids,lesson_row.id);
    if lesson_row.infographic_asset_id is not null then
      update public.infographic_assets set module_id=saved_module,lesson_id=lesson_row.id where id=lesson_row.infographic_asset_id;
      if not found then raise exception 'Infografik tidak ditemukan atau tidak dapat diakses.'; end if;
    end if;
  end loop;
  delete from public.lessons where module_id=saved_module and not(id=any(lesson_ids));
  if quiz_input is not null and quiz_input<>'null'::jsonb then
    quiz_row:=jsonb_populate_record(null::public.quizzes,quiz_input);
    if quiz_row.id is null then
      select id into saved_quiz from public.quizzes where module_id=saved_module order by created_at limit 1;
      quiz_row.id:=coalesce(saved_quiz,gen_random_uuid());
    end if;
    insert into public.quizzes(id,module_id,teacher_id,title,description,passing_score,max_attempts,time_limit_seconds,
      allow_retake,show_explanation,shuffle_questions,is_published,status)
    values(quiz_row.id,saved_module,auth.uid(),quiz_row.title,quiz_row.description,quiz_row.passing_score,quiz_row.max_attempts,
      quiz_row.time_limit_seconds,quiz_row.allow_retake,quiz_row.show_explanation,quiz_row.shuffle_questions,quiz_row.is_published,quiz_row.status)
    on conflict(id) do update set title=excluded.title,description=excluded.description,passing_score=excluded.passing_score,
      max_attempts=excluded.max_attempts,time_limit_seconds=excluded.time_limit_seconds,allow_retake=excluded.allow_retake,
      show_explanation=excluded.show_explanation,shuffle_questions=excluded.shuffle_questions,is_published=excluded.is_published,status=excluded.status
      where public.quizzes.module_id=saved_module returning id into saved_quiz;
    if saved_quiz is null then raise exception 'Kuis tidak termasuk modul ini.'; end if;
    -- Move current slots out of the way in this transaction so arbitrary reorderings cannot collide.
    with slots as (select id,-(row_number() over(order by id)+coalesce(max(abs(order_index)) over(),0)+100)::integer as slot
      from public.quiz_questions where quiz_id=saved_quiz)
    update public.quiz_questions q set order_index=s.slot from slots s where q.id=s.id;
    for item in select value from jsonb_array_elements(questions_input) loop
      question_row:=jsonb_populate_record(null::public.quiz_questions,item);
      question_row.id:=coalesce(question_row.id,gen_random_uuid());
      if question_row.id=any(question_ids) then raise exception 'ID pertanyaan duplikat.'; end if;
      insert into public.quiz_questions(id,quiz_id,question_type,question_text,options,correct_answer,explanation,show_explanation,points,order_index)
      values(question_row.id,saved_quiz,question_row.question_type,question_row.question_text,question_row.options,
        question_row.correct_answer,question_row.explanation,question_row.show_explanation,question_row.points,question_row.order_index)
      on conflict(id) do update set question_type=excluded.question_type,question_text=excluded.question_text,options=excluded.options,
        correct_answer=excluded.correct_answer,explanation=excluded.explanation,show_explanation=excluded.show_explanation,
        points=excluded.points,order_index=excluded.order_index where public.quiz_questions.quiz_id=saved_quiz;
      get diagnostics affected=row_count;
      if affected<>1 then raise exception 'Pertanyaan tidak termasuk kuis ini.'; end if;
      question_ids:=array_append(question_ids,question_row.id);
    end loop;
    delete from public.quiz_questions where quiz_id=saved_quiz and not(id=any(question_ids));
  end if;
  if cover_input is not null and cover_input<>'null'::jsonb then
    cover_row:=jsonb_populate_record(null::public.media_assets,cover_input);
    insert into public.media_assets(owner_id,module_id,bucket,path,public_url,mime_type,size_bytes,kind)
    values(auth.uid(),saved_module,cover_row.bucket,cover_row.path,cover_row.public_url,cover_row.mime_type,cover_row.size_bytes,'module_cover')
    on conflict(bucket,path) do update set module_id=excluded.module_id,public_url=excluded.public_url;
  end if;
  if notification_input is not null and notification_input<>'null'::jsonb then
    insert into public.announcements(teacher_id,class_id,title,content,status,priority,published_at)
    values(auth.uid(),nullif(notification_input->>'class_id','')::uuid,notification_input->>'title',notification_input->>'content','published','normal',now());
  end if;
  return saved_module;
end
$$;
revoke all on function public.save_teacher_module(uuid,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.save_teacher_module(uuid,jsonb,jsonb,jsonb,jsonb,jsonb,jsonb) to authenticated;
