-- =============================================
-- Teacher Standards & Progress Tables
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'teacher_standards'
  ) THEN
    CREATE TABLE public.teacher_standards (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      domain TEXT NOT NULL,
      standard_number TEXT NOT NULL,
      standard_name TEXT NOT NULL,
      focus_area_number TEXT NOT NULL,
      focus_area_name TEXT NOT NULL,
      graduate_descriptor TEXT NOT NULL,
      proficient_descriptor TEXT NOT NULL,
      highly_accomplished_descriptor TEXT NOT NULL,
      lead_descriptor TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    COMMENT ON TABLE public.teacher_standards IS 'Reference table describing professional teaching standards and focus areas.';
    COMMENT ON COLUMN public.teacher_standards.domain IS 'High-level professional domain (e.g., Professional Knowledge, Professional Practice).';
    COMMENT ON COLUMN public.teacher_standards.standard_number IS 'Standard identifier (1 through 7).';
    COMMENT ON COLUMN public.teacher_standards.focus_area_number IS 'Focus area identifier (e.g., 1.1, 6.3).';
    COMMENT ON COLUMN public.teacher_standards.graduate_descriptor IS 'Descriptor for the Graduate career stage.';

    CREATE TRIGGER update_teacher_standards_updated_at
      BEFORE UPDATE ON public.teacher_standards
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    ALTER TABLE public.teacher_standards ENABLE ROW LEVEL SECURITY;
    BEGIN
      CREATE POLICY "Authenticated users can read teacher standards"
        ON public.teacher_standards FOR SELECT
        USING (true);
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'teacher_standards'
      AND constraint_name = 'teacher_standards_domain_focus_key'
  ) THEN
    ALTER TABLE public.teacher_standards
      ADD CONSTRAINT teacher_standards_domain_focus_key UNIQUE (domain, standard_number, focus_area_number);
  END IF;
END $$;

INSERT INTO public.teacher_standards (
  domain,
  standard_number,
  standard_name,
  focus_area_number,
  focus_area_name,
  graduate_descriptor,
  proficient_descriptor,
  highly_accomplished_descriptor,
  lead_descriptor
)
VALUES
  ('Professional Knowledge', '1', 'Know students and how they learn', '1.1', 'Physical social and intellectual development and characteristics of students', 'Demonstrate knowledge and understanding of physical, social and intellectual development and characteristics of students and how these may affect learning', 'Use teaching strategies based on knowledge of students'' physical, social and intellectual development and characteristics to improve student learning', 'Select from a flexible and effective repertoire of teaching strategies to suit the physical, social and intellectual development and characteristics of students', 'Lead colleagues to select and develop teaching strategies to improve student learning using knowledge of the physical, social and intellectual development and characteristics of students'),
  ('Professional Knowledge', '1', 'Know students and how they learn', '1.2', 'Understand how students learn', 'Demonstrate knowledge and understanding of research into how students learn and the implications for teaching', 'Structure teaching programs using research and collegial advice about how students learn', 'Expand understanding of how students learn using research and workplace knowledge', 'Lead processes to evaluate the effectiveness of teaching programs using research and workplace knowledge about how students learn'),
  ('Professional Knowledge', '1', 'Know students and how they learn', '1.3', 'Students with diverse linguistic cultural religious and socioeconomic backgrounds', 'Demonstrate knowledge of teaching strategies that are responsive to the learning strengths and needs of students from diverse linguistic, cultural, religious and socioeconomic backgrounds', 'Design and implement teaching strategies that are responsive to the learning strengths and needs of students from diverse linguistic, cultural, religious and socioeconomic backgrounds', 'Support colleagues to develop effective teaching strategies that address the learning strengths and needs of students from diverse linguistic, cultural, religious and socioeconomic backgrounds', 'Evaluate and revise school learning and teaching programs, using expert and community knowledge and experience, to meet the needs of students with diverse linguistic, cultural, religious and socioeconomic backgrounds'),
  ('Professional Knowledge', '1', 'Know students and how they learn', '1.4', 'Strategies for teaching Aboriginal and Torres Strait Islander students', 'Demonstrate broad knowledge and understanding of the impact of culture, cultural identity and linguistic background on the education of students from Aboriginal and Torres Strait Islander backgrounds', 'Design and implement effective teaching strategies that are responsive to the local community and cultural setting, linguistic background and histories of Aboriginal and Torres Strait Islander students', 'Provide advice and support colleagues in the implementation of effective teaching strategies for Aboriginal and Torres Strait Islander students using knowledge of and support from community representatives', 'Develop teaching programs that support equitable and ongoing participation of Aboriginal and Torres Strait Islander students by engaging in collaborative relationships with community representatives and parents/carers'),
  ('Professional Knowledge', '1', 'Know students and how they learn', '1.5', 'Differentiate teaching to meet the specific learning needs of students across the full range of abilities', 'Demonstrate knowledge and understanding of strategies for differentiating teaching to meet the specific learning needs of students across the full range of abilities', 'Develop teaching activities that incorporate differentiated strategies to meet the specific learning needs of students across the full range of abilities', 'Evaluate learning and teaching programs, using student assessment data, that are differentiated for the specific learning needs of students across the full range of abilities', 'Lead colleagues to evaluate the effectiveness of learning and teaching programs differentiated for the specific learning needs of students across the full range of abilities'),
  ('Professional Knowledge', '1', 'Know students and how they learn', '1.6', 'Strategies to support full participation of students with disability', 'Demonstrate broad knowledge and understanding of legislative requirements and teaching strategies that support participation and learning of students with disability', 'Design and implement teaching activities that support the participation and learning of students with disability and address relevant policy and legislative requirements', 'Work with colleagues to access specialist knowledge, and relevant policy and legislation, to develop teaching programs that support the participation and learning of students with disability', 'Initiate and lead the review of school policies to support the engagement and full participation of students with disability and ensure compliance with legislative and/or system policies'),
  ('Professional Knowledge', '2', 'Know the content and how to teach it', '2.1', 'Content and teaching strategies of the teaching area', 'Demonstrate knowledge and understanding of the concepts, substance and structure of the content and teaching strategies of the teaching area', 'Apply knowledge of the content and teaching strategies of the teaching area to develop engaging teaching activities', 'Support colleagues using current and comprehensive knowledge of content and teaching strategies to develop and implement engaging learning and teaching programs', 'Lead initiatives within the school to evaluate and improve knowledge of content and teaching strategies and demonstrate exemplary teaching of subjects using effective, research-based learning and teaching programs'),
  ('Professional Knowledge', '2', 'Know the content and how to teach it', '2.2', 'Content selection and organisation', 'Organise content into an effective learning and teaching sequence', 'Organise content into coherent, well-sequenced learning and teaching programs', 'Exhibit innovative practice in the selection and organisation of content and delivery of learning and teaching programs', 'Lead initiatives that utilise comprehensive content knowledge to improve the selection and sequencing of content into coherently organised learning and teaching programs'),
  ('Professional Knowledge', '2', 'Know the content and how to teach it', '2.3', 'Curriculum assessment and reporting', 'Use curriculum, assessment and reporting knowledge to design learning sequences and lesson plans', 'Design and implement learning and teaching programs using knowledge of curriculum, assessment and reporting requirements', 'Support colleagues to plan and implement learning and teaching programs using contemporary knowledge and understanding of curriculum, assessment and reporting requirements', 'Lead colleagues to develop learning and teaching programs using comprehensive knowledge of curriculum, assessment and reporting requirements'),
  ('Professional Knowledge', '2', 'Know the content and how to teach it', '2.4', 'Understand and respect Aboriginal and Torres Strait Islander people to promote reconciliation between Indigenous and non-Indigenous Australians', 'Demonstrate broad knowledge of, understanding of and respect for Aboriginal and Torres Strait Islander histories, cultures and languages', 'Provide opportunities for students to develop understanding of and respect for Aboriginal and Torres Strait Islander histories, cultures and languages', 'Support colleagues with providing opportunities for students to develop understanding of and respect for Aboriginal and Torres Strait Islander histories, cultures and languages', 'Lead initiatives to assist colleagues with opportunities for students to develop understanding of and respect for Aboriginal and Torres Strait Islander histories, cultures and languages'),
  ('Professional Knowledge', '2', 'Know the content and how to teach it', '2.5', 'Literacy and numeracy strategies', 'Know and understand literacy and numeracy teaching strategies and their application in teaching areas', 'Apply knowledge and understanding of effective teaching strategies to support students'' literacy and numeracy achievement', 'Support colleagues to implement effective teaching strategies to improve students'' literacy and numeracy achievement', 'Monitor and evaluate the implementation of teaching strategies within the school to improve students'' achievement in literacy and numeracy using research-based knowledge and student data'),
  ('Professional Knowledge', '2', 'Know the content and how to teach it', '2.6', 'Information and Communication Technology (ICT)', 'Implement teaching strategies for using ICT to expand curriculum learning opportunities for students', 'Use effective teaching strategies to integrate ICT into learning and teaching programs to make selected content relevant and meaningful', 'Model high-level teaching knowledge and skills and work with colleagues to use current ICT to improve their teaching practice and make content relevant and meaningful', 'Lead and support colleagues within the school to select and use ICT with effective teaching strategies to expand learning opportunities and content knowledge for all students'),
  ('Professional Practice', '3', 'Plan for and implement effective teaching and learning', '3.1', 'Establish challenging learning goals', 'Set learning goals that provide achievable challenges for students of varying abilities and characteristics', 'Set explicit, challenging and achievable learning goals for all students', 'Develop a culture of high expectations for all students by modelling and setting challenging learning goals', 'Demonstrate exemplary practice and high expectations and lead colleagues to encourage students to pursue challenging goals in all aspects of their education'),
  ('Professional Practice', '3', 'Plan for and implement effective teaching and learning', '3.2', 'Plan structure and sequence learning programs', 'Plan lesson sequences using knowledge of student learning, content and effective teaching strategies', 'Plan and implement well-structured learning and teaching programs or lesson sequences that engage students and promote learning', 'Work with colleagues to plan, evaluate and modify learning and teaching programs to create productive learning environments that engage all students', 'Exhibit exemplary practice and lead colleagues to plan, implement and review the effectiveness of their learning and teaching programs to develop students'' knowledge, understanding and skills'),
  ('Professional Practice', '3', 'Plan for and implement effective teaching and learning', '3.3', 'Use teaching strategies', 'Include a range of teaching strategies', 'Select and use relevant teaching strategies to develop knowledge, skills, problem solving and critical and creative thinking', 'Support colleagues to select and apply effective teaching strategies to develop knowledge, skills, problem solving and critical and creative thinking', 'Work with colleagues to review, modify and expand their repertoire of teaching strategies to enable students to use knowledge, skills, problem solving and critical and creative thinking'),
  ('Professional Practice', '3', 'Plan for and implement effective teaching and learning', '3.4', 'Select and use resources', 'Demonstrate knowledge of a range of resources, including ICT, that engage students in their learning', 'Select and/or create and use a range of resources, including ICT, to engage students in their learning', 'Assist colleagues to create, select and use a wide range of resources, including ICT, to engage students in their learning', 'Model exemplary skills and lead colleagues in selecting, creating and evaluating resources, including ICT, for application by teachers within or beyond the school'),
  ('Professional Practice', '3', 'Plan for and implement effective teaching and learning', '3.5', 'Use effective classroom communication', 'Demonstrate a range of verbal and non-verbal communication strategies to support student engagement', 'Use effective verbal and non-verbal communication strategies to support student understanding, participation, engagement and achievement', 'Assist colleagues to select a wide range of verbal and non-verbal communication strategies to support students'' understanding, engagement and achievement', 'Demonstrate and lead by example inclusive verbal and non-verbal communication using collaborative strategies and contextual knowledge to support students'' understanding, engagement and achievement'),
  ('Professional Practice', '3', 'Plan for and implement effective teaching and learning', '3.6', 'Evaluate and improve teaching programs', 'Demonstrate broad knowledge of strategies that can be used to evaluate teaching programs to improve student learning', 'Evaluate personal teaching and learning programs using evidence, including feedback from students and student assessment data, to inform planning', 'Work with colleagues to review current teaching and learning programs using student feedback, student assessment data, knowledge of curriculum and workplace practices', 'Conduct regular reviews of teaching and learning programs using multiple sources of evidence including: student assessment data, curriculum documents, teaching practices and feedback from parents/carers, students and colleagues'),
  ('Professional Practice', '3', 'Plan for and implement effective teaching and learning', '3.7', 'Engage parents/carers in the educative process', 'Describe a broad range of strategies for involving parents/carers in the educative process', 'Plan for appropriate and contextually relevant opportunities for parents/carers to be involved in their children''s learning', 'Work with colleagues to provide appropriate and contextually relevant opportunities for parents/carers to be involved in their children''s learning', 'Initiate contextually relevant processes to establish programs that involve parents/carers in the education of their children and broader school priorities and activities'),
  ('Professional Practice', '4', 'Create and maintain supportive and safe learning environments', '4.1', 'Support student participation', 'Identify strategies to support inclusive student participation and engagement in classroom activities', 'Establish and implement inclusive and positive interactions to engage and support all students in classroom activities', 'Model effective practice and support colleagues to implement inclusive strategies that engage and support all students', 'Demonstrate and lead by example the development of productive and inclusive learning environments across the school by reviewing inclusive strategies and exploring new approaches to engage and support all students'),
  ('Professional Practice', '4', 'Create and maintain supportive and safe learning environments', '4.2', 'Manage classroom activities', 'Demonstrate the capacity to organise classroom activities and provide clear directions', 'Establish and maintain orderly and workable routines to create an environment where student time is spent on learning tasks', 'Model and share with colleagues a flexible repertoire of strategies for classroom management to ensure all students are engaged in purposeful activities', 'Initiate strategies and lead colleagues to implement effective classroom management and promote student responsibility for learning'),
  ('Professional Practice', '4', 'Create and maintain supportive and safe learning environments', '4.3', 'Manage challenging behaviour', 'Demonstrate knowledge of practical approaches to manage challenging behaviour', 'Manage challenging behaviour by establishing and negotiating clear expectations with students and address discipline issues promptly, fairly and respectfully', 'Develop and share with colleagues a flexible repertoire of behaviour management strategies using expert knowledge and workplace experience', 'Lead and implement behaviour management initiatives to assist colleagues to broaden their range of strategies'),
  ('Professional Practice', '4', 'Create and maintain supportive and safe learning environments', '4.4', 'Maintain student safety', 'Describe strategies that support students'' wellbeing and safety working within school and/or system, curriculum and legislative requirements', 'Ensure students'' wellbeing and safety within school by implementing school and/or system, curriculum and legislative requirements', 'Initiate and take responsibility for implementing current school and/or system, curriculum and legislative requirements to ensure student wellbeing and safety', 'Evaluate the effectiveness of student wellbeing policies and safe working practices using current school and/or system, curriculum and legislative requirements and assist colleagues to update their practices'),
  ('Professional Practice', '4', 'Create and maintain supportive and safe learning environments', '4.5', 'Use ICT safely responsibly and ethically', 'Demonstrate an understanding of the relevant issues and the strategies available to support the safe, responsible and ethical use of ICT in learning and teaching', 'Incorporate strategies to promote the safe, responsible and ethical use of ICT in learning and teaching', 'Model, and support colleagues to develop, strategies to promote the safe, responsible and ethical use of ICT in learning and teaching', 'Review or implement new policies and strategies to ensure the safe, responsible and ethical use of ICT in learning and teaching'),
  ('Professional Practice', '5', 'Assess provide feedback and report on student learning', '5.1', 'Assess student learning', 'Demonstrate understanding of assessment strategies, including informal and formal, diagnostic, formative and summative approaches to assess student learning', 'Develop, select and use informal and formal, diagnostic, formative and summative assessment strategies to assess student learning', 'Develop and apply a comprehensive range of assessment strategies to diagnose learning needs, comply with curriculum requirements and support colleagues to evaluate the effectiveness of their approaches to assessment', 'Evaluate school assessment policies and strategies to support colleagues with: using assessment data to diagnose learning needs, complying with curriculum, system and/or school assessment requirements and using a range of assessment strategies'),
  ('Professional Practice', '5', 'Assess provide feedback and report on student learning', '5.2', 'Provide feedback to students on their learning', 'Demonstrate an understanding of the purpose of providing timely and appropriate feedback to students about their learning', 'Provide timely, effective and appropriate feedback to students about their achievement relative to their learning goals', 'Select from an effective range of strategies to provide targeted feedback based on informed and timely judgements of each student''s current needs in order to progress learning', 'Model exemplary practice and initiate programs to support colleagues in applying a range of timely, effective and appropriate feedback strategies'),
  ('Professional Practice', '5', 'Assess provide feedback and report on student learning', '5.3', 'Make consistent and comparable judgements', 'Demonstrate understanding of assessment moderation and its application to support consistent and comparable judgements of student learning', 'Understand and participate in assessment moderation activities to support consistent and comparable judgements of student learning', 'Organise assessment moderation activities that support consistent and comparable judgements of student learning', 'Lead and evaluate moderation activities that ensure consistent and comparable judgements of student learning to meet curriculum and school or system requirements'),
  ('Professional Practice', '5', 'Assess provide feedback and report on student learning', '5.4', 'Interpret student data', 'Demonstrate the capacity to interpret student assessment data to evaluate student learning and modify teaching practice', 'Use student assessment data to analyse and evaluate student understanding of subject/content, identifying interventions and modifying teaching practice', 'Work with colleagues to use data from internal and external student assessments for evaluating learning and teaching, identifying interventions and modifying teaching practice', 'Coordinate student performance and program evaluation using internal and external student assessment data to improve teaching practice'),
  ('Professional Practice', '5', 'Assess provide feedback and report on student learning', '5.5', 'Report on student achievement', 'Demonstrate understanding of a range of strategies for reporting to students and parents/carers and the purpose of keeping accurate and reliable records of student achievement', 'Report clearly, accurately and respectfully to students and parents/carers about student achievement, making use of accurate and reliable records', 'Work with colleagues to construct accurate, informative and timely reports to students and parents/carers about student learning and achievement', 'Evaluate and revise reporting and accountability mechanisms in the school to meet the needs of students, parents/carers and colleagues'),
  ('Professional Engagement', '6', 'Engage in professional learning', '6.1', 'Identify and plan professional learning needs', 'Demonstrate an understanding of the role of the Australian Professional Standards for Teachers in identifying professional learning needs', 'Use the Australian Professional Standards for Teachers and advice from colleagues to identify and plan professional learning needs', 'Analyse the Australian Professional Standards for Teachers to plan personal professional development goals, support colleagues to identify and achieve personal development goals and pre-service teachers to improve classroom practice', 'Use comprehensive knowledge of the Australian Professional Standards for Teachers to plan and lead the development of professional learning policies and programs that address the professional learning needs of colleagues and pre-service teachers'),
  ('Professional Engagement', '6', 'Engage in professional learning', '6.2', 'Engage in professional learning and improve practice', 'Understand the relevant and appropriate sources of professional learning for teachers', 'Participate in learning to update knowledge and practice, targeted to professional needs and school and/or system priorities', 'Plan for professional learning by accessing and critiquing relevant research, engage in high-quality targeted opportunities to improve practice and offer quality placements for pre-service teachers where applicable', 'Initiate collaborative relationships to expand professional learning opportunities, engage in research, and provide quality opportunities and placements for pre-service teachers'),
  ('Professional Engagement', '6', 'Engage in professional learning', '6.3', 'Engage with colleagues and improve practice', 'Seek and apply constructive feedback from supervisors and teachers to improve teaching practices', 'Contribute to collegial discussions and apply constructive feedback from colleagues to improve professional knowledge and practice', 'Initiate and engage in professional discussions with colleagues in a range of forums to evaluate practice directed at improving professional knowledge and practice, and the educational outcomes of students', 'Implement professional dialogue within the school or professional learning network(s) that is informed by feedback, analysis of current research and practice to improve the educational outcomes of students'),
  ('Professional Engagement', '6', 'Engage in professional learning', '6.4', 'Apply professional learning and improve student learning', 'Demonstrate an understanding of the rationale for continued professional learning and the implications for improved student learning', 'Undertake professional learning programs designed to address identified student learning needs', 'Engage with colleagues to evaluate the effectiveness of teacher professional learning activities to address student learning needs', 'Advocate, participate in and lead strategies to support high-quality professional learning opportunities for colleagues that focus on improved student learning'),
  ('Professional Engagement', '7', 'Engage professionally with colleagues parents/carers and the community', '7.1', 'Meet professional ethics and responsibilities', 'Understand and apply the key principles described in codes of ethics and conduct for the teaching profession', 'Meet codes of ethics and conduct established by regulatory authorities, systems and schools', 'Maintain high ethical standards and support colleagues to interpret codes of ethics and exercise sound judgement in all school and community contexts', 'Model exemplary ethical behaviour and exercise informed judgements in all professional dealings with students, colleagues and the community'),
  ('Professional Engagement', '7', 'Engage professionally with colleagues parents/carers and the community', '7.2', 'Comply with legislative administrative and organisational requirements', 'Understand the relevant legislative, administrative and organisational policies and processes required for teachers according to school stage', 'Understand the implications of and comply with relevant legislative, administrative, organisational and professional requirements, policies and processes', 'Support colleagues to review and interpret legislative, administrative, and organisational requirements, policies and processes', 'Initiate, develop and implement relevant policies and processes to support colleagues'' compliance with and understanding of existing and new legislative, administrative, organisational and professional responsibilities'),
  ('Professional Engagement', '7', 'Engage professionally with colleagues parents/carers and the community', '7.3', 'Engage with the parents/carers', 'Understand strategies for working effectively, sensitively and confidentially with parents/carers', 'Establish and maintain respectful collaborative relationships with parents/carers regarding their children''s learning and wellbeing', 'Demonstrate responsiveness in all communications with parents/carers about their children''s learning and wellbeing', 'Identify, initiate and build on opportunities that engage parents/carers in both the progress of their children''s learning and in the educational priorities of the school'),
  ('Professional Engagement', '7', 'Engage professionally with colleagues parents/carers and the community', '7.4', 'Engage with professional teaching networks and broader communities', 'Understand the role of external professionals and community representatives in broadening teachers'' professional knowledge and practice', 'Participate in professional and community networks and forums to broaden knowledge and improve practice', 'Contribute to professional networks and associations and build productive links with the wider community to improve teaching and learning', 'Take a leadership role in professional and community networks and support the involvement of colleagues in external learning opportunities')
ON CONFLICT (domain, standard_number, focus_area_number) DO NOTHING;

-- =============================================
-- Teacher Standards Progress Table
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'teacher_standard_progress'
  ) THEN
    CREATE TABLE public.teacher_standard_progress (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
      standard_id UUID NOT NULL REFERENCES public.teacher_standards(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'not_started',
      evidence_url TEXT,
      evidence_storage_path TEXT,
      evidence_name TEXT,
      evidence_type TEXT,
      evidence_size INTEGER,
      evidence_uploaded_at TIMESTAMP WITH TIME ZONE,
      submitted_at TIMESTAMP WITH TIME ZONE,
      approved_at TIMESTAMP WITH TIME ZONE,
      approved_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT teacher_standard_progress_status_check CHECK (
        status IN ('not_started', 'in_progress', 'submitted', 'approved')
      )
    );

    COMMENT ON TABLE public.teacher_standard_progress IS 'Tracks teacher progress against each professional standard and associated evidence.';
    COMMENT ON COLUMN public.teacher_standard_progress.status IS 'Workflow status for the teacher''s progress (not_started, in_progress, submitted, approved).';
    COMMENT ON COLUMN public.teacher_standard_progress.evidence_url IS 'Public (or signed) URL to the uploaded evidence artifact.';
    COMMENT ON COLUMN public.teacher_standard_progress.evidence_storage_path IS 'Storage path reference for the evidence file.';

    CREATE TRIGGER update_teacher_standard_progress_updated_at
      BEFORE UPDATE ON public.teacher_standard_progress
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    ALTER TABLE public.teacher_standard_progress ENABLE ROW LEVEL SECURITY;
    BEGIN
      CREATE POLICY "Authenticated users can view standard progress"
        ON public.teacher_standard_progress FOR SELECT
        USING (auth.role() = 'authenticated');
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
    BEGIN
      CREATE POLICY "Authenticated users can insert standard progress"
        ON public.teacher_standard_progress FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
    BEGIN
      CREATE POLICY "Authenticated users can update standard progress"
        ON public.teacher_standard_progress FOR UPDATE
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'teacher_standard_progress'
      AND constraint_name = 'teacher_standard_progress_unique'
  ) THEN
    ALTER TABLE public.teacher_standard_progress
      ADD CONSTRAINT teacher_standard_progress_unique UNIQUE (teacher_id, standard_id);
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_standards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_standard_progress;
