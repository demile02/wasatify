begin;
do $test$
declare s uuid; t uuid; m uuid:=gen_random_uuid(); l uuid:=gen_random_uuid(); q uuid:=gen_random_uuid(); q1 uuid:=gen_random_uuid(); q2 uuid:=gen_random_uuid();
r jsonb; replay jsonb; before_xp integer; stamp timestamptz:=now()-interval '5 minutes'; denied boolean;
begin
 select p.id,c.teacher_id,p.xp into s,t,before_xp from public.profiles p join public.classes c on c.id=p.class_id where p.email='alzacebong@gmail.com' and p.role='student';
 if s is null then raise exception 'Audit account missing'; end if;
 insert into public.modules(id,teacher_id,created_by,title,slug,description,status,order_index) values(m,t,t,'Audit rollback','audit-'||m,'Audit fixture','published',-100000);
 insert into public.lessons(id,module_id,title,slug) values(l,m,'Audit lesson','audit');
 insert into public.quizzes(id,module_id,teacher_id,title,is_published,status,max_attempts) values(q,m,t,'Audit quiz',true,'published',2);
 insert into public.quiz_questions(id,quiz_id,question_text,correct_answer,points,order_index) values(q1,q,'Q1','{"value":"a"}',80,1),(q2,q,'Q2','{"value":"b"}',20,2);
 perform set_config('request.jwt.claim.sub',s::text,true);
 perform set_config('request.jwt.claim.role','authenticated',true);
 execute 'set local role authenticated';
 r:=public.complete_learning_lesson(m,l);
 if (r->>'progressPercent')::int<>90 then raise exception 'Lesson progress assertion failed: %',r; end if;
 r:=public.submit_learning_quiz(m,q,jsonb_build_object(q1,'a',q2,'a'),stamp);
 if (r->>'score')::numeric<>80 or (r->>'passed')::boolean is not true then raise exception 'Grade assertion failed: %',r; end if;
 replay:=public.submit_learning_quiz(m,q,jsonb_build_object(q1,'a',q2,'a'),stamp);
 if replay->>'attemptId'<>r->>'attemptId' then raise exception 'Idempotency failed'; end if;
 if (select xp from public.profiles where id=s)<>before_xp+50 then raise exception 'Quiz reward failed'; end if;
 perform public.submit_learning_reflection(m,repeat('refleksi ',5),repeat('aksi ',6));
 perform public.submit_learning_reflection(m,repeat('refleksi ',5),repeat('aksi ',6));
 if (select xp from public.profiles where id=s)<>before_xp+70 then raise exception 'Reflection reward failed'; end if;
 denied:=false;
 begin update public.quiz_attempts set score=100 where id=(r->>'attemptId')::uuid; exception when raise_exception then denied:=true; end;
 if not denied then raise exception 'Direct grade update allowed'; end if;
 denied:=false;
 begin update public.profiles set xp=xp+999 where id=s; exception when raise_exception then denied:=true; end;
 if not denied then raise exception 'Direct XP update allowed'; end if;
 perform public.submit_learning_quiz(m,q,jsonb_build_object(q1,'a',q2,'b'),stamp+interval '1 second');
 denied:=false;
 begin perform public.submit_learning_quiz(m,q,jsonb_build_object(q1,'a',q2,'b'),stamp+interval '2 seconds'); exception when raise_exception then denied:=true; end;
 if not denied then raise exception 'Attempt limit bypassed'; end if;
 if (select xp from public.profiles where id=s)<>before_xp+70 then raise exception 'Duplicate quiz reward'; end if;
 if (select progress_percent from public.module_progress where student_id=s and module_id=m)<>100 then raise exception 'Completed progress failed'; end if;
 if not exists(select 1 from jsonb_array_elements(public.get_student_module_catalog(true)->'modules') item where item->>'id'=m::text and item->>'lesson_count'='1' and item->>'completed_lesson_count'='1') then raise exception 'Catalog counts failed'; end if;
 execute 'reset role';
 update public.quiz_questions set question_text='Edited later',correct_answer='{"value":"b"}' where id=q1;
 if not exists(select 1 from public.quiz_attempts a, jsonb_array_elements(a.question_snapshot) item
   where a.id=(r->>'attemptId')::uuid and item->>'id'=q1::text and item->>'question_text'='Q1' and item->'correct_answer'->>'value'='a')
 then raise exception 'Historical review snapshot changed'; end if;
end $test$;
rollback;
select 'PASS: atomic grading, weighted score, idempotency, attempt limits, progress, XP, reflection, direct-write protection, catalog. Fixtures rolled back.' as result;
