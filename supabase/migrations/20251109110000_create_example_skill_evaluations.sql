-- Create Example Skill Evaluations for Xhoana Strand's Alvin Class
-- This demonstrates the full skills evaluation workflow

DO $$
DECLARE
    v_teacher_id UUID;
    v_class_id UUID;
    v_student1_id UUID;
    v_student2_id UUID;
    v_student3_id UUID;
    v_skill1_id UUID;
    v_skill2_id UUID;
    v_skill3_id UUID;
    v_skill4_id UUID;
    v_skill5_id UUID;
BEGIN
    -- Get Xhoana Strand's teacher ID
    SELECT id INTO v_teacher_id FROM public.teachers WHERE email = 'xhoana.strand@heroschool.com' LIMIT 1;

    -- Get Alvin class ID
    SELECT id INTO v_class_id FROM public.classes WHERE class_name = 'Alvin' LIMIT 1;

    IF v_teacher_id IS NULL THEN
        RAISE NOTICE 'Teacher Xhoana Strand not found';
        RETURN;
    END IF;

    IF v_class_id IS NULL THEN
        RAISE NOTICE 'Alvin class not found';
        RETURN;
    END IF;

    -- Get some students from Alvin class (limit to 3 for demo)
    SELECT student_id INTO v_student1_id FROM public.class_students WHERE class_id = v_class_id LIMIT 1 OFFSET 0;
    SELECT student_id INTO v_student2_id FROM public.class_students WHERE class_id = v_class_id LIMIT 1 OFFSET 1;
    SELECT student_id INTO v_student3_id FROM public.class_students WHERE class_id = v_class_id LIMIT 1 OFFSET 2;

    -- Get some ESL skills for evaluation
    SELECT id INTO v_skill1_id FROM public.skills WHERE skill_code = '1Lm.01' LIMIT 1;
    SELECT id INTO v_skill2_id FROM public.skills WHERE skill_code = '1Sc.01' LIMIT 1;
    SELECT id INTO v_skill3_id FROM public.skills WHERE skill_code = '1Wca.02' LIMIT 1;
    SELECT id INTO v_skill4_id FROM public.skills WHERE skill_code = '1Rd.01' LIMIT 1;
    SELECT id INTO v_skill5_id FROM public.skills WHERE skill_code = '1Ug.02' LIMIT 1;

    IF v_student1_id IS NOT NULL AND v_skill1_id IS NOT NULL THEN
        -- Student 1 Evaluations - Progressive improvement

        -- Listening skill - showing progress over time
        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student1_id, v_skill1_id, v_teacher_id, v_class_id, 65, 'Good start! Can follow basic instructions. Need to work on longer sentences.', NOW() - INTERVAL '30 days'),
        (v_student1_id, v_skill1_id, v_teacher_id, v_class_id, 75, 'Improving! Better attention span and comprehension.', NOW() - INTERVAL '15 days'),
        (v_student1_id, v_skill1_id, v_teacher_id, v_class_id, 85, 'Excellent progress! Can understand main points clearly.', NOW() - INTERVAL '2 days');

        -- Speaking skill
        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student1_id, v_skill2_id, v_teacher_id, v_class_id, 70, 'Can give basic information with some hesitation.', NOW() - INTERVAL '25 days'),
        (v_student1_id, v_skill2_id, v_teacher_id, v_class_id, 78, 'More confident now. Good vocabulary use!', NOW() - INTERVAL '5 days');

        -- Writing skill
        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student1_id, v_skill3_id, v_teacher_id, v_class_id, 80, 'Letter formation is excellent. Keep practicing!', NOW() - INTERVAL '10 days');

        -- Reading skill
        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student1_id, v_skill4_id, v_teacher_id, v_class_id, 88, 'Can name all letters and their sounds. Outstanding!', NOW() - INTERVAL '7 days');

        -- Grammar skill
        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student1_id, v_skill5_id, v_teacher_id, v_class_id, 72, 'Understanding present simple. Needs more practice with negatives.', NOW() - INTERVAL '3 days');

        RAISE NOTICE 'Created evaluations for student 1';
    END IF;

    IF v_student2_id IS NOT NULL AND v_skill1_id IS NOT NULL THEN
        -- Student 2 Evaluations - Consistent high performer

        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student2_id, v_skill1_id, v_teacher_id, v_class_id, 90, 'Excellent listener! Very attentive.', NOW() - INTERVAL '28 days'),
        (v_student2_id, v_skill1_id, v_teacher_id, v_class_id, 92, 'Consistently strong performance.', NOW() - INTERVAL '10 days');

        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student2_id, v_skill2_id, v_teacher_id, v_class_id, 85, 'Very confident speaker. Great pronunciation!', NOW() - INTERVAL '20 days'),
        (v_student2_id, v_skill2_id, v_teacher_id, v_class_id, 88, 'Uses complete sentences. Impressive!', NOW() - INTERVAL '6 days');

        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student2_id, v_skill3_id, v_teacher_id, v_class_id, 95, 'Beautiful handwriting! Upper and lower case perfect.', NOW() - INTERVAL '12 days');

        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student2_id, v_skill4_id, v_teacher_id, v_class_id, 93, 'Reading fluently at this level. Excellent blending!', NOW() - INTERVAL '8 days');

        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student2_id, v_skill5_id, v_teacher_id, v_class_id, 87, 'Strong grasp of present simple forms.', NOW() - INTERVAL '4 days');

        RAISE NOTICE 'Created evaluations for student 2';
    END IF;

    IF v_student3_id IS NOT NULL AND v_skill1_id IS NOT NULL THEN
        -- Student 3 Evaluations - Needs support, showing improvement

        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student3_id, v_skill1_id, v_teacher_id, v_class_id, 55, 'Struggles with attention. Needs more one-on-one time.', NOW() - INTERVAL '35 days'),
        (v_student3_id, v_skill1_id, v_teacher_id, v_class_id, 62, 'Showing improvement with extra support. Keep it up!', NOW() - INTERVAL '18 days'),
        (v_student3_id, v_skill1_id, v_teacher_id, v_class_id, 68, 'Progress is visible! More confident now.', NOW() - INTERVAL '5 days');

        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student3_id, v_skill2_id, v_teacher_id, v_class_id, 58, 'Shy to speak. Encourage daily practice.', NOW() - INTERVAL '30 days'),
        (v_student3_id, v_skill2_id, v_teacher_id, v_class_id, 65, 'Starting to participate more. Good progress!', NOW() - INTERVAL '12 days');

        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student3_id, v_skill3_id, v_teacher_id, v_class_id, 60, 'Letter formation needs work. Practice recommended.', NOW() - INTERVAL '15 days'),
        (v_student3_id, v_skill3_id, v_teacher_id, v_class_id, 70, 'Improvement! More consistent now.', NOW() - INTERVAL '3 days');

        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student3_id, v_skill4_id, v_teacher_id, v_class_id, 65, 'Knows most letters. Continue daily practice.', NOW() - INTERVAL '10 days');

        INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
        (v_student3_id, v_skill5_id, v_teacher_id, v_class_id, 60, 'Basic understanding. Needs more examples.', NOW() - INTERVAL '6 days');

        RAISE NOTICE 'Created evaluations for student 3';
    END IF;

    -- Add Math skill evaluations if we have students
    DECLARE
        v_math_skill1 UUID;
        v_math_skill2 UUID;
    BEGIN
        SELECT id INTO v_math_skill1 FROM public.skills WHERE skill_code = '1Nc.01' LIMIT 1;
        SELECT id INTO v_math_skill2 FROM public.skills WHERE skill_code = '1Ni.02' LIMIT 1;

        IF v_student1_id IS NOT NULL AND v_math_skill1 IS NOT NULL THEN
            INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
            (v_student1_id, v_math_skill1, v_teacher_id, v_class_id, 82, 'Good counting skills. Understands one-to-one correspondence.', NOW() - INTERVAL '8 days');

            INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
            (v_student1_id, v_math_skill2, v_teacher_id, v_class_id, 75, 'Understanding addition concept. Practice needed.', NOW() - INTERVAL '4 days');
        END IF;

        IF v_student2_id IS NOT NULL AND v_math_skill1 IS NOT NULL THEN
            INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
            (v_student2_id, v_math_skill1, v_teacher_id, v_class_id, 95, 'Excellent counting! Very quick and accurate.', NOW() - INTERVAL '9 days');

            INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
            (v_student2_id, v_math_skill2, v_teacher_id, v_class_id, 90, 'Strong understanding of addition. Excellent work!', NOW() - INTERVAL '5 days');
        END IF;

        IF v_student3_id IS NOT NULL AND v_math_skill1 IS NOT NULL THEN
            INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
            (v_student3_id, v_math_skill1, v_teacher_id, v_class_id, 68, 'Can count to 20. Sometimes loses track.', NOW() - INTERVAL '7 days');

            INSERT INTO public.skill_evaluations (student_id, skill_id, teacher_id, class_id, score, text_feedback, evaluation_date) VALUES
            (v_student3_id, v_math_skill2, v_teacher_id, v_class_id, 62, 'Basic concept understood. Needs concrete examples.', NOW() - INTERVAL '3 days');
        END IF;
    END;

    RAISE NOTICE 'Successfully created example skill evaluations for Alvin class';

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating evaluations: %', SQLERRM;
END $$;
