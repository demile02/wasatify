begin;
do $test$
declare t uuid; m uuid; saved uuid; q uuid; l uuid:=gen_random_uuid(); q1 uuid:=gen_random_uuid(); q2 uuid:=gen_random_uuid();
payload jsonb; lessons jsonb; quiz jsonb; questions jsonb; denied boolean;
begin
 select id into t from public.profiles where email='demilebusiness@gmail.com' and role='teacher';
 if t is null then raise exception 'Teacher fixture account missing'; end if;
 perform set_config('request.jwt.claim.sub',t::text,true);
 perform set_config('request.jwt.claim.role','authenticated',true);
 execute 'set local role authenticated';
 payload:=jsonb_build_object('title','Atomic audit module','slug','audit-'||gen_random_uuid(),'description','Temporary atomic audit module for rollback',
  'tags','[]'::jsonb,'status','draft','is_public',true,'estimated_minutes',10,'order_index',999);
 lessons:=jsonb_build_array(jsonb_build_object('id',l,'title','Lesson audit','slug','audit-lesson','content','Audit content','order_index',1,'estimated_minutes',12));
 quiz:=jsonb_build_object('title','Audit quiz','passing_score',70,'max_attempts',3,'time_limit_seconds',600,'allow_retake',true,
  'show_explanation',true,'shuffle_questions',false,'is_published',false,'status','draft');
 questions:=jsonb_build_array(
  jsonb_build_object('id',q1,'question_type','multiple_choice','question_text','First','options','[]'::jsonb,'correct_answer','{"value":"a"}'::jsonb,'show_explanation',true,'points',80,'order_index',1),
  jsonb_build_object('id',q2,'question_type','multiple_choice','question_text','Second','options','[]'::jsonb,'correct_answer','{"value":"b"}'::jsonb,'show_explanation',true,'points',20,'order_index',2));
 m:=public.save_teacher_module(null,payload,lessons,quiz,questions,null,null);
 if (select estimated_minutes from public.lessons where id=l)<>12 then raise exception 'Lesson duration lost'; end if;
 select id into q from public.quizzes where module_id=m;
 quiz:=quiz||jsonb_build_object('id',q);
 questions:=jsonb_set(jsonb_set(questions,'{0,order_index}','2'),'{1,order_index}','1');
 saved:=public.save_teacher_module(m,payload,lessons,quiz,questions,null,null);
 if saved<>m or (select order_index from public.quiz_questions where id=q1)<>2 then raise exception 'Atomic reorder failed'; end if;
 denied:=false;
 begin
   perform public.save_teacher_module(m,payload||'{"title":"Must not persist"}',lessons,quiz,jsonb_set(questions,'{0,points}','-1'),null,null);
 exception when check_violation then denied:=true;
 end;
 if not denied or (select title from public.modules where id=m)<>'Atomic audit module' then raise exception 'Rollback failed'; end if;
 if (select count(*) from public.quiz_questions where quiz_id=q)<>2 or (select min(order_index) from public.quiz_questions where quiz_id=q)<>1 then raise exception 'Questions corrupted after failure'; end if;
 execute 'reset role';
end $test$;
rollback;
select 'PASS: create/edit module, preserve IDs, reorder quiz questions, full rollback on invalid child. Fixtures rolled back.' as result;
