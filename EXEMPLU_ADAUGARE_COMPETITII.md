# Exemplu Practic - Adăugarea Competițiilor și Întrebărilor

## 🎯 Obiectiv

Acest document oferă un ghid pas cu pas pentru adăugarea unei noi competiții și întrebări în sistemul FSP Navigator.

## 📝 Exemplu 1: Adăugarea unei Noi Competiții "Pediatrie Express"

### Pasul 1: Definirea Structurii Competiției

```javascript
// În LeaderboardModal.js, adaugă în setCompetitions
const newCompetition = {
  id: 4,
  title: "👶 Pediatrie Express",
  description: "Diagnosticuri rapide pentru cazuri pediatrice comune",
  participants: 0,
  timeLimit: 240, // 4 minute
  reward: "200 XP + Badge Pediatru",
  status: "starting",
  startsIn: "3h 00min",
  gameType: "pediatric_diagnosis",
  category: "medical_specialties"
};
```

### Pasul 2: Crearea Întrebărilor pentru Competiție

```javascript
// Adaugă în miniGamesData
const miniGamesData = {
  // ... existing games ...
  
  pediatric_diagnosis: {
    title: "👶 Pediatrie Express",
    timeLimit: 4, // 4 minute
    questions: [
      {
        question: "Copil de 2 ani prezintă febră de 39.5°C, iritabilitate, rigiditate cervicală și erupție petechială. Diagnostic cel mai probabil?",
        options: [
          "Meningită bacteriană",
          "Encefalită virală", 
          "Sepsis",
          "Convulsii febrile"
        ],
        correctAnswer: 0,
        difficulty: "intermediate",
        explanation: "Combinația febră + rigiditate cervicală + erupție petechială la copil mic sugerează meningită bacteriană - urgență medicală."
      },
      {
        question: "Nou-născut de 3 zile prezintă icter, letargie și refuzul alimentării. Bilirubina totală: 18 mg/dL. Ce investigație este prioritară?",
        options: [
          "Hemocultură",
          "Bilirubina directă/indirectă",
          "Ecografie abdominală",
          "Testul Coombs"
        ],
        correctAnswer: 1,
        difficulty: "advanced",
        explanation: "Icterul patologic la nou-născut necesită evaluarea tipului de bilirubinemie pentru diagnostic diferențial."
      },
      {
        question: "Copil de 6 luni cu tuse seacă nocturnă, stridor inspirator și febră subfebrilă. Diagnostic?",
        options: [
          "Pneumonie",
          "Laringită acută (crup)",
          "Bronșiolită",
          "Astm bronșic"
        ],
        correctAnswer: 1,
        difficulty: "beginner",
        explanation: "Stridor inspirator + tuse seacă nocturnă la sugar = laringită acută (crup viral)."
      },
      {
        question: "Copil de 4 ani cu durere abdominală periumbilicală, vărsături și febră. Durerea se mută în fosa iliacă dreaptă. Diagnostic?",
        options: [
          "Gastrită",
          "Apendicită acută",
          "Infecție urinară",
          "Constipație"
        ],
        correctAnswer: 1,
        difficulty: "intermediate",
        explanation: "Migrația durerii de la periumbilical la fosa iliacă dreaptă este patognomonică pentru apendicită."
      },
      {
        question: "Adolescent de 15 ani cu durere de gât, febră, ganglioni măriți cervical și oboseală severă. Testul rapid strep: negativ. Diagnostic?",
        options: [
          "Angină streptococică",
          "Mononucleoză infecțioasă",
          "Faringită virală",
          "Difterit"
        ],
        correctAnswer: 1,
        difficulty: "intermediate",
        explanation: "Triad: angină + adenopatii + oboseală la adolescent + strep test negativ = mononucleoză (EBV)."
      }
    ]
  }
};
```

### Pasul 3: Implementarea Logicii de Joc

```javascript
// În LeaderboardModal.js, actualizează funcția startMiniGame
const startMiniGame = (gameType) => {
  setActiveMiniGame(gameType);
  
  // Configurări specifice pentru jocul nou
  if (gameType === 'pediatric_diagnosis') {
    // Setează timpul pentru pediatrie
    setGameTimer(240); // 4 minute
    setDifficulty('mixed'); // Întrebări de diferite dificultăți
  }
};
```

## 📊 Exemplu 2: Adăugarea unei Competiții cu Imagini Medicale

### Pasul 1: Structura Competiției

```javascript
const radiologyCompetition = {
  id: 5,
  title: "📸 Radiologie Challenge",
  description: "Interpretează imagini radiologice și stabilește diagnosticul",
  participants: 0,
  timeLimit: 300, // 5 minute
  reward: "250 XP + Badge Radiolog",
  status: "upcoming",
  startsIn: "1h 30min",
  gameType: "radiology_images",
  category: "diagnostic_imaging"
};
```

### Pasul 2: Întrebări cu Imagini

```javascript
radiology_images: {
  title: "📸 Radiologie Challenge",
  timeLimit: 5, // 5 minute
  questions: [
    {
      type: "image",
      question: "Pacient de 65 ani cu durere toracică. Ce observi pe această radiografie pulmonară?",
      imageUrl: "/images/radiology/chest_xray_pneumonia.jpg",
      options: [
        "Pneumonie lobară dreaptă",
        "Pleurezie",
        "Pneumotorax",
        "Radiografie normală"
      ],
      correctAnswer: 0,
      difficulty: "intermediate",
      explanation: "Opacitate homogenă în lobul inferior drept, caracteristică pneumoniei lobare."
    },
    {
      type: "image",
      question: "Copil de 8 ani după traumatism. Identifică fractura pe această radiografie:",
      imageUrl: "/images/radiology/pediatric_fracture.jpg",
      options: [
        "Fractură completă radius",
        "Fractură în lemn verde",
        "Luxație",
        "Fără modificări patologice"
      ],
      correctAnswer: 1,
      difficulty: "beginner",
      explanation: "Fractura în lemn verde este tipică la copii - osul se îndoaie și se fisurează incomplet."
    }
  ]
}
```

### Pasul 3: Componenta pentru Afișarea Imaginilor

```javascript
// În InteractiveQuiz.js, adaugă suport pentru întrebări cu imagini
const renderQuestionContent = (question) => {
  if (question.type === 'image') {
    return (
      <div className="question-with-image">
        <div className="question-text mb-4">
          <h3 className="text-lg font-semibold">{question.question}</h3>
        </div>
        <div className="image-container mb-4">
          <img 
            src={question.imageUrl} 
            alt="Imagine medicală pentru diagnostic"
            className="max-w-full h-auto rounded-lg shadow-md"
            style={{ maxHeight: '400px' }}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="question-text">
      <h3 className="text-lg font-semibold">{question.question}</h3>
    </div>
  );
};
```

## 🎵 Exemplu 3: Competiție cu Sunet (Auscultație)

### Pasul 1: Definirea Competiției

```javascript
const auscultationCompetition = {
  id: 6,
  title: "🎵 Auscultație Challenge",
  description: "Identifică sunetele cardiace și respiratorii anormale",
  participants: 0,
  timeLimit: 180, // 3 minute
  reward: "300 XP + Badge Auscultator",
  status: "active",
  endsIn: "45min",
  gameType: "auscultation_sounds",
  category: "clinical_skills"
};
```

### Pasul 2: Întrebări cu Audio

```javascript
auscultation_sounds: {
  title: "🎵 Auscultație Challenge",
  timeLimit: 3, // 3 minute
  questions: [
    {
      type: "audio",
      question: "Pacient de 45 ani cu dispnee. Ce anomalie cardiacă auzi?",
      audioUrl: "/audio/heart_sounds/mitral_regurgitation.mp3",
      options: [
        "Suflul sistolic mitral",
        "Suflul diastolic aortic",
        "Galop S3",
        "Fricțiune pericardică"
      ],
      correctAnswer: 0,
      difficulty: "advanced",
      explanation: "Suflul sistolic apical care iradiază către axilă indică regurgitare mitrală."
    },
    {
      type: "audio",
      question: "Copil de 8 ani cu tuse. Ce auzi la auscultația pulmonară?",
      audioUrl: "/audio/lung_sounds/wheeze_asthma.mp3",
      options: [
        "Raluri crepitante",
        "Wheezing",
        "Stridor",
        "Sunet normal"
      ],
      correctAnswer: 1,
      difficulty: "intermediate",
      explanation: "Wheezing-ul este caracteristic pentru astmul bronșic și obstrucția căilor respiratorii."
    }
  ]
}
```

### Pasul 3: Player Audio în React

```javascript
// Componentă pentru redarea audio
const AudioPlayer = ({ audioUrl, isPlaying, onPlay, onPause }) => {
  const audioRef = useRef(null);

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying]);

  return (
    <div className="audio-player bg-gray-50 p-4 rounded-lg">
      <audio ref={audioRef} src={audioUrl} />
      <div className="flex items-center gap-4">
        <button
          onClick={isPlaying ? onPause : onPlay}
          className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700"
        >
          {isPlaying ? '⏸️ Pauză' : '▶️ Redă'}
        </button>
        <div className="text-sm text-gray-600">
          Ascultă înregistrarea și identifică sunetul anormal
        </div>
      </div>
    </div>
  );
};
```

## 🔄 Exemplu 4: Actualizarea Sistemului cu Noile Competiții

### Pasul 1: Actualizarea Listei de Competiții

```javascript
// În LeaderboardModal.js, actualizează useEffect
useEffect(() => {
  if (isOpen) {
    // ... existing code ...
    
    setCompetitions([
      // ... existing competitions ...
      {
        id: 4,
        title: "👶 Pediatrie Express",
        description: "Diagnosticuri rapide pentru cazuri pediatrice comune",
        participants: 12,
        timeLimit: 240,
        reward: "200 XP + Badge Pediatru",
        status: "starting",
        startsIn: "2h 15min"
      },
      {
        id: 5,
        title: "📸 Radiologie Challenge",
        description: "Interpretează imagini radiologice",
        participants: 8,
        timeLimit: 300,
        reward: "250 XP + Badge Radiolog",
        status: "upcoming",
        startsIn: "4h 00min"
      },
      {
        id: 6,
        title: "🎵 Auscultație Challenge",
        description: "Identifică sunetele anormale",
        participants: 15,
        timeLimit: 180,
        reward: "300 XP + Badge Auscultator",
        status: "active",
        endsIn: "1h 30min"
      }
    ]);
  }
}, [isOpen]);
```

### Pasul 2: Actualizarea Funcției startMiniGame

```javascript
const startMiniGame = (gameType) => {
  setActiveMiniGame(gameType);
  
  // Configurări specifice pentru fiecare tip de joc
  switch(gameType) {
    case 'fachbegriffe':
      setGameTimer(30); // 30 secunde
      break;
    case 'diagnostic':
      setGameTimer(null); // fără limită
      break;
    case 'pediatric_diagnosis':
      setGameTimer(240); // 4 minute
      break;
    case 'radiology_images':
      setGameTimer(300); // 5 minute
      break;
    case 'auscultation_sounds':
      setGameTimer(180); // 3 minute
      break;
    default:
      setGameTimer(60); // 1 minut implicit
  }
};
```

## 📱 Exemplu 5: Adăugarea Mini-Jocurilor în UI

### Pasul 1: Actualizarea Secțiunii Mini-Games

```javascript
// În LeaderboardModal.js, actualizează secțiunea Mini Games
<div className="mt-8">
  <h3 className="text-xl font-semibold text-gray-800 mb-4">Mini Jocuri Rapide</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    
    {/* Joc existent */}
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-2xl">⚡</div>
        <div>
          <h4 className="font-semibold">Fachbegriffe Flash</h4>
          <p className="text-sm text-gray-600">Quiz rapid 30 secunde</p>
        </div>
      </div>
      <button 
        onClick={() => startMiniGame('fachbegriffe')}
        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
      >
        Joacă Acum
      </button>
    </div>

    {/* Joc nou - Pediatrie */}
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-2xl">👶</div>
        <div>
          <h4 className="font-semibold">Pediatrie Express</h4>
          <p className="text-sm text-gray-600">Diagnosticuri pediatrice</p>
        </div>
      </div>
      <button 
        onClick={() => startMiniGame('pediatric_diagnosis')}
        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
      >
        Joacă Acum
      </button>
    </div>

    {/* Joc nou - Radiologie */}
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-2xl">📸</div>
        <div>
          <h4 className="font-semibold">Radiologie Challenge</h4>
          <p className="text-sm text-gray-600">Interpretează imagini</p>
        </div>
      </div>
      <button 
        onClick={() => startMiniGame('radiology_images')}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Joacă Acum
      </button>
    </div>

    {/* Joc nou - Auscultație */}
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-2xl">🎵</div>
        <div>
          <h4 className="font-semibold">Auscultație Challenge</h4>
          <p className="text-sm text-gray-600">Identifică sunetele</p>
        </div>
      </div>
      <button 
        onClick={() => startMiniGame('auscultation_sounds')}
        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
      >
        Joacă Acum
      </button>
    </div>

  </div>
</div>
```

## 🎯 Testarea Noilor Competiții

### Pasul 1: Testarea Manuală

```javascript
// Script de testare în consolă
const testCompetition = (gameType) => {
  console.log(`Testing ${gameType} competition...`);
  
  // Simulează răspunsuri
  const mockAnswers = [0, 1, 0, 1, 0]; // răspunsuri la întrebări
  const correctAnswers = mockAnswers.length;
  
  // Testează sistemul de puncte
  const result = gamificationManager.completeQuiz(5, correctAnswers);
  console.log('Points awarded:', result.points);
  console.log('Total XP:', result.totalPoints);
  
  return result;
};

// Testează toate competițiile noi
['pediatric_diagnosis', 'radiology_images', 'auscultation_sounds'].forEach(testCompetition);
```

### Pasul 2: Validarea Datelor

```javascript
// Funcție de validare pentru întrebări noi
const validateQuestion = (question) => {
  const errors = [];
  
  if (!question.question || question.question.length < 10) {
    errors.push('Întrebarea trebuie să aibă cel puțin 10 caractere');
  }
  
  if (!question.options || question.options.length !== 4) {
    errors.push('Trebuie să existe exact 4 opțiuni');
  }
  
  if (question.correctAnswer === undefined || question.correctAnswer < 0 || question.correctAnswer > 3) {
    errors.push('Răspunsul corect trebuie să fie între 0 și 3');
  }
  
  if (question.type === 'image' && !question.imageUrl) {
    errors.push('Întrebările cu imagini trebuie să aibă imageUrl');
  }
  
  if (question.type === 'audio' && !question.audioUrl) {
    errors.push('Întrebările cu audio trebuie să aibă audioUrl');
  }
  
  return errors;
};
```

## 🚀 Lansarea Noilor Competiții

### Pasul 1: Deployment Checklist

- [ ] Toate întrebările au fost validate
- [ ] Imaginile și fișierele audio sunt încărcate
- [ ] Testele automate trec
- [ ] UI-ul este responsive
- [ ] Sistemul de puncte funcționează corect
- [ ] Explicațiile sunt clare și corecte

### Pasul 2: Monitorizarea Post-Launch

```javascript
// Analytics pentru noile competiții
const trackCompetitionMetrics = (gameType, result) => {
  analytics.track('competition_completed', {
    gameType: gameType,
    score: result.correctAnswers,
    totalQuestions: result.totalQuestions,
    timeSpent: result.timeSpent,
    difficulty: result.difficulty
  });
};
```

---

Acest exemplu demonstrează cum să extinzi sistemul de competiții cu noi tipuri de jocuri, întrebări multimediale și funcționalități avansate. Fiecare nou joc adaugă o dimensiune unică la experiența educațională a utilizatorilor.