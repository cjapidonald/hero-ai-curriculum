-- Link existing Alvin curriculum skills to the Alvin Curriculum
DO $$
DECLARE
    v_alvin_curriculum_id UUID;
    v_alvin_class_id UUID;
BEGIN
    -- Get Alvin curriculum ID by looking up lessons associated with Alvin class
    SELECT id INTO v_alvin_class_id FROM public.classes WHERE class_name = 'Alvin' LIMIT 1;

    -- For now, since curriculum table doesn't have a name field, we'll get the first curriculum
    -- or create a mapping based on the teacher
    SELECT id INTO v_alvin_curriculum_id FROM public.curriculum WHERE lesson_title LIKE '%Alvin%' LIMIT 1;

    -- If we found a curriculum, update the skills
    IF v_alvin_curriculum_id IS NOT NULL THEN
        -- Update ESL skills
        UPDATE public.skills
        SET
            curriculum_id = v_alvin_curriculum_id,
            subject = 'ESL',
            strand = CASE
                WHEN skill_code LIKE '1Lm%' THEN 'Listening'
                WHEN skill_code LIKE '1Ld%' THEN 'Listening'
                WHEN skill_code LIKE '1Sc%' THEN 'Speaking'
                WHEN skill_code LIKE '1Sor%' THEN 'Speaking'
                WHEN skill_code LIKE '1Wca%' THEN 'Writing'
                WHEN skill_code LIKE '1Wc%' THEN 'Writing'
                WHEN skill_code LIKE '1Rd%' THEN 'Reading'
                WHEN skill_code LIKE '1Ug%' THEN 'Use of English'
                WHEN skill_code LIKE '1Uv%' THEN 'Use of English'
                WHEN skill_code LIKE '1Us%' THEN 'Use of English'
                ELSE NULL
            END,
            substrand = CASE
                WHEN skill_code LIKE '1Lm%' THEN 'Listening for global meaning'
                WHEN skill_code LIKE '1Ld%' THEN 'Listening for detail'
                WHEN skill_code LIKE '1Sc%' THEN 'Communication'
                WHEN skill_code LIKE '1Sor%' THEN 'Organisation'
                WHEN skill_code LIKE '1Wca%' THEN 'Communicative achievement'
                WHEN skill_code LIKE '1Wc%' THEN 'Content'
                WHEN skill_code LIKE '1Rd%' THEN 'Reading for detail'
                WHEN skill_code LIKE '1Ug%' THEN 'Grammatical forms'
                WHEN skill_code LIKE '1Uv%' THEN 'Vocabulary'
                WHEN skill_code LIKE '1Us%' THEN 'Sentence structure'
                ELSE NULL
            END
        WHERE skill_code SIMILAR TO '1(Lm|Ld|Sc|Sor|Wca|Wc|Rd|Ug|Uv|Us)\.%';

        -- Update Math skills
        UPDATE public.skills
        SET
            curriculum_id = v_alvin_curriculum_id,
            subject = 'Math',
            strand = CASE
                WHEN skill_code LIKE '1Nc%' THEN 'Number'
                WHEN skill_code LIKE '1Ni%' THEN 'Number'
                WHEN skill_code LIKE '1Nm%' THEN 'Number'
                WHEN skill_code LIKE '1Np%' THEN 'Number'
                WHEN skill_code LIKE '1Nf%' THEN 'Number'
                WHEN skill_code LIKE '1Gt%' THEN 'Geometry and Measure'
                WHEN skill_code LIKE '1Gg%' THEN 'Geometry and Measure'
                WHEN skill_code LIKE '1Gp%' THEN 'Geometry and Measure'
                WHEN skill_code LIKE '1Ss%' THEN 'Statistics and Probability'
                ELSE NULL
            END,
            substrand = CASE
                WHEN skill_code LIKE '1Nc%' THEN 'Counting and sequences'
                WHEN skill_code LIKE '1Ni%' THEN 'Integers, powers and roots'
                WHEN skill_code LIKE '1Nm%' THEN 'Money'
                WHEN skill_code LIKE '1Np%' THEN 'Place value, ordering and rounding'
                WHEN skill_code LIKE '1Nf%' THEN 'Fractions, decimals, percentages, ratio and proportion'
                WHEN skill_code LIKE '1Gt%' THEN 'Time'
                WHEN skill_code LIKE '1Gg%' THEN 'Geometrical reasoning, shapes and measurements'
                WHEN skill_code LIKE '1Gp%' THEN 'Position and Transformations'
                WHEN skill_code LIKE '1Ss%' THEN 'Statistics'
                ELSE NULL
            END
        WHERE skill_code SIMILAR TO '1(Nc|Ni|Nm|Np|Nf|Gt|Gg|Gp|Ss)\.%';

        -- Update Science skills
        UPDATE public.skills
        SET
            curriculum_id = v_alvin_curriculum_id,
            subject = 'Science',
            strand = CASE
                WHEN skill_code LIKE '1TWSp%' THEN 'Scientific enquiry'
                WHEN skill_code LIKE '1TWSc%' THEN 'Scientific enquiry'
                WHEN skill_code LIKE '1TWSa%' THEN 'Scientific enquiry'
                WHEN skill_code LIKE '1Bs%' THEN 'Biology'
                WHEN skill_code LIKE '1Bp%' THEN 'Biology'
                WHEN skill_code LIKE '1Cm%' THEN 'Chemistry'
                WHEN skill_code LIKE '1Cp%' THEN 'Chemistry'
                WHEN skill_code LIKE '1Cc%' THEN 'Chemistry'
                WHEN skill_code LIKE '1Pf%' THEN 'Physics'
                WHEN skill_code LIKE '1Ps%' THEN 'Physics'
                WHEN skill_code LIKE '1Pe%' THEN 'Physics'
                WHEN skill_code LIKE '1ESp%' THEN 'Earth and Space'
                WHEN skill_code LIKE '1ESs%' THEN 'Earth and Space'
                WHEN skill_code LIKE '1SIC%' THEN 'Science in Context'
                ELSE NULL
            END,
            substrand = CASE
                WHEN skill_code LIKE '1TWSp%' THEN 'Purpose and planning'
                WHEN skill_code LIKE '1TWSc%' THEN 'Carrying out scientific enquiry'
                WHEN skill_code LIKE '1TWSa%' THEN 'Analysis, evaluation and conclusions'
                WHEN skill_code LIKE '1Bs%' THEN 'Structure and function'
                WHEN skill_code LIKE '1Bp%' THEN 'Life processes'
                WHEN skill_code LIKE '1Cm%' THEN 'Materials and their structure'
                WHEN skill_code LIKE '1Cp%' THEN 'Properties of materials'
                WHEN skill_code LIKE '1Cc%' THEN 'Changes to materials'
                WHEN skill_code LIKE '1Pf%' THEN 'Forces and energy'
                WHEN skill_code LIKE '1Ps%' THEN 'Light and sound'
                WHEN skill_code LIKE '1Pe%' THEN 'Electricity and magnetism'
                WHEN skill_code LIKE '1ESp%' THEN 'Planet earth'
                WHEN skill_code LIKE '1ESs%' THEN 'Earth in space'
                ELSE NULL
            END
        WHERE skill_code SIMILAR TO '1(TWSp|TWSc|TWSa|Bs|Bp|Cm|Cp|Cc|Pf|Ps|Pe|ESp|ESs|SIC)\.%';

        -- Update Phonics skills
        UPDATE public.skills
        SET
            curriculum_id = v_alvin_curriculum_id,
            subject = 'Phonics',
            strand = 'Assessment',
            substrand = CASE
                WHEN skill_code = 'PH1.BASE' THEN 'Baseline'
                WHEN skill_code LIKE 'PH2%' THEN 'Phase 2'
                WHEN skill_code LIKE 'PH3%' THEN 'Phase 3'
                ELSE NULL
            END
        WHERE skill_code LIKE 'PH%';

        RAISE NOTICE 'Successfully linked skills to Alvin curriculum: %', v_alvin_curriculum_id;
    ELSE
        RAISE NOTICE 'Alvin curriculum not found, skills not updated';
    END IF;
END $$;
