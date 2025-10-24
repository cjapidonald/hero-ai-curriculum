import { useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Curriculum = () => {
  const roadmapStages = [
    { number: 1, level: "Beginner", ages: "5-7", exam: null, color: "bg-blue-100 dark:bg-blue-900/20", position: "left" },
    { number: 2, level: "Pre-A1", ages: "6-8", exam: "STARTERS", color: "bg-accent-pink/20", position: "right" },
    { number: 3, level: "Elementary", ages: "7-9", exam: null, color: "bg-green-100 dark:bg-green-900/20", position: "left" },
    { number: 4, level: "A1", ages: "8-10", exam: "MOVERS", color: "bg-primary/20", position: "right" },
    { number: 5, level: "Pre-A2", ages: "9-12", exam: null, color: "bg-purple-100 dark:bg-purple-900/20", position: "left" },
    { number: 6, level: "A2", ages: "10-14", exam: "FLYERS", color: "bg-accent-teal/20", position: "right" },
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
      {/* Hero Section with Image */}
      <section className="relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-accent-pink/20 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-accent-teal/20 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />

        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1920&h=600&fit=crop"
            alt="Cambridge English learning books"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-background/80 to-background/90" />
        </div>

        {/* Content */}
        <div className="relative z-10 section-padding">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-block px-6 py-2 bg-primary/20 backdrop-blur-sm rounded-full mb-6 border border-primary/30 animate-fade-in">
              <span className="text-sm md:text-base font-semibold text-primary">Cambridge Authorized Learning Partner</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in bg-gradient-to-r from-primary via-accent-teal to-primary bg-clip-text text-transparent leading-tight">
              Cambridge Global Stage Curriculum
            </h1>

            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-xl md:text-3xl font-bold text-foreground leading-relaxed">
                The Same Proven Program Used by<br />
                <span className="text-primary">Vietnam's Top International Schools</span>
              </p>

              <p className="text-lg md:text-xl text-muted-foreground font-medium">
                From <span className="font-bold text-foreground">Vinschool</span> to <span className="font-bold text-foreground">BIS</span> - trusted by leading educators nationwide
              </p>

              <div className="pt-4 flex flex-wrap justify-center gap-3">
                {['Vinschool', 'BIS', 'UNIS', 'Australian International School'].map((school) => (
                  <span key={school} className="px-4 py-2 bg-background/80 backdrop-blur-sm rounded-lg text-sm font-medium border border-primary/20 shadow-sm">
                    {school}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview with Book Image */}
      <section className="section-padding bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Book Image */}
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary rounded-full" />
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent-teal rounded-full" />
                <div className="relative bg-background p-4 rounded-3xl shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&fit=crop"
                    alt="Cambridge Global English Stage 1 Book"
                    className="w-full h-auto rounded-xl"
                  />
                  <div className="text-center mt-4">
                    <p className="text-lg font-bold text-primary">Cambridge Global English</p>
                    <p className="text-muted-foreground">Stage 1 - Learner's Book</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-6">
                <div className="inline-block">
                  <Trophy className="w-16 h-16 text-primary mb-4" />
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-relaxed">
                  HeroSchool teaches <span className="text-primary underline decoration-2 underline-offset-4">Cambridge Global Stage</span> books used across Cambridge-pathway schools in Vietnam.
                </h2>

                <div className="h-1 w-24 bg-gradient-to-r from-primary to-accent-teal rounded-full"></div>

                <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed">
                  Complete <span className="font-bold text-primary">Stages 2, 4, and 6</span> to unlock official <span className="font-bold text-foreground">Cambridge Young Learners exams</span>.
                </p>

                <div className="grid grid-cols-3 gap-4 pt-6">
                  <div className="text-center p-4 bg-accent-pink/10 rounded-xl border border-accent-pink/20">
                    <div className="text-3xl font-bold text-accent-pink mb-1">Stage 2</div>
                    <div className="text-sm text-muted-foreground">Starters</div>
                  </div>
                  <div className="text-center p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <div className="text-3xl font-bold text-primary mb-1">Stage 4</div>
                    <div className="text-sm text-muted-foreground">Movers</div>
                  </div>
                  <div className="text-center p-4 bg-accent-teal/10 rounded-xl border border-accent-teal/20">
                    <div className="text-3xl font-bold text-accent-teal mb-1">Stage 6</div>
                    <div className="text-sm text-muted-foreground">Flyers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Study Path Roadmap */}
      <section className="section-padding gradient-yellow-light">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Study Path Roadmap
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto text-lg">
            Follow our structured learning path from beginner to advanced. Complete Stages 2, 4, and 6 to unlock official Cambridge Young Learners exams.
          </p>

          {/* Roadmap Timeline */}
          <div className="max-w-4xl mx-auto relative">
            {/* Vertical line connector */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent-teal to-accent-pink transform -translate-x-1/2 hidden md:block" />

            {roadmapStages.map((stage, index) => (
              <div key={stage.number} className={`relative mb-8 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                <div className={`flex flex-col md:flex-row items-center gap-6 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                  {/* Stage Card */}
                  <div className={`w-full md:w-5/12 ${stage.color} p-6 rounded-2xl border-2 ${
                    stage.exam ? "border-primary shadow-xl" : "border-muted shadow-lg"
                  } card-hover relative`}>
                    <div className="text-3xl font-bold text-primary mb-2">Stage {stage.number}</div>
                    <div className="text-xl font-semibold mb-1">{stage.level}</div>
                    <div className="text-sm text-muted-foreground mb-4">Ages {stage.ages}</div>
                    {stage.exam ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary font-bold">
                          <Trophy size={20} />
                          <span>{stage.exam} EXAM</span>
                        </div>
                        <p className="text-sm font-semibold">🎯 Official Cambridge Test Center</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Foundation building stage</p>
                    )}

                    {/* Decorative circle */}
                    {stage.exam && (
                      <div className={`absolute ${index % 2 === 0 ? '-right-3' : '-left-3'} -bottom-3 w-16 h-16 ${stage.color.replace('/20', '/40')} rounded-full border-4 border-background`} />
                    )}
                  </div>

                  {/* Center Dot */}
                  <div className="hidden md:block w-2/12 flex justify-center">
                    <div className={`w-6 h-6 rounded-full ${
                      stage.exam ? 'bg-primary ring-4 ring-primary/30' : 'bg-muted ring-4 ring-muted/30'
                    } z-10`} />
                  </div>

                  {/* Spacing for alternating layout */}
                  <div className="hidden md:block w-5/12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shields and Exam Structure - 2 Column Layout */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* What Are Cambridge 'Shields'? */}
            <div className="bg-muted p-8 rounded-2xl h-full">
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

            {/* Cambridge Exam Details */}
            <div className="bg-primary/10 p-8 rounded-2xl h-full">
              <h3 className="text-2xl font-bold mb-6 text-center">Cambridge Exam Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Trophy className="text-accent-pink flex-shrink-0 mt-1" size={24} />
                  <div>
                    <p className="font-bold text-accent-pink">Pre-A1 Starters (Stage 2)</p>
                    <p className="text-sm text-muted-foreground">First steps in English, ages 6-8</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Trophy className="text-primary flex-shrink-0 mt-1" size={24} />
                  <div>
                    <p className="font-bold text-primary">A1 Movers (Stage 4)</p>
                    <p className="text-sm text-muted-foreground">Building confidence, ages 8-10</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Trophy className="text-accent-teal flex-shrink-0 mt-1" size={24} />
                  <div>
                    <p className="font-bold text-accent-teal">A2 Flyers (Stage 6)</p>
                    <p className="text-sm text-muted-foreground">Ready for independence, ages 10-14</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-muted">
                  <h4 className="font-bold mb-3">All Exams Include:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Listening (up to 40 minutes)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Reading & Writing (25-45 minutes)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Speaking (3-9 minutes face-to-face)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>Taken at Official Cambridge Center</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Exam Sections (Accordion) */}
      <section className="section-padding bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Detailed Exam Breakdown
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
