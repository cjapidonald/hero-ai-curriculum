export const CLASSROOM_OBSERVATION_RUBRIC = [
  {
    "category": "PREREQUISITES",
    "criteria": [
      { "id": "1.1", "name": "Professionalism", "type": "yes_no" },
      { "id": "1.2", "name": "Safe Learning Environment", "type": "yes_no" },
      { "id": "1.3", "name": "Teacher's understanding of Safeguarding policy", "type": "yes_no" }
    ]
  },
  {
    "category": "PLANNING AND PREPARATION",
    "criteria": [
      {
        "id": "2.1",
        "name": "Learning objectives and success criteria",
        "type": "scale",
        "levels": {
          "1": "Learning objectives are general, not SMART and/or not accompanied by success criteria.",
          "2": "2 out of the following 5 criteria are satisfied: SMART, application of the ABCD model, effective use of Bloom's Taxonomy, connection to learning outcomes and clear, specific success criteria.",
          "3": "3 out of the following 5 criteria are satisfied: SMART, application of the ABCD model, effective use of Bloom's Taxonomy, connection to learning outcomes and clear, specific success criteria.",
          "4": "4 out of the following 5 criteria are satisfied: SMART, application of the ABCD model, effective use of Bloom's Taxonomy, connection to learning outcomes and clear, specific success criteria.",
          "5": "All the following 5 criteria are satisfied: SMART, application of the ABCD model, effective use of Bloom's Taxonomy, connection to learning outcomes and clear, specific success criteria."
        }
      },
      {
        "id": "2.2",
        "name": "Planning for differentiated instructions",
        "type": "scale",
        "levels": {
          "1": "There's no evidence of differientation in the lesson plan.",
          "2": "There's one method of differentiation in the plan but it does not seem achievable and does not help students achieve the lesson objective.",
          "3": "There's one method of differentiation in the plan, it seems achievable and might help students achieve the learning objective.",
          "4": "There's a variety of methods of differentiation in the plan that are proven to be effective, helping students achieve the learning objective.",
          "5": "There's a variety of methods of differentiation in the plan that are proven to be effective, helping students achieve the learning objective. The methods are outstanding and should be replicated."
        }
      }
    ]
  },
  {
    "category": "CLASSROOM MANAGEMENT",
    "criteria": [
      {
        "id": "3.1",
        "name": "Learning environment",
        "type": "scale",
        "levels": {
          "1": "The organisation and use of learning resources and equipment failed to facilitate learning activities.",
          "2": "The organisation and use of learning resources and equipment was generally appropriate, leading towards achieving the learning objectives. However, students were not provided with many opportunities to interact with peers or practice their knowledge and skills.",
          "3": "Students had opportunities to participate fully in the lesson by exploiting learning resources and equipment to practice their knowledge and skills and interact with the teacher and peers.",
          "4": "Students effectively used the learning resources and equipment to practice their knowledge and skills, interact with the teacher and peers, enhance their learning, and achieve the learning objectives.",
          "5": "The students effectively used and assisted the teacher in the organisation and use of learning resources and equipment. The organisation of the materials and learning environment promoted effective classroom interactions (teacher - students and students - students) in all learning activities and increasing lesson effectiveness."
        }
      },
      {
        "id": "3.2",
        "name": "Classroom procedures",
        "type": "scale",
        "levels": {
            "1": "There was no evidence of established classroom rules or routines. Classroom procedures such as time management, management of learning activities and materials, etc. were not in place. There was no effort to maintain whole-class discipline.",
            "2": "The teacher established clear classroom rules and some routines. Classroom procedures such as time management, management of learning activities and materials, etc. were in place and some students were able to follow them, however, there was not enough effort to maintain whole-class discipline.",
            "3": "The teacher established clear classroom rules and routines. Classroom procedures such as time management, management of learning activities and materials, etc. were clearly in place and many students followed them to ensure a well-disciplined classroom.",
            "4": "Students actively followed the classroom rules and procedures such as time management, management of learning activities and materials, etc. and independently contributed to the maintainence of a well-disciplined and effective lesson without needing much guidance or prompting from the teacher.",
            "5": "Students took ownership in the application and enforcement of classroom rules and procedures such as time management, management of learning activities and materials, etc. Together, they contributed to a well-disciplined, creative and effective lesson without teacher's guidance or prompting."
        }
      },
      {
        "id": "3.3",
        "name": "Building rapport",
        "type": "scale",
        "levels": {
            "1": "Classroom interactions, both teacher-students and students-students, were lacking. The teacher focused on delivering the content without an intent to build relationships with students. Some interactions both between teacher-students and students-students were unconstructive or negative.",
            "2": "Classroom interactions, both teacher-students and students-students, were generally appropriate but not always consistent. Occasionally, the teacher showed enjoyment in interacting with students but more effort should be put into building relationships. At times, some students showed disrespect to the teacher or to their peers. Interactions while not negative, did little to promote collaboration among students.",
            "3": "Classroom interactions, both teacher-students and students-students, were friendly and respectful. The teacher showed enjoyment in interacting with students, showing an interest in building positive relationships. The classroom atmosphere was harmonious, though some students showed a fear of taking risks and refrained from expressing their opinions.",
            "4": "Classroom interactions, both teacher-students and students-students, were friendly and respectful. The teacher actively engaged in reciprocal conversations about students' interests, building positive relationships. Students were comfortable taking risks, engaged in all activities, and expressed themselves.",
            "5": "The classroom atmosphere was consistently friendly and respectful, reflecting genuine warmth, caring and sensitivity to students' health, interests, perspectives, etc. as individuals. Creativity and a variety of approaches were used effectively to promote collaboration, interaction, and positive relationships. The good rapport created an atmosphere in which individuals and the whole class took intellectual risks in exploring knowledge."
        }
      },
      {
        "id": "3.4",
        "name": "Student behaviour",
        "type": "scale",
        "levels": {
            "1": "There appeared to be no established standards of conduct. Students either were not aware of them or challenged them. Attention was not given to student misbehaviors, hence no teacher monitoring or handling of misconduct. The teacher showed no awareness of students' emotional needs in situations that called for such attention.",
            "2": "Standards of conduct appeared to be in place and students were aware of them but challenged them. The teacher noticed student misbehaviors but failed to monitor them effectively, or responded in a repressive/disrespectful manner. The teacher showed an awareness of whole-class and/or individual students' emotional needs in situations that arose however did not actively provide support.",
            "3": "Students showed an awareness of the established standards, many conducted themselves appropriately but this was not consistent for the entire class. The teacher actively monitored student behavior and employed some effective strategies but with uneven results. The teacher actively supported whole-class and/or individual students' emotional needs when required however the approach created many interruptions to the lesson.",
            "4": "Student behaviors were entirely appropriate. The teacher actively monitored student behaviors and employed effective behavior management strategies. The teacher's responses were successful and respectful, producing consistent results. The teacher actively supported whole-class and/or individual students' emotional needs when required, the approach created some interruptions to the lesson but was overall effective.",
            "5": "Student behaviors were entirely appropriate. Students took an active role in monitoring their own behaviors and/or those of other students. Teacher monitoring of student behaviors was subtle and preventive. The teacher’s responses to student misbehaviors were respectful. The teacher effectively supported whole-class and/or individual students' emotional needs when required."
        }
      }
    ]
  },
  {
    "category": "INSTRUCTIONS",
    "criteria": [
      {
        "id": "4.1",
        "name": "Delivery of content",
        "type": "scale",
        "levels": {
            "1": "The teacher's explanation of the content was too academic and sometimes erroneous. Their spoken or written language was not entirely age appropriate. The teacher's delivery was one-way and ineffective.",
            "2": "The teacher’s explanation of the content was accurate but incomplete. Their spoken and written language was suitable for students but fragmented and unfocused. The teacher's delivery was monotonous and not engaging.",
            "3": "The teacher’s explanation of the content was accurate and complete but failed to connect with students’ experience. The teacher's spoken and written language was suitable for students but their delivery was monotonous and not engaging.",
            "4": "The teacher’s explanation of the content was accurate and complete but failed to connect with students’ experience. Their spoken and written language was suitable and their delivery was engaging.",
            "5": "The teacher’s explanation of the content was accurate and complete, and connected with students’ experience. Their spoken and written language was appropriate, concise and engaging. The teacher's delivery was creative and effective."
        }
      },
      {
        "id": "4.2",
        "name": "Enthusiasm, guidance, and student engagement",
        "type": "scale",
        "levels": {
            "1": "The teacher failed to ask any questions other than those in the textbook. The teacher could not engage students and failed to encourage them to contribute ideas during the lesson. The lesson lacked energy.",
            "2": "The teacher communicated the importance of the lesson but with little conviction. The teacher put in an effort to ask questions to arouse students' interest but this wasn't effective.",
            "3": "The teacher conveyed genuine enthusiasm for the content and asked prompting but not very challenging questions. The teacher organized activities with the goal of engaging students. Students demonstrated moderate interest in the content.",
            "4": "The teacher effectively guided students through the content and offered prompting, challenging questions that engaged students to actively participate during all stages of the lesson.",
            "5": "The teacher used creative and varied approaches to guide students through the content while providing prompting, challenging questions. All students demonstrated their engagement, curiosity and proactiveness during all stages of the lesson."
        }
      },
      {
        "id": "4.3",
        "name": "Assessment and feedback",
        "type": "scale",
        "levels": {
            "1": "Assessment procedures did not align with the learning objectives. Assessment criteria were in place but unclear and non-measurable. The teacher failed to provide students with effective feedback.",
            "2": "Assessment procedures partially aligned with the learning objectives. Assessment criteria were clear, but hard to measure. The teacher offered feedback to different groups of students but the level of effectiveness was not clear.",
            "3": "All the learning objectives were assessed with clear, specific criteria. The teacher offered effective feedback to different groups of students, motivating them while at the same time making it possible for them to identify the areas they could improve on.",
            "4": "All the learning objectives were assessed. Assessment was fully integrated into different stages of the lesson, through extensive use of assessment methods suitable for different objectives and groups of students. The teacher offered effective feedback to different groups of students, motivating them while at the same time making it possible for them to identify the areas they could improve on.",
            "5": "All the learning objectives were assessed. Assessment was fully integrated in different stages of the lesson, through extensive use of assessment methods suitable for different objectives and groups of students. The teacher offered effective feedback to different groups of students, motivating them while at the same time making it possible for them to identify the areas they could improve on. Most students could self-assess and monitor their own progress."
        }
      },
      {
        "id": "4.4",
        "name": "Differentiation and scaffolding",
        "type": "scale",
        "levels": {
            "1": "Content, teacher delivery, instructions, activities, etc. showed no differentiation for different groups of students.",
            "2": "Content, teacher delivery, instructions, activities showed some differentiation for different groups of students based on the teacher's prior understanding of their students' abilities.",
            "3": "Content, teacher delivery, instructions, activities and assessments were differentiated, as appropriate, for individual learners based on the teacher's prior understanding of their students' abilities.",
            "4": "Content, teacher delivery, instructions, activities, and assessments were differentiated, as appropriate, for individual learners based on the teacher's prior understanding of their students' abilities. The teacher identified the zone of proximal development (ZPD) of each individual/group learner for effective scaffolding during class.",
            "5": "Content, teacher delivery, instructions, activities, and assessments were differentiated, as appropriate, for individual learners based on the teacher's prior understanding of their students' abilities. The teacher identified the zone of proximal development (ZPD) of each individual/group for effective and diverse scaffolding before, during and after class."
        }
      }
    ]
  },
  {
    "category": "REVIEW AND CONSOLIDATION",
    "criteria": [
        {
            "id": "5.1",
            "name": "Summary of key content",
            "type": "scale",
            "levels": {
                "1": "There was no plenary to summarize the content or the teacher appeared to be only doing it to check a box. The activity did not relate to the learning objectives.",
                "2": "There was a plenary to summarize the content but it was teacher-centered and lacked student involvement. The activity did not relate to the learning objectives.",
                "3": "Students were encouraged to take part in the plenary to summarize content. While this activity referenced the learning objectives, it simply reviewed the content.",
                "4": "The teacher asked questions that allowed students to review and consolidate their own learning of the content, achieving the learning objectives.",
                "5": "The teacher guided students to review and consolidate their own learning of the content, with personalised appraisal of progress and learning. Students could relate the content to the learning objectives and outcomes."
            }
        },
        {
            "id": "5.2",
            "name": "Evaluation of achieving the learning objectives",
            "type": "scale",
            "levels": {
                "1": "The teacher could not provide feedback to the class on whether the lesson was effective or achieved its learning objectives, or the teacher profoundly misjudged the success of a lesson.",
                "2": "The teacher provided a generally accurate assessment of the lesson’s effectiveness and the extent to which the learning objectives were met. However the teacher could not offer students much insight or reference any evidence.",
                "3": "The teacher provided an accurate assessment of the lesson’s effectiveness and the extent to which the learning objectives were achieved and could cite some references to support the judgment.",
                "4": "The teacher provided an accurate assessment of the lesson’s effectiveness and the extent to which the learning objectives were achieved based on students' feedback and self-assessment.",
                "5": "The teacher made a thoughtful and accurate assessment of their lesson’s effectiveness and the extent to which the learning objectives were met based on students' feedback and self-assessment. In addition, the teacher gave suggestions to address issues to further achieve the learning objectives."
            }
        },
        {
            "id": "5.3",
            "name": "Follow-up activities (homework, further support, extension tasks, etc.)",
            "type": "scale",. 
            "levels": {
                "1": "The teacher finished the lesson without offering further guidance to students. Students did not receive instructions for any reflection activity or follow-up assignments.",
                "2": "The teacher offered students simple or irrelevant reflection activity or assignments. The teacher asked students to practice what they had learned at a basic level.",
                "3": "The teacher offered an assignment or activity that related to the lesson content and the learning objectives, there were different levels of difficulty. However, there was only one type of assignment.",
                "4": "The teacher offered students an appropriate choice of follow-up assignments, clearly differentiated by ability and achievable but challenging. Students received guidance individually or as a group.",
                "5": "The teacher gave a wide but appropriate choice of personalized follow-up tasks, related to the objectives of the lesson and oriented around students' interests to increase motivation."
            }
        }
    ]
  },
  {
      "category": "TEACHER'S REFLECTION",
      "criteria": [
          {
              "id": "6.1",
              "name": "Teacher's reflection of the lesson",
              "type": "scale",
              "levels": {
                  "1": "The teacher made an inaccurate assessment of their lesson's effectiveness.",
                  "2": "The teacher made a fairly accurate assessment of their lesson but still missed some important points.",
                  "3": "The teacher made a generally accurate assessment of their lesson.",
                  "4": "The teacher's assessment of their lesson was accurate. The teacher was able to provide reasons for some of the issues identified.",
                  "5": "The teacher's assessment of their lesson was accurate. The teacher was able to provide or justify reasons for some of the issues identified and suggest solutions."
              }
          },
          {
              "id": "6.2",
              "name": "Suggestions for improvement",
              "type": "scale",
              "levels": {
                  "1": "The teacher had no suggestions for how the lesson could be improved.",
                  "2": "The teacher made only general suggestions of how the lesson could be improved.",
                  "3": "The teacher made a few specific suggestions of what could be tried if the lesson was taught again.",
                  "4": "The teacher made specific suggestions of what could be tried if the lesson is taught again referencing how students could improve their academic performance.",
                  "5": "The teacher made excellent suggestions of what could be tried if the lesson was taught again, and specific strategies that could be employed to improve students' academic performance."
              }
          }
      ]
  },
  {
      "category": "BONUS POINT",
      "criteria": [
          {
              "id": "7.1",
              "name": "Material development on LMS and LMS usage (Teachers will get 2 bonus points if achieving this criteria)",
              "type": "bonus",
              "description": "- LMS was developed and employed to guide students through the self-study and practice processes. The content was engaging with differentiated materials meeting students' different abilities, interests, and learning pathways\n- The teacher encouraged students to use LMS as a useful tool throughout all learning stages. More than 80% of students completed required tasks before the lesson."
          }
      ]
  }
]
