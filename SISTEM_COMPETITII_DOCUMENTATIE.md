# Sistemul de Competiții - FSP Navigator

## 📋 Prezentare Generală

Sistemul de competiții din FSP Navigator este o platformă gamificată care permite medicilor să concureze într-un mediu educațional interactiv, îmbunătățind cunoștințele medicale în limba germană prin jocuri competitive.

## 🏗️ Arhitectura Sistemului

### 1. Componente Principale

#### Frontend (React)
- **LeaderboardModal.js** - Componenta principală pentru afișarea clasamentului și competițiilor
- **InteractiveQuiz.js** - Sistemul de quiz-uri interactive
- **gamificationManager.js** - Managerul de gamificare

#### Backend (FastAPI/Python)
- **models.py** - Modelele de date pentru utilizatori, progres, și gamificare
- **badges.py** - Sistemul de badge-uri și realizări
- **progress.py** - Monitorizarea progresului utilizatorilor

### 2. Tipuri de Competiții

#### A. Competiții Programate
```javascript
// Exemple de competiții active
{
  id: 1,
  title: "📚 Fachbegriffe Speed Challenge",
  description: "Cine răspunde mai repede la 10 termeni medicali aleatori",
  participants: 24,
  timeLimit: 60,
  reward: "150 XP + Badge Specialist",
  status: "active",
  endsIn: "2h 15min"
}
```

#### B. Mini-Jocuri Instant
```javascript
// Jocuri disponibile oricând
{
  fachbegriffe: {
    title: "⚡ Fachbegriffe Flash",
    timeLimit: 0.5, // 30 secunde
    questions: [...]
  },
  diagnostic: {
    title: "🔍 Diagnostic Express",
    timeLimit: null, // Fără limită
    questions: [...]
  }
}
```

## 🎮 Cum Funcționează Sistemul

### 1. Structura Clasamentului

#### Categorii de Ranking
- **Total XP** - Puncte totale acumulate
- **Step Progress** - Progresul în pașii FSP
- **FSP Cases** - Cazuri clinice rezolvate
- **Fachbegriffe** - Termeni medicali învățați
- **Gramatică** - Exerciții de gramatică completate

#### Afișarea Utilizatorilor
```javascript
{
  id: 1,
  name: "Dr. Maria Popescu",
  avatar: "👩‍⚕️",
  totalXP: 2450,
  rank: 1,
  streak: 12,
  country: "🇷🇴"
}
```

### 2. Sistemul de Puncte

#### Acțiuni și Puncte
- **Complete Task**: 10 puncte
- **Complete Step**: 50 puncte
- **Upload Document**: 15 puncte
- **AI Interaction**: 5 puncte
- **Quiz Correct**: 20 puncte
- **Quiz Perfect**: 100 puncte
- **Daily Login**: 5 puncte
- **Streak Bonus**: 25 puncte

#### Calculul Nivelelor
```javascript
calculateExperienceForLevel(level) {
  return Math.floor(100 * Math.pow(1.2, level - 1));
}
```

## 📊 Cum să Introduci Informații pentru Jocuri

### 1. Adăugarea Întrebărilor pentru Quiz-uri

#### Fachbegriffe (Termeni Medicali)
```javascript
const miniGamesData = {
  fachbegriffe: {
    title: "⚡ Fachbegriffe Flash",
    timeLimit: 0.5,
    questions: [
      {
        question: "Ce înseamnă 'Schmerzen' în română?",
        options: ["Dureri", "Febră", "Greață", "Amețeală"],
        correctAnswer: 0
      }
    ]
  }
};
```

#### Diagnostic (Cazuri Clinice)
```javascript
diagnostic: {
  title: "🔍 Diagnostic Express",
  timeLimit: null,
  questions: [
    {
      question: "Pacient de 45 ani, bărbat, prezintă durere toracică intensă...",
      options: ["Pneumonie", "Infarct miocardic acut", "Reflux gastroesofagian", "Anxietate"],
      correctAnswer: 1
    }
  ]
}
```

### 2. Configurarea Competițiilor

#### Crearea unei Competiții Noi
```javascript
const newCompetition = {
  id: 4,
  title: "🩺 Stetoscop Challenge",
  description: "Identifică sunetele cardiace anormale",
  participants: 0,
  timeLimit: 180,
  reward: "300 XP + Badge Cardiolog",
  status: "starting",
  startsIn: "2h 00min",
  gameType: "audio_recognition", // nou tip de joc
  questions: [
    {
      audioFile: "heart_murmur_1.mp3",
      question: "Ce anomalie cardiacă auzi?",
      options: ["Suflul sistolic", "Suflul diastolic", "Galop S3", "Fricțiune pericardică"],
      correctAnswer: 0
    }
  ]
};
```

### 3. Managementul Conținutului

#### Structura Bazei de Date
```python
# În models.py - pentru extinderea sistemului
class Competition(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    type: str  # "speed_challenge", "diagnostic", "vocabulary", etc.
    difficulty: str  # "beginner", "intermediate", "advanced"
    time_limit: Optional[int] = None  # în secunde
    max_participants: int = 100
    reward_xp: int
    reward_badge: Optional[str] = None
    start_time: datetime
    end_time: datetime
    questions: List[Dict[str, Any]]
    status: str = "upcoming"  # upcoming, active, finished
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

#### Adăugarea Întrebărilor prin API
```python
# În routes/competitions.py (nou fișier)
@app.post("/competitions/{competition_id}/questions")
async def add_question(
    competition_id: str,
    question_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    # Validare și adăugare întrebare
    pass
```

## 🛠️ Implementarea Tehnică

### 1. Adăugarea unei Noi Competiții

#### Pasul 1: Actualizarea Datelor
```javascript
// În LeaderboardModal.js
const addNewCompetition = (competitionData) => {
  setCompetitions(prev => [...prev, competitionData]);
};
```

#### Pasul 2: Crearea Logicii de Joc
```javascript
const startCompetition = (competition) => {
  setActiveCompetition(competition);
  
  // Inițializarea cronometrului
  if (competition.timeLimit) {
    startTimer(competition.timeLimit);
  }
  
  // Încărcarea întrebărilor
  loadQuestions(competition.gameType);
};
```

#### Pasul 3: Gestionarea Rezultatelor
```javascript
const handleCompetitionComplete = (results) => {
  // Calcularea scorului
  const score = calculateScore(results);
  
  // Actualizarea punctelor
  const gameResult = gamificationManager.completeQuiz(
    results.totalQuestions, 
    results.correctAnswers
  );
  
  // Salvarea rezultatelor
  saveCompetitionResult(competition.id, score, gameResult);
};
```

### 2. Tipuri de Întrebări Suportate

#### Întrebări Text
```javascript
{
  type: "text",
  question: "Ce înseamnă 'Atemnot'?",
  options: ["Durere de cap", "Dificultate în respirație", "Durere de stomac", "Febră"],
  correctAnswer: 1
}
```

#### Întrebări cu Imagini
```javascript
{
  type: "image",
  question: "Identifică structura anatomică marcată:",
  imageUrl: "/images/anatomy/heart_diagram.png",
  options: ["Aorta", "Vena cava", "Artera pulmonară", "Ventricul stâng"],
  correctAnswer: 0
}
```

#### Întrebări Audio
```javascript
{
  type: "audio",
  question: "Ce sunet cardiac auzi?",
  audioUrl: "/audio/heart_sounds/s1_s2_normal.mp3",
  options: ["S1-S2 normal", "Suflul sistolic", "Galop S3", "Fricțiune pericardică"],
  correctAnswer: 0
}
```

## 🎯 Strategii de Engagement

### 1. Recompense și Motivație
- **XP Points** - Puncte pentru progres
- **Badge-uri** - Realizări speciale
- **Streak Counters** - Activitate zilnică
- **Leaderboard** - Competiție socială

### 2. Dificultate Progresivă
- **Beginner** - Întrebări de bază A1-A2
- **Intermediate** - Întrebări medii B1-B2
- **Advanced** - Întrebări avansate C1-C2

### 3. Personalizare
- **Specializări** - Cardiologie, Neurologie, etc.
- **Regiuni** - Specificități ale fiecărui Bundesland
- **Preferințe** - Tipuri de jocuri preferate

## 🔧 Configurarea Administratorilor

### 1. Panel de Administrare
```javascript
// În AdminPanel.js
const CompetitionManager = () => {
  const [competitions, setCompetitions] = useState([]);
  const [questions, setQuestions] = useState([]);
  
  const createCompetition = (data) => {
    // Crearea competiției
  };
  
  const addQuestion = (competitionId, questionData) => {
    // Adăugarea întrebării
  };
  
  return (
    <div>
      <CompetitionForm onSubmit={createCompetition} />
      <QuestionBank questions={questions} />
    </div>
  );
};
```

### 2. Importul Masiv de Întrebări
```javascript
// Format CSV pentru import
const importQuestions = async (csvFile) => {
  const questions = await parseCSV(csvFile);
  // Format: question,option1,option2,option3,option4,correctAnswer,category,difficulty
  
  questions.forEach(q => {
    addQuestion(q.category, {
      question: q.question,
      options: [q.option1, q.option2, q.option3, q.option4],
      correctAnswer: parseInt(q.correctAnswer),
      difficulty: q.difficulty
    });
  });
};
```

## 📈 Monitorizarea și Analiza

### 1. Metrici de Performanță
- **Participare** - Numărul de utilizatori activi
- **Engagement** - Timpul petrecut în competiții
- **Progres** - Îmbunătățirea scorurilor
- **Retention** - Revenirea utilizatorilor

### 2. Rapoarte Statistice
```javascript
const getCompetitionStats = () => {
  return {
    totalParticipants: userCount,
    averageScore: calculateAverageScore(),
    completionRate: calculateCompletionRate(),
    mostPopularCategory: getMostPopularCategory(),
    peakParticipationTime: getPeakTimes()
  };
};
```

## 🚀 Planuri de Dezvoltare

### 1. Funcționalități Viitoare
- **Competiții în Echipă** - Colaborare între medici
- **Turnee** - Competiții pe mai multe runduri
- **Seasonale** - Competiții tematice
- **Integrare Video** - Întrebări cu înregistrări video

### 2. Îmbunătățiri Tehnice
- **Real-time Updates** - WebSockets pentru actualizări live
- **AI-Generated Questions** - Întrebări generate automat
- **Adaptive Difficulty** - Ajustarea dificultății pe baza performanței
- **Cross-platform** - Sincronizare între dispozitive

## 🔒 Considerații de Securitate

### 1. Prevenirea Fraudei
- **Time Validation** - Verificarea timpului de răspuns
- **Session Management** - Gestionarea sesiunilor de joc
- **IP Tracking** - Monitorizarea accesului
- **Answer Patterns** - Detectarea pattern-urilor suspecte

### 2. Protejarea Datelor
- **Encryption** - Criptarea datelor sensibile
- **Rate Limiting** - Limitarea cererilor
- **Audit Logs** - Jurnalizarea activității
- **GDPR Compliance** - Respectarea regulamentelor

---

Acest sistem de competiții oferă o platformă completă pentru educația medicală gamificată, permițând medicilor să învețe într-un mediu distractiv și competitiv, în timp ce se pregătesc pentru examenele FSP din Germania.