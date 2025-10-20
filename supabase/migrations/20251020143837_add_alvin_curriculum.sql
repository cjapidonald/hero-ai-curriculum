-- =============================================
-- Add Alvin Curriculum
-- Teacher: Xhoana Strand
-- Subjects: English, Math, Science, Phonics
-- Stage: Stage 1 (Pre-A1 / Cambridge Starters equivalent)
-- =============================================

-- =============================================
-- 1. Create Teacher: Xhoana Strand
-- =============================================
INSERT INTO teachers (
  name,
  surname,
  email,
  password,
  subject,
  phone,
  bio,
  is_active
) VALUES (
  'Xhoana',
  'Strand',
  'xhoana.strand@heroschool.com',
  'teacher123',
  'English',
  '0981234599',
  'Specialized in Stage 1 Alvin curriculum - comprehensive English, Math, Science and Phonics instruction',
  true
)
ON CONFLICT (email) DO UPDATE
SET
  name = EXCLUDED.name,
  surname = EXCLUDED.surname,
  subject = EXCLUDED.subject,
  phone = EXCLUDED.phone,
  bio = EXCLUDED.bio,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- =============================================
-- 2. Create Alvin Class
-- =============================================
INSERT INTO classes (
  class_name,
  stage,
  teacher_name,
  max_students,
  classroom_location,
  is_active,
  start_date
)
SELECT
  'Alvin',
  'stage_1'::cambridge_stage,
  'Xhoana Strand',
  15,
  'Room A1',
  true,
  CURRENT_DATE
WHERE NOT EXISTS (
  SELECT 1 FROM classes WHERE class_name = 'Alvin'
);

-- =============================================
-- 3. Create Skills - ENGLISH LISTENING
-- =============================================

-- Listening for global meaning
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Lm.01', 'Understand main point of short talk', 'listening', 'Understand, with support, the main point of short talk.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Listening for detail
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Ld.01', 'Recognise simple words spelled out', 'listening', 'Recognise a limited range of simple words that are spelled out slowly and clearly.', ARRAY['stage_1']::cambridge_stage[], true),
('1Ld.02', 'Understand short simple instructions', 'listening', 'Understand, with support, a limited range of short, simple instructions.', ARRAY['stage_1']::cambridge_stage[], true),
('1Ld.03', 'Understand short simple questions', 'listening', 'Understand, with support, a limited range of short, simple questions which ask for simple information.', ARRAY['stage_1']::cambridge_stage[], true),
('1Ld.04', 'Deduce meaning from context', 'listening', 'Deduce meaning from context, with support, of a limited range of simple words.', ARRAY['stage_1']::cambridge_stage[], true),
('1Ld.05', 'Understand specific information in short talk', 'listening', 'Understand, with support, some specific information and detail of short talk.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 4. Create Skills - ENGLISH SPEAKING
-- =============================================

-- Communication
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Sc.01', 'Give basic information about themselves', 'speaking', 'Give basic information about themselves using simple words and phrases.', ARRAY['stage_1']::cambridge_stage[], true),
('1Sc.02', 'Describe people, places and objects', 'speaking', 'Describe people, places and objects, and routine actions and events, using simple words and phrases.', ARRAY['stage_1']::cambridge_stage[], true),
('1Sc.03', 'Ask simple questions', 'speaking', 'Ask simple questions about classroom routines and to find out a limited range of personal information and respond accordingly.', ARRAY['stage_1']::cambridge_stage[], true),
('1Sc.04', 'Reproduce sounds correctly', 'pronunciation', 'Reproduce correctly a limited range of sounds in simple, familiar words and phrases.', ARRAY['stage_1']::cambridge_stage[], true),
('1Sc.05', 'Produce short rehearsed phrases', 'speaking', 'Produce short, isolated, rehearsed phrases using gesture and signalled requests for help when necessary.', ARRAY['stage_1']::cambridge_stage[], true),
('1Sc.06', 'Use simple grammatical structures', 'grammar', 'Use a limited range of simple grammatical structures, allowing for frequent, basic mistakes.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Organisation
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Sor.01', 'Link words using connectives', 'grammar', 'Link, with support, words and phrases using basic connectives.', ARRAY['stage_1']::cambridge_stage[], true),
('1Sor.02', 'Take turns when speaking', 'social_skills', 'Take turns when speaking with others in a limited range of short, basic exchanges.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 5. Create Skills - ENGLISH WRITING
-- =============================================

-- Communicative achievement
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Wca.01', 'Write letters in straight line', 'writing', 'Write letters and words in a straight line from left to right.', ARRAY['stage_1']::cambridge_stage[], true),
('1Wca.02', 'Form upper and lower case letters', 'writing', 'Form upper and lower case letters.', ARRAY['stage_1']::cambridge_stage[], true),
('1Wca.03', 'Spell simple high-frequency words', 'writing', 'Spell some simple, high-frequency words accurately during guided writing activities.', ARRAY['stage_1']::cambridge_stage[], true),
('1Wca.04', 'Write familiar words', 'writing', 'Write familiar words.', ARRAY['stage_1']::cambridge_stage[], true),
('1Wca.05', 'Use simple grammatical structures in writing', 'writing', 'Begin to use a limited range of simple grammatical structures, allowing for frequent, basic mistakes.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Content
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Wc.01', 'Write words to give information', 'writing', 'Write, with support, words and short, simple phrases to give personal and factual information.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 6. Create Skills - ENGLISH READING
-- =============================================

-- Reading for detail
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Rd.01', 'Recognise and name letters', 'reading', 'Recognise, identify, sound and name the letters of the alphabet.', ARRAY['stage_1']::cambridge_stage[], true),
('1Rd.02', 'Blend sounds in words', 'reading', 'Recognise, identify and blend sounds in individual words.', ARRAY['stage_1']::cambridge_stage[], true),
('1Rd.03', 'Understand simple illustrated texts', 'reading', 'Understand, with support, simple words and phrases in short, simple, illustrated texts.', ARRAY['stage_1']::cambridge_stage[], true),
('1Rd.04', 'Deduce meaning by linking to pictures', 'reading', 'Begin to deduce the meaning of a limited range of simple, familiar words, with support, by linking them to pictures.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 7. Create Skills - ENGLISH USE OF ENGLISH (Grammar)
-- =============================================

-- Grammatical forms
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Ug.01', 'Use question words and structures', 'grammar', 'Use familiar question words and structures.', ARRAY['stage_1']::cambridge_stage[], true),
('1Ug.02', 'Use present simple forms', 'grammar', 'Use common present simple forms to give basic personal and factual information.', ARRAY['stage_1']::cambridge_stage[], true),
('1Ug.03', 'Use present continuous forms', 'grammar', 'Use common present continuous forms [positive, negative, question] to talk about present activities.', ARRAY['stage_1']::cambridge_stage[], true),
('1Ug.04', 'Use can/cannot describe ability', 'grammar', 'Use can/can''t to describe ability.', ARRAY['stage_1']::cambridge_stage[], true),
('1Ug.05', 'Use adjectives including colors', 'grammar', 'Use common adjectives, including colours, to say what someone/something is or has.', ARRAY['stage_1']::cambridge_stage[], true),
('1Ug.06', 'Use possessive adjectives', 'grammar', 'Use possessive adjectives to describe objects.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 8. Create Skills - ENGLISH USE OF ENGLISH (Vocabulary)
-- =============================================

-- Vocabulary
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Uv.01', 'Use cardinal numbers 1-20', 'vocabulary', 'Use cardinal numbers 120.', ARRAY['stage_1']::cambridge_stage[], true),
('1Uv.02', 'Use ordinal numbers 1st-10th', 'vocabulary', 'Use ordinal numbers 1st10th.', ARRAY['stage_1']::cambridge_stage[], true),
('1Uv.03', 'Use with and for', 'vocabulary', 'Use with to indicate accompaniment and for to indicate recipient.', ARRAY['stage_1']::cambridge_stage[], true),
('1Uv.04', 'Use prepositions of location', 'vocabulary', 'Use basic prepositions of location and position (e.g. at, in, near, next to, on) to describe where people and things are.', ARRAY['stage_1']::cambridge_stage[], true),
('1Uv.05', 'Use prepositions of time', 'vocabulary', 'Use prepositions of time (e.g. on, in) to talk about days and time.', ARRAY['stage_1']::cambridge_stage[], true),
('1Uv.06', 'Use adverbs of place', 'vocabulary', 'Use common adverbs of place (e.g. here, there) to indicate where things are.', ARRAY['stage_1']::cambridge_stage[], true),
('1Uv.07', 'Use nouns and proper nouns', 'vocabulary', 'Use common singular nouns, plural nouns [plural ''s''] and proper nouns to say what things are.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 9. Create Skills - ENGLISH USE OF ENGLISH (Sentence Structure)
-- =============================================

-- Sentence structure
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Us.01', 'Use articles a, the', 'grammar', 'Use articles a, the to refer to familiar objects.', ARRAY['stage_1']::cambridge_stage[], true),
('1Us.02', 'Use demonstrative pronouns', 'grammar', 'Use demonstrative pronouns this, these to indicate things.', ARRAY['stage_1']::cambridge_stage[], true),
('1Us.03', 'Use personal pronouns', 'grammar', 'Use common personal subject and object pronouns to give simple personal information.', ARRAY['stage_1']::cambridge_stage[], true),
('1Us.04', 'Use connective and', 'grammar', 'Use connective and to link words and phrases.', ARRAY['stage_1']::cambridge_stage[], true),
('1Us.05', 'Use like + verb + ing', 'grammar', 'Use like + verb + ing to express likes and dislikes.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 10. Create Skills - MATH NUMBER
-- =============================================

-- Counting and sequences
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Nc.01', 'Count objects 0-20', 'comprehension', 'Count objects from 0 to 20, recognising conservation of number and one-to-one correspondence.', ARRAY['stage_1']::cambridge_stage[], true),
('1Nc.02', 'Recognise familiar patterns up to 10', 'comprehension', 'Recognise the number of objects presented in familiar patterns up to 10, without counting.', ARRAY['stage_1']::cambridge_stage[], true),
('1Nc.03', 'Estimate number of objects', 'comprehension', 'Estimate the number of objects or people (up to 20), and check by counting.', ARRAY['stage_1']::cambridge_stage[], true),
('1Nc.04', 'Count on and back', 'comprehension', 'Count on in ones, twos or tens, and count back in ones and tens, starting from any number (from 0 to 20).', ARRAY['stage_1']::cambridge_stage[], true),
('1Nc.05', 'Understand even and odd numbers', 'comprehension', 'Understand even and odd numbers as ''every other number'' when counting (from 0 to 20).', ARRAY['stage_1']::cambridge_stage[], true),
('1Nc.06', 'Describe sequences of objects', 'comprehension', 'Use familiar language to describe sequences of objects.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Integers, powers and roots
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Ni.01', 'Read and write numbers 0-20', 'comprehension', 'Recite, read and write number names and whole numbers (from 0 to 20).', ARRAY['stage_1']::cambridge_stage[], true),
('1Ni.02', 'Understand addition', 'comprehension', 'Understand addition as counting on and combining two sets.', ARRAY['stage_1']::cambridge_stage[], true),
('1Ni.03', 'Understand subtraction', 'comprehension', 'Understand subtraction as: counting back, take away, difference.', ARRAY['stage_1']::cambridge_stage[], true),
('1Ni.04', 'Recognise complements of 10', 'comprehension', 'Recognise complements of 10.', ARRAY['stage_1']::cambridge_stage[], true),
('1Ni.05', 'Add and subtract numbers 0-20', 'comprehension', 'Estimate, add and subtract whole numbers (where the answer is from 0 to 20).', ARRAY['stage_1']::cambridge_stage[], true),
('1Ni.06', 'Know doubles up to double 10', 'comprehension', 'Know doubles up to double 10.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Money
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Nm.01', 'Recognise local currency', 'comprehension', 'Recognise money used in local currency.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Place value, ordering and rounding
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Np.01', 'Understand zero', 'comprehension', 'Understand that zero represents none of something.', ARRAY['stage_1']::cambridge_stage[], true),
('1Np.02', 'Compose and decompose numbers 10-20', 'comprehension', 'Compose, decompose and regroup numbers from 10 to 20.', ARRAY['stage_1']::cambridge_stage[], true),
('1Np.03', 'Compare and order numbers 0-20', 'comprehension', 'Understand the relative size of quantities to compare and order numbers from 0 to 20.', ARRAY['stage_1']::cambridge_stage[], true),
('1Np.04', 'Use ordinal numbers 1st-10th', 'comprehension', 'Recognise and use the ordinal numbers from 1st to 10th.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Fractions
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Nf.01', 'Understand equal and unequal parts', 'comprehension', 'Understand that an object or shape can be split into two equal parts or two unequal parts.', ARRAY['stage_1']::cambridge_stage[], true),
('1Nf.02', 'Understand half as one of two equal parts', 'comprehension', 'Understand that a half can describe one of two equal parts of a quantity or set of objects.', ARRAY['stage_1']::cambridge_stage[], true),
('1Nf.03', 'Understand half as operator', 'comprehension', 'Understand that a half can act as an operator (whole number answers).', ARRAY['stage_1']::cambridge_stage[], true),
('1Nf.04', 'Combine halves to make wholes', 'comprehension', 'Understand and visualise that halves can be combined to make wholes.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 11. Create Skills - MATH GEOMETRY AND MEASURE
-- =============================================

-- Time
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Gt.01', 'Describe units of time', 'comprehension', 'Use familiar language to describe units of time.', ARRAY['stage_1']::cambridge_stage[], true),
('1Gt.02', 'Know days and months', 'comprehension', 'Know the days of the week and the months of the year.', ARRAY['stage_1']::cambridge_stage[], true),
('1Gt.03', 'Recognise time to hour and half hour', 'comprehension', 'Recognise time to the hour and half hour.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Geometrical reasoning, shapes and measurements
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Gg.01', 'Identify and describe 2D shapes', 'comprehension', 'Identify, describe and sort 2D shapes by their characteristics or properties, including reference to number of sides and whether the sides are curved or straight.', ARRAY['stage_1']::cambridge_stage[], true),
('1Gg.02', 'Describe length', 'comprehension', 'Use familiar language to describe length, including long, longer, longest, thin, thinner, thinnest, short, shorter, shortest, tall, taller and tallest.', ARRAY['stage_1']::cambridge_stage[], true),
('1Gg.03', 'Identify and describe 3D shapes', 'comprehension', 'Identify, describe and sort 3D shapes by their properties, including reference to the number of faces, edges and whether faces are flat or curved.', ARRAY['stage_1']::cambridge_stage[], true),
('1Gg.04', 'Describe mass', 'comprehension', 'Use familiar language to describe mass, including heavy, light, less and more.', ARRAY['stage_1']::cambridge_stage[], true),
('1Gg.05', 'Describe capacity', 'comprehension', 'Use familiar language to describe capacity, including full, empty, less and more.', ARRAY['stage_1']::cambridge_stage[], true),
('1Gg.06', 'Differentiate between 2D and 3D shapes', 'comprehension', 'Differentiate between 2D and 3D shapes.', ARRAY['stage_1']::cambridge_stage[], true),
('1Gg.07', 'Identify shape rotation', 'comprehension', 'Identify when a shape looks identical as it rotates.', ARRAY['stage_1']::cambridge_stage[], true),
('1Gg.08', 'Use measuring instruments', 'comprehension', 'Explore instruments that have numbered scales, and select the most appropriate instrument to measure length, mass, capacity and temperature.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Position and Transformations
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Gp.01', 'Describe position and direction', 'comprehension', 'Use familiar language to describe position and direction.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 12. Create Skills - MATH STATISTICS AND PROBABILITY
-- =============================================

-- Statistics
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Ss.01', 'Answer non-statistical questions', 'comprehension', 'Answer non-statistical questions (categorical data).', ARRAY['stage_1']::cambridge_stage[], true),
('1Ss.02', 'Record and organise categorical data', 'comprehension', 'Record, organise and represent categorical data using: practical resources and drawings, lists and tables, Venn and Carroll diagrams, block graphs and pictograms.', ARRAY['stage_1']::cambridge_stage[], true),
('1Ss.03', 'Describe data using familiar language', 'comprehension', 'Describe data, using familiar language including reference to more, less, most or least to answer non-statistical questions and discuss conclusions.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 13. Create Skills - SCIENCE SCIENTIFIC ENQUIRY
-- =============================================

-- Purpose and planning
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1TWSp.01', 'Ask questions about the world', 'comprehension', 'Ask questions about the world around us and talk about how to find answers.', ARRAY['stage_1']::cambridge_stage[], true),
('1TWSp.02', 'Make predictions', 'comprehension', 'Make predictions about what they think will happen.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Carrying out scientific enquiry
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1TWSc.01', 'Sort and group objects', 'comprehension', 'Sort and group objects, materials and living things based on observations of the similarities and differences between them.', ARRAY['stage_1']::cambridge_stage[], true),
('1TWSc.02', 'Use equipment appropriately', 'comprehension', 'Use given equipment appropriately.', ARRAY['stage_1']::cambridge_stage[], true),
('1TWSc.03', 'Take measurements in non-standard units', 'comprehension', 'Take measurements in non-standard units.', ARRAY['stage_1']::cambridge_stage[], true),
('1TWSc.04', 'Follow instructions safely', 'comprehension', 'Follow instructions safely when doing practical work.', ARRAY['stage_1']::cambridge_stage[], true),
('1TWSc.05', 'Record observations and measurements', 'comprehension', 'Collect and record observations and/or measurements by annotating images and completing simple tables.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Analysis, evaluation and conclusions
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1TWSa.01', 'Describe what happened during enquiry', 'comprehension', 'Describe what happened during an enquiry and if it matched predictions.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 14. Create Skills - SCIENCE BIOLOGY
-- =============================================

-- Structure and function
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Bs.01', 'Recognise parts of flowering plants', 'comprehension', 'Recognise and name the major parts of familiar flowering plants (limited to roots, leaves, stems and flowers).', ARRAY['stage_1']::cambridge_stage[], true),
('1Bs.02', 'Identify the senses', 'comprehension', 'Identify the senses (limited to sight, hearing, taste, smell and touch) and what they detect, linking each to the correct body part.', ARRAY['stage_1']::cambridge_stage[], true),
('1Bs.03', 'Recognise parts of human body', 'comprehension', 'Recognise and name the major external parts of the human body.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Life processes
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Bp.01', 'Identify living things', 'comprehension', 'Identify living things and things that have never been alive.', ARRAY['stage_1']::cambridge_stage[], true),
('1Bp.02', 'Know animal needs', 'comprehension', 'Know that animals, including humans, need air, water and suitable food to survive.', ARRAY['stage_1']::cambridge_stage[], true),
('1Bp.03', 'Know plant needs', 'comprehension', 'Know that plants need light and water to survive.', ARRAY['stage_1']::cambridge_stage[], true),
('1Bp.04', 'Describe human similarities and differences', 'comprehension', 'Describe how humans are similar to and different from each other.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 15. Create Skills - SCIENCE CHEMISTRY
-- =============================================

-- Materials and their structure
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Cm.01', 'Identify and group common materials', 'comprehension', 'Identify, name, describe, sort and group common materials, including wood, plastic, metal, glass, rock, paper and fabric.', ARRAY['stage_1']::cambridge_stage[], true),
('1Cm.02', 'Understand object vs material', 'comprehension', 'Understand the difference between an object and a material.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Properties of materials
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Cp.01', 'Understand materials have properties', 'comprehension', 'Understand that all materials have a variety of properties.', ARRAY['stage_1']::cambridge_stage[], true),
('1Cp.02', 'Describe material properties', 'comprehension', 'Describe common materials in terms of their properties.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Changes to materials
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Cc.01', 'Describe material changes', 'comprehension', 'Describe how materials can be changed by physical action, e.g. stretching, compressing, bending and twisting.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 16. Create Skills - SCIENCE PHYSICS
-- =============================================

-- Forces and energy
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Pf.01', 'Describe movement of objects', 'comprehension', 'Explore, talk about and describe the movement of familiar objects.', ARRAY['stage_1']::cambridge_stage[], true),
('1Pf.02', 'Describe pushes and pulls as forces', 'comprehension', 'Describe pushes and pulls as forces.', ARRAY['stage_1']::cambridge_stage[], true),
('1Pf.03', 'Explore floating and sinking', 'comprehension', 'Explore that some objects float and some sink.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Light and sound
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Ps.01', 'Identify sources of sound', 'comprehension', 'Identify different sources of sound.', ARRAY['stage_1']::cambridge_stage[], true),
('1Ps.02', 'Understand sound travels and gets quieter', 'comprehension', 'Explore that as sound travels from a source it becomes quieter.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Electricity and magnetism
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1Pe.01', 'Identify things requiring electricity', 'comprehension', 'Identify things that require electricity to work.', ARRAY['stage_1']::cambridge_stage[], true),
('1Pe.02', 'Explore magnets and materials', 'comprehension', 'Explore, talk about and describe what happens when magnets approach and touch different materials.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 17. Create Skills - SCIENCE EARTH AND SPACE
-- =============================================

-- Planet earth
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1ESp.01', 'Know Earth is mostly water', 'comprehension', 'Know that Earth is mostly covered in water.', ARRAY['stage_1']::cambridge_stage[], true),
('1ESp.02', 'Describe land composition', 'comprehension', 'Describe land as being made of rock and soil.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- Earth in space
INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1ESs.01', 'Know Earth is our planet', 'comprehension', 'Know that Earth is the planet on which we live.', ARRAY['stage_1']::cambridge_stage[], true),
('1ESs.02', 'Describe the Sun', 'comprehension', 'Describe the Sun as a source of heat and light, and as one of many stars.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 18. Create Skills - SCIENCE IN CONTEXT
-- =============================================

INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('1SIC.01', 'Understand science knowledge changes', 'comprehension', 'Talk about how some of the scientific knowledge and thinking now was different in the past.', ARRAY['stage_1']::cambridge_stage[], true),
('1SIC.02', 'Understand how science explains objects', 'comprehension', 'Talk about how science explains how objects they use, or know about, work.', ARRAY['stage_1']::cambridge_stage[], true),
('1SIC.03', 'Know everyone uses science', 'comprehension', 'Know that everyone uses science and identify people who use science professionally.', ARRAY['stage_1']::cambridge_stage[], true),
('1SIC.04', 'Understand science helps us', 'comprehension', 'Talk about how science helps us understand our effect on the world around us.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- 19. Create Skills - PHONICS
-- =============================================

INSERT INTO skills (skill_code, skill_name, category, description, target_stage, is_active) VALUES
('PH1.BASE', 'Phonics Phase 1 Baseline', 'pronunciation', 'Complete Phase 1 baseline assessment - environmental sounds, rhythm and rhyme, alliteration, voice sounds, oral blending and segmenting.', ARRAY['stage_1']::cambridge_stage[], true),
('PH2.A1', 'Phonics Phase 2 Assessment 1st attempt', 'pronunciation', 'Phase 2 assessment covering: s, a, t, p, i, n, m, d, g, o, c, k, ck, e, u, r, h, b, f, ff, l, ll, ss.', ARRAY['stage_1']::cambridge_stage[], true),
('PH2.A2', 'Phonics Phase 2 Assessment 2nd attempt', 'pronunciation', 'Phase 2 assessment (retake) covering: s, a, t, p, i, n, m, d, g, o, c, k, ck, e, u, r, h, b, f, ff, l, ll, ss.', ARRAY['stage_1']::cambridge_stage[], true),
('PH2.A3', 'Phonics Phase 2 Assessment 3rd attempt', 'pronunciation', 'Phase 2 assessment (final retake) covering: s, a, t, p, i, n, m, d, g, o, c, k, ck, e, u, r, h, b, f, ff, l, ll, ss.', ARRAY['stage_1']::cambridge_stage[], true),
('PH3.A1', 'Phonics Phase 3 Assessment 1st attempt', 'pronunciation', 'Phase 3 assessment covering: j, v, w, x, y, z, zz, qu, ch, sh, th, ng, ai, ee, igh, oa, oo, ar, or, ur, ow, oi, ear, air, ure, er.', ARRAY['stage_1']::cambridge_stage[], true),
('PH3.A2', 'Phonics Phase 3 Assessment 2nd attempt', 'pronunciation', 'Phase 3 assessment (retake) covering: j, v, w, x, y, z, zz, qu, ch, sh, th, ng, ai, ee, igh, oa, oo, ar, or, ur, ow, oi, ear, air, ure, er.', ARRAY['stage_1']::cambridge_stage[], true),
('PH3.A3', 'Phonics Phase 3 Assessment 3rd attempt', 'pronunciation', 'Phase 3 assessment (final retake) covering: j, v, w, x, y, z, zz, qu, ch, sh, th, ng, ai, ee, igh, oa, oo, ar, or, ur, ow, oi, ear, air, ure, er.', ARRAY['stage_1']::cambridge_stage[], true)
ON CONFLICT (skill_code) DO NOTHING;

-- =============================================
-- SUMMARY
-- =============================================
-- Total Skills Added: 131 skills
-- - English Listening: 6 skills
-- - English Speaking: 8 skills
-- - English Writing: 6 skills
-- - English Reading: 4 skills
-- - English Use of English: 19 skills
-- - Math: 32 skills
-- - Science: 49 skills
-- - Phonics: 7 skills
--
-- Teacher: Xhoana Strand (xhoana.strand@heroschool.com)
-- Class: Alvin (Stage 1, Pre-A1)
-- =============================================
