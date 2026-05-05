alter table review_queue add constraint review_queue_user_question_unique unique (user_id, question_id);
