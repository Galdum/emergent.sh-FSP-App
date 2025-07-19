// Competition Questions and Configuration
// This file contains the quiz questions and competition settings for the leaderboard

export const competitionQuestions = {
  fachbegriffe: {
    title: "Fachbegriffe Flash",
    description: "Test rapid de termeni medicali germani",
    questions: [
      {
        question: "Ce înseamnă 'Anamnese' în germană?",
        options: [
          "Istoricul medical al pacientului",
          "Examenul fizic",
          "Diagnosticul",
          "Tratamentul"
        ],
        correct: 0
      },
      {
        question: "Care este traducerea corectă pentru 'Blutdruck'?",
        options: [
          "Tensiunea arterială",
          "Frecvența cardiacă",
          "Temperatura",
          "Glicemia"
        ],
        correct: 0
      },
      {
        question: "Ce înseamnă 'Herzinfarkt'?",
        options: [
          "Accident vascular cerebral",
          "Infarct miocardic",
          "Angină pectorală",
          "Aritmie"
        ],
        correct: 1
      },
      {
        question: "Care este termenul german pentru 'diabet'?",
        options: [
          "Diabetes",
          "Zuckerkrankheit",
          "Beide sunt corecte",
          "Niciunul"
        ],
        correct: 2
      },
      {
        question: "Ce înseamnă 'Schlaganfall'?",
        options: [
          "Infarct miocardic",
          "Accident vascular cerebral",
          "Epilepsie",
          "Migrenă"
        ],
        correct: 1
      }
    ]
  },
  diagnostic: {
    title: "Diagnostic Express",
    description: "Ghicește diagnosticul corect",
    questions: [
      {
        question: "Pacient cu durere în piept, dispnee și transpirație. Care este cel mai probabil diagnostic?",
        options: [
          "Infarct miocardic",
          "Pneumonie",
          "Gastrită",
          "Anxietate"
        ],
        correct: 0
      },
      {
        question: "Pacient cu cefalee intensă, fotofobie și rigiditate nucală. Care este diagnosticul?",
        options: [
          "Migrenă",
          "Meningită",
          "Hipertensiune",
          "Tumoră cerebrală"
        ],
        correct: 1
      },
      {
        question: "Pacient cu febră, tuse productivă și dispnee. Care este diagnosticul?",
        options: [
          "Bronșită acută",
          "Pneumonie",
          "Astm",
          "Tuberculoză"
        ],
        correct: 1
      }
    ]
  },
  grammar: {
    title: "Gramatică Germană",
    description: "Test rapid de gramatică germană",
    questions: [
      {
        question: "Care este forma corectă: 'Ich ___ Arzt'?",
        options: [
          "bin",
          "bist",
          "ist",
          "sind"
        ],
        correct: 0
      },
      {
        question: "Care este articolul corect pentru 'Krankenhaus'?",
        options: [
          "der",
          "die",
          "das",
          "den"
        ],
        correct: 2
      },
      {
        question: "Care este forma corectă: 'Ich gehe ___ Krankenhaus'?",
        options: [
          "zu",
          "in",
          "nach",
          "auf"
        ],
        correct: 1
      }
    ]
  }
};

export const competitionConfig = {
  competitions: [
    {
      id: 1,
      title: "Fachbegriffe Challenge",
      description: "Concurs rapid de termeni medicali germani",
      gameType: "fachbegriffe",
      status: "active",
      participants: 45,
      timeLimit: 30,
      reward: "50 XP",
      endsIn: "2h 15m",
      minScore: 4,
      bonusPoints: 25
    },
    {
      id: 2,
      title: "Diagnostic Master",
      description: "Testează-ți abilitățile de diagnostic",
      gameType: "diagnostic",
      status: "active",
      participants: 32,
      timeLimit: 45,
      reward: "75 XP",
      endsIn: "1h 30m",
      minScore: 2,
      bonusPoints: 35
    },
    {
      id: 3,
      title: "Grammar Sprint",
      description: "Quiz rapid de gramatică germană",
      gameType: "grammar",
      status: "starting_soon",
      participants: 28,
      timeLimit: 60,
      reward: "40 XP",
      startsIn: "30m",
      minScore: 2,
      bonusPoints: 20
    }
  ]
};