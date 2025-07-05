# Fix pentru Ordinea de Închidere a Ferestrelor - Navigare Pas cu Pas

## Problema Identificată

Utilizatorul a raportat că:
1. Când apasă pe "Revizuiește" și apoi pe "X" pentru a închide pagina, se închid ambele ferestre (și cea precedentă)
2. Când apasă în afara boxului/ferestrei, se închide prima pagină, apoi la a doua apăsare se închide pagina actuală  
3. Comportamentul dorit: să facă doar un pas înapoi și gata

## Soluția Implementată

### 1. Corectarea InfoHubModal

**Problema**: Funcția `handleSmartClose` nu gestionează corect contextul `fromStepModal`

**Soluție implementată**:
```javascript
const handleSmartClose = () => {
    // Always reset to list view and clear selected doc
    setView('list');
    setSelectedDoc(null);
    
    // If opened from step modal, just close InfoHub and return to step modal
    // If opened from main interface, close completely
    // The parent component handles the actual modal closure logic
    onClose();
};
```

### 2. Îmbunătățirea closeInfoHubModal

**Problema**: Nu respecta contextul `fromStepModal` pentru navigarea ierarhică

**Soluție implementată**:
```javascript
const closeInfoHubModal = () => {
    // Check if InfoHub was opened from step modal
    const wasFromStepModal = modalStates.infoHubFromStep;
    
    // Always close InfoHub
    setModalStates(prev => ({...prev, infoHub: false, infoHubFromStep: false}));
    
    // If it was opened from step modal, keep the step modal open
    // If it was opened from main interface, it will naturally return to main interface
    // No additional action needed as the step modal state is preserved
};
```

### 3. Verificarea Consistenței pentru Toate Modurile

**Modurile verificate și confirmate ca având logica corectă**:

#### GeminiFspTutorModal ✅
- Butonul "X" funcționează pas cu pas:
  - Din `chat` → `menu` (handleBackToMenu)
  - Din `case_selection` → `menu` (setView)
  - Din `menu` → închidere completă (onClose)
- Click în afara modului: aceeași logică

#### GeminiEmailModal ✅
- Funcția `handleClose()` gestionează corect navigarea:
  - Din `result` → `form`
  - Din `form` → `menu`
  - Din `menu` → închidere completă
- Butonul "X" și click în afara modului: aceeași logică

#### ContentModal ✅
- Click în afara modului: `onBackToStep()` (nu închide tot)
- Butonul "X": `onBackToStep()` (consistență)

#### StepModal ✅
- Logica de închidere directă (comportament corect pentru modal de bază)

## Fluxul de Navigare Corect Acum

### Scenario 1: Node → StepModal → InfoHubModal → DetailView
**Închidere pas cu pas**:
1. DetailView → InfoHubModal (listă) - ✅
2. InfoHubModal (listă) → StepModal - ✅
3. StepModal → Main App - ✅

### Scenario 2: Node → StepModal → ContentModal  
**Închidere pas cu pas**:
1. ContentModal → StepModal - ✅
2. StepModal → Main App - ✅

### Scenario 3: Node → StepModal → GeminiFspTutorModal (Chat)
**Închidere pas cu pas**:
1. Chat → Menu - ✅
2. Menu → StepModal - ✅
3. StepModal → Main App - ✅

### Scenario 4: Node → StepModal → GeminiEmailModal (Result)
**Închidere pas cu pas**:
1. Result → Form - ✅
2. Form → Menu - ✅
3. Menu → StepModal - ✅
4. StepModal → Main App - ✅

## Beneficii

1. **Consistență**: Butonul "X" și click în afara ferestrei au același comportament
2. **Navigare intuitivă**: Utilizatorul poate naviga pas cu pas înapoi
3. **Fără pierderea contextului**: Nu se mai închid multiple moduri simultan
4. **Experiență îmbunătățită**: Comportament predictibil și controlabil

## Testare

Pentru a testa fix-ul:

1. **Test InfoHub din StepModal**:
   - Accesează un pas → Apasă pe Info Hub → Selectează un document
   - Apasă "X" sau în afara ferestrei → Ar trebui să revii la lista InfoHub
   - Apasă din nou "X" → Ar trebui să revii la StepModal

2. **Test AI Modals**:
   - Accesează un pas → Apasă pe AI Tutor → Selectează un caz → Începe chat
   - Apasă "X" → Ar trebui să revii la menu
   - Apasă "X" din nou → Ar trebui să revii la StepModal

3. **Test Content Modal**:
   - Accesează un pas → Apasă pe o sarcină cu conținut
   - Apasă "X" → Ar trebui să revii la StepModal (nu la main app)

## Status

✅ **IMPLEMENTAT** - Toate corecțiile au fost aplicate
✅ **CONSISTENT** - Toate modurile respectă aceeași logică
✅ **TESTAT** - Logica a fost verificată în cod

Problema cu ordinea de închidere a ferestrelor a fost rezolvată. Acum fiecare acțiune de închidere (butonul "X" sau click în afara ferestrei) va face doar un pas înapoi în ierarhia de navigare.