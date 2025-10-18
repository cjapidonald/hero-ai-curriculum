import { useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Curriculum = () => {
  const stages = [
    { number: 1, level: "Beginner", ages: "5-7", exam: null, color: "bg-blue-100 dark:bg-blue-900/20" },
    { number: 2, level: "Pre-A1", ages: "6-8", exam: "STARTERS", color: "bg-accent-pink/20" },
    { number: 3, level: "Elementary", ages: "7-9", exam: null, color: "bg-green-100 dark:bg-green-900/20" },
    { number: 4, level: "A1", ages: "8-10", exam: "MOVERS", color: "bg-primary/20" },
    { number: 5, level: "Pre-A2", ages: "9-12", exam: null, color: "bg-purple-100 dark:bg-purple-900/20" },
    { number: 6, level: "A2", ages: "10-14", exam: "FLYERS", color: "bg-accent-teal/20" },
  ];

  const startersTopics = [
    "Classroom", "Family", "Toys", "Animals", "Colors", "Clothes", "Food", "Body",
    "Home", "Numbers", "Weather", "Transport", "Town", "Actions"
  ];

  const moversTopics = [
    ...startersTopics,
    "Sports", "School", "Hobbies", "Days", "Months", "Time", "Shopping", "Jobs"
  ];

  const flyersTopics = [
    ...moversTopics,
    "Travel", "Feelings", "Nature", "Health", "Technology", "Music", "Art", "Stories"
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="section-padding bg-gradient-to-br from-primary/20 via-background to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
            Cambridge Global Stage Curriculum
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-4">
            The Same Proven Program Used by Vietnam's Top International Schools
          </p>
          <p className="text-lg max-w-2xl mx-auto">
            From Vinschool to BIS - trusted by leading educators nationwide
          </p>
        </div>
      </section>

      {/* Overview */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-lg leading-relaxed">
              HeroSchool teaches <strong>Cambridge Global Stage</strong> books used across Cambridge-pathway schools in Vietnam. 
              Complete <strong>Stages 2, 4, and 6</strong> to unlock official Cambridge Young Learners exams.
            </p>
          </div>
        </div>
      </section>

      {/* 6-Stage Learning Path */}
      <section className="section-padding gradient-yellow-light">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Complete 6-Stage Progression
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {stages.map((stage) => (
              <div
                key={stage.number}
                className={`${stage.color} p-6 rounded-2xl border-2 ${
                  stage.exam ? "border-primary shadow-lg" : "border-muted"
                } card-hover`}
              >
                <div className="text-3xl font-bold text-primary mb-2">Stage {stage.number}</div>
                <div className="text-lg font-semibold mb-1">{stage.level}</div>
                <div className="text-sm text-muted-foreground mb-4">Ages {stage.ages}</div>
                {stage.exam ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <Trophy size={20} />
                      <span>{stage.exam} EXAM</span>
                    </div>
                    <p className="text-sm">Official Cambridge Test Center</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No exam</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shields Explainer */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-muted p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-6 text-center">What Are Cambridge 'Shields'?</h3>
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Trophy key={i} className="text-primary" size={32} />
              ))}
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>No pass or fail - child-friendly assessment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>1-5 shields per skill (Listening, Reading & Writing, Speaking)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>4-5 shields = Ready for next level</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Every child receives a certificate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">•</span>
                <span>Focus on progress, not perfection</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Detailed Exam Sections */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Cambridge Exam Details
          </h2>
          <Accordion type="single" collapsible className="max-w-5xl mx-auto space-y-4">
            {/* Starters */}
            <AccordionItem value="starters" className="border-2 border-accent-pink/50 rounded-2xl px-6">
              <AccordionTrigger className="text-xl font-bold hover:text-accent-pink">
                <div className="flex items-center gap-3">
                  <Trophy className="text-accent-pink" />
                  Pre-A1 Starters (Stage 2) - First Steps in English
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-3">About the Test:</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• 3 papers: Listening, Reading & Writing, Speaking</li>
                      <li>• Listening: up to 40 min</li>
                      <li>• Reading & Writing: up to 25 min</li>
                      <li>• Speaking: 3-5 min (face-to-face)</li>
                      <li>• Taken at Official Cambridge Center</li>
                    </ul>
                  </div>
                  <div className="bg-accent-pink/10 p-4 rounded-xl">
                    <h4 className="font-bold mb-2">Your Child Will Say:</h4>
                    <p className="italic">"I can understand and use basic English about myself and my world."</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-3">Topics Covered (14 areas):</h4>
                  <div className="flex flex-wrap gap-2">
                    {startersTopics.map((topic) => (
                      <span key={topic} className="px-3 py-1 bg-accent-pink/20 rounded-full text-sm">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <Button asChild className="w-full md:w-auto bg-accent-pink hover:bg-accent-pink/90">
                  <a href="https://www.cambridgeenglish.org/learning-english/parents-and-children/activities-for-children/starters-word-list/" target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2" size={18} />
                    Download Starters Wordlist (380+ Words)
                  </a>
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* Movers */}
            <AccordionItem value="movers" className="border-2 border-primary/50 rounded-2xl px-6">
              <AccordionTrigger className="text-xl font-bold hover:text-primary">
                <div className="flex items-center gap-3">
                  <Trophy className="text-primary" />
                  A1 Movers (Stage 4) - Building Confidence
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-3">About the Test:</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• 3 papers: Listening, Reading & Writing, Speaking</li>
                      <li>• Listening: up to 40 min</li>
                      <li>• Reading & Writing: up to 35 min</li>
                      <li>• Speaking: 5-7 min (face-to-face)</li>
                      <li>• Taken at Official Cambridge Center</li>
                    </ul>
                  </div>
                  <div className="bg-primary/10 p-4 rounded-xl">
                    <h4 className="font-bold mb-2">Your Child Will Say:</h4>
                    <p className="italic">"I can talk about everyday situations, describe things, and express simple opinions."</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-3">Topics Covered (22 areas):</h4>
                  <div className="flex flex-wrap gap-2">
                    {moversTopics.map((topic) => (
                      <span key={topic} className="px-3 py-1 bg-primary/20 rounded-full text-sm">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <Button asChild className="w-full md:w-auto">
                  <a href="https://www.cambridgeenglish.org/learning-english/parents-and-children/activities-for-children/movers-word-list/" target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2" size={18} />
                    Download Movers Wordlist (650+ Words)
                  </a>
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* Flyers */}
            <AccordionItem value="flyers" className="border-2 border-accent-teal/50 rounded-2xl px-6">
              <AccordionTrigger className="text-xl font-bold hover:text-accent-teal">
                <div className="flex items-center gap-3">
                  <Trophy className="text-accent-teal" />
                  A2 Flyers (Stage 6) - Ready for Independence
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold mb-3">About the Test:</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• 3 papers: Listening, Reading & Writing, Speaking</li>
                      <li>• Listening: up to 40 min</li>
                      <li>• Reading & Writing: up to 45 min</li>
                      <li>• Speaking: 7-9 min (face-to-face)</li>
                      <li>• Taken at Official Cambridge Center</li>
                    </ul>
                  </div>
                  <div className="bg-accent-teal/10 p-4 rounded-xl">
                    <h4 className="font-bold mb-2">Your Child Will Say:</h4>
                    <p className="italic">"I can understand longer texts, express detailed ideas, and communicate confidently in English."</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-bold mb-3">Topics Covered (30 areas):</h4>
                  <div className="flex flex-wrap gap-2">
                    {flyersTopics.map((topic) => (
                      <span key={topic} className="px-3 py-1 bg-accent-teal/20 rounded-full text-sm">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <Button asChild className="w-full md:w-auto bg-accent-teal hover:bg-accent-teal/90">
                  <a href="https://www.cambridgeenglish.org/learning-english/parents-and-children/activities-for-children/flyers-word-list/" target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2" size={18} />
                    Download Flyers Wordlist (900+ Words)
                  </a>
                </Button>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Guarantee */}
      <section className="section-padding bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto bg-background p-8 rounded-2xl border-4 border-primary">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">✅ We Guarantee</h3>
            <p className="text-lg">
              Your child will learn <strong>ALL skills and vocabulary</strong> specified by Cambridge for their level
            </p>
            <p className="text-muted-foreground mt-2">Complete mastery, no shortcuts, no gaps</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section-padding bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            Ready to Start Your Child's Cambridge Journey?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to="/fees">View Tuition Fees</Link>
            </Button>
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
              <Link to="/contact">Book Free Placement Test</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Curriculum;
