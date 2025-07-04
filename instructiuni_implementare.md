# Instrucțiuni Pas cu Pas: Implementarea Sistemului FSP RAG

## Pasul 1: Pregătirea Mediului

### 1.1 Instalarea Dependențelor
```bash
# Creează un mediu virtual
python -m venv fsp_rag_env
source fsp_rag_env/bin/activate  # Pe Windows: fsp_rag_env\Scripts\activate

# Instalează dependențele
pip install langchain
pip install openai
pip install pinecone-client
pip install sentence-transformers
pip install flask
pip install PyPDF2
```

### 1.2 Configurarea API Keys
```bash
# Creează fișierul .env
touch .env

# Adaugă în .env:
OPENAI_API_KEY=your-openai-api-key-here
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_ENV=your-pinecone-environment-here
```

**Cum obții API keys:**
1. **OpenAI**: Mergi la https://platform.openai.com/api-keys
2. **Pinecone**: Mergi la https://app.pinecone.io/ și creează un cont gratuit

---

## Pasul 2: Pregătirea Documentelor FSP

### 2.1 Crearea Structurii de Directoare
```bash
mkdir fsp_project
cd fsp_project
mkdir fsp_documents
mkdir templates
```

### 2.2 Adăugarea Documentelor FSP
Pune toate documentele FSP în directorul `fsp_documents/`:
- Fișiere PDF cu teoria FSP
- Documente TXT cu ghiduri clinice
- Studii de caz FSP
- Glosare cu termeni tehnici

**Exemplu de structură:**
```
fsp_documents/
├── teoria_fsp.pdf
├── ghid_interventii.pdf
├── cazuri_clinice.pdf
├── termeni_tehnici.txt
└── fachbegriffe.txt
```

---

## Pasul 3: Implementarea Rapidă

### 3.1 Copierea Codului de Bază
```python
# config.py
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")
```

### 3.2 Rularea Prototipului
```python
# main.py
from prototip_fsp_rag import FSPRAGSystem, FSPDocumentProcessor
import config

# Creează documente de exemplu (dacă nu ai documente proprii)
FSPDocumentProcessor.create_sample_fsp_documents()

# Inițializează sistemul
fsp_rag = FSPRAGSystem(
    openai_api_key=config.OPENAI_API_KEY,
    pinecone_api_key=config.PINECONE_API_KEY,
    pinecone_env=config.PINECONE_ENV
)

# Încarcă documentele
documents = fsp_rag.load_fsp_documents("./fsp_documents")

# Creează baza de cunoștințe
fsp_rag.create_knowledge_base(documents)

# Configurează sistemul QA
fsp_rag.setup_qa_chain()

# Testează sistemul
result = fsp_rag.ask_fsp_question("Ce este Family Systems Perspective?")
print(f"Răspuns: {result['answer']}")
```

---

## Pasul 4: Testarea Sistemului

### 4.1 Întrebări de Test
```python
# test_fsp_rag.py
def test_fsp_system():
    # Întrebări de test
    test_questions = [
        "Ce este circularitatea în FSP?",
        "Care sunt principalele Fachbegriffe în FSP?",
        "Cum se aplică genograma în terapia familială?",
        "Explică conceptul de homeostază în sistemele familiale"
    ]
    
    for question in test_questions:
        result = fsp_rag.ask_fsp_question(question)
        print(f"Întrebare: {question}")
        print(f"Răspuns: {result['answer']}")
        print(f"Încredere: {result['confidence']:.2f}")
        print("-" * 50)

# Testarea generării de cazuri
def test_case_generation():
    context = "Familie cu copil de 8 ani cu probleme de atenție, părinți stresați"
    case = fsp_rag.generate_fsp_case(context)
    print(f"Caz generat: {case['answer']}")
```

### 4.2 Evaluarea Performanței
```python
# evaluate_performance.py
def evaluate_fsp_responses():
    # Evaluează calitatea răspunsurilor
    metrics = {
        'accuracy': 0.0,
        'completeness': 0.0,
        'clinical_relevance': 0.0,
        'terminology_usage': 0.0
    }
    
    # Implementează logica de evaluare
    return metrics
```

---

## Pasul 5: Interfața Web (Opțional)

### 5.1 Crearea Aplicației Flask
```python
# app.py
from flask import Flask, render_template, request, jsonify
from prototip_fsp_rag import FSPRAGSystem
import config

app = Flask(__name__)

# Inițializează sistemul FSP RAG
fsp_rag = FSPRAGSystem(
    openai_api_key=config.OPENAI_API_KEY,
    pinecone_api_key=config.PINECONE_API_KEY,
    pinecone_env=config.PINECONE_ENV
)

# Configurează sistemul (fă asta o dată)
documents = fsp_rag.load_fsp_documents("./fsp_documents")
fsp_rag.create_knowledge_base(documents)
fsp_rag.setup_qa_chain()

@app.route('/')
def index():
    return render_template('fsp_interface.html')

@app.route('/ask', methods=['POST'])
def ask_question():
    data = request.json
    question = data.get('question', '')
    
    result = fsp_rag.ask_fsp_question(question)
    return jsonify(result)

@app.route('/generate-case', methods=['POST'])
def generate_case():
    data = request.json
    context = data.get('context', '')
    
    case = fsp_rag.generate_fsp_case(context)
    return jsonify(case)

if __name__ == '__main__':
    app.run(debug=True)
```

### 5.2 Template HTML
```html
<!-- templates/fsp_interface.html -->
<!DOCTYPE html>
<html>
<head>
    <title>FSP AI Assistant</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .chat-box { border: 1px solid #ccc; padding: 20px; margin: 20px 0; min-height: 400px; }
        .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .user-message { background-color: #e3f2fd; }
        .ai-message { background-color: #f3e5f5; }
        .input-area { margin-top: 20px; }
        input[type="text"] { width: 70%; padding: 10px; }
        button { padding: 10px 20px; margin: 5px; }
        .confidence { color: #666; font-size: 0.8em; }
        .sources { background-color: #fff3e0; padding: 10px; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>FSP AI Assistant</h1>
        <div class="chat-box" id="chat-box"></div>
        
        <div class="input-area">
            <input type="text" id="question-input" placeholder="Întreabă despre FSP..." />
            <button onclick="askQuestion()">Întreabă</button>
            <button onclick="generateCase()">Generează Caz</button>
        </div>
        
        <div class="input-area">
            <input type="text" id="context-input" placeholder="Context pentru caz medical..." />
        </div>
    </div>

    <script>
        function addMessage(message, type, confidence = null, sources = null) {
            const chatBox = document.getElementById('chat-box');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}-message`;
            
            let content = message;
            if (confidence !== null) {
                content += `<div class="confidence">Încredere: ${(confidence * 100).toFixed(1)}%</div>`;
            }
            if (sources && sources.length > 0) {
                content += `<div class="sources">Surse: ${sources.length} documente</div>`;
            }
            
            messageDiv.innerHTML = content;
            chatBox.appendChild(messageDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
        
        async function askQuestion() {
            const question = document.getElementById('question-input').value;
            if (!question.trim()) return;
            
            addMessage(question, 'user');
            
            try {
                const response = await fetch('/ask', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({question: question})
                });
                
                const data = await response.json();
                addMessage(data.answer, 'ai', data.confidence, data.sources);
            } catch (error) {
                addMessage('Eroare la procesarea întrebării', 'ai');
            }
            
            document.getElementById('question-input').value = '';
        }
        
        async function generateCase() {
            const context = document.getElementById('context-input').value;
            if (!context.trim()) {
                alert('Vă rugăm să introduceți un context pentru caz');
                return;
            }
            
            addMessage(`Generez caz pentru: ${context}`, 'user');
            
            try {
                const response = await fetch('/generate-case', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({context: context})
                });
                
                const data = await response.json();
                addMessage(data.answer, 'ai', data.confidence, data.sources);
            } catch (error) {
                addMessage('Eroare la generarea cazului', 'ai');
            }
            
            document.getElementById('context-input').value = '';
        }
        
        // Permite Enter pentru a trimite întrebarea
        document.getElementById('question-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                askQuestion();
            }
        });
    </script>
</body>
</html>
```

---

## Pasul 6: Rularea Sistemului

### 6.1 Rularea în Linia de Comandă
```bash
# Activează mediul virtual
source fsp_rag_env/bin/activate

# Rulează testele
python test_fsp_rag.py

# Rulează aplicația web
python app.py
```

### 6.2 Accesarea Interfeței Web
1. Deschide browserul
2. Navighează la `http://localhost:5000`
3. Începe să pui întrebări despre FSP

---

## Pasul 7: Monitorizarea și Îmbunătățirea

### 7.1 Logarea Interacțiunilor
```python
# logger.py
import logging
import json
from datetime import datetime

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler('fsp_rag.log'),
            logging.StreamHandler()
        ]
    )

def log_interaction(question, answer, confidence, sources):
    interaction = {
        'timestamp': datetime.now().isoformat(),
        'question': question,
        'answer': answer,
        'confidence': confidence,
        'sources_count': len(sources) if sources else 0
    }
    
    logging.info(f"Interaction: {json.dumps(interaction)}")
```

### 7.2 Metrici de Performanță
```python
# metrics.py
import time
from collections import defaultdict

class PerformanceMetrics:
    def __init__(self):
        self.metrics = defaultdict(list)
    
    def track_response_time(self, start_time, end_time):
        self.metrics['response_time'].append(end_time - start_time)
    
    def track_confidence(self, confidence):
        self.metrics['confidence'].append(confidence)
    
    def track_user_satisfaction(self, satisfaction):
        self.metrics['satisfaction'].append(satisfaction)
    
    def get_averages(self):
        return {
            'avg_response_time': sum(self.metrics['response_time']) / len(self.metrics['response_time']),
            'avg_confidence': sum(self.metrics['confidence']) / len(self.metrics['confidence']),
            'avg_satisfaction': sum(self.metrics['satisfaction']) / len(self.metrics['satisfaction'])
        }
```

---

## Pasul 8: Îmbunătățiri Avansate

### 8.1 Adăugarea de Documente Noi
```python
# update_knowledge_base.py
def add_new_fsp_documents(fsp_rag, new_documents_path):
    """Adaugă documente noi în baza de cunoștințe"""
    new_documents = fsp_rag.load_fsp_documents(new_documents_path)
    
    # Adaugă în baza de cunoștințe existentă
    fsp_rag.vectorstore.add_documents(new_documents)
    
    print(f"Adăugate {len(new_documents)} documente noi")
```

### 8.2 Fine-tuning cu Feedback
```python
# feedback_system.py
class FeedbackSystem:
    def __init__(self):
        self.feedback_data = []
    
    def collect_feedback(self, question, answer, user_rating, user_correction=None):
        feedback = {
            'question': question,
            'answer': answer,
            'rating': user_rating,
            'correction': user_correction,
            'timestamp': datetime.now().isoformat()
        }
        self.feedback_data.append(feedback)
    
    def generate_training_data(self):
        """Generează date de antrenament din feedback"""
        training_data = []
        for feedback in self.feedback_data:
            if feedback['rating'] >= 4:  # Răspunsuri bune
                training_data.append({
                    'input': feedback['question'],
                    'output': feedback['answer']
                })
            elif feedback['correction']:  # Răspunsuri corecte
                training_data.append({
                    'input': feedback['question'],
                    'output': feedback['correction']
                })
        return training_data
```

---

## Troubleshooting

### Probleme Comune și Soluții

1. **Eroare la conectarea la Pinecone**
   - Verifică API key-ul și environment-ul
   - Asigură-te că ai cont activ Pinecone

2. **Răspunsuri de calitate scăzută**
   - Adaugă mai multe documente FSP
   - Îmbunătățește promptul specializat
   - Verifică calitatea documentelor sursă

3. **Timpul de răspuns prea lung**
   - Reduce numărul de documente retrieve (parametrul k)
   - Folosește chunks mai mici
   - Optimizează indexul Pinecone

4. **Erori de memorie**
   - Procesează documentele în batch-uri mai mici
   - Folosește un server cu mai multă memorie
   - Optimizează dimensiunea chunk-urilor

### Contacte și Resurse

- **Documentație LangChain**: https://python.langchain.com/
- **Documentație Pinecone**: https://docs.pinecone.io/
- **Documentație OpenAI**: https://platform.openai.com/docs/
- **Comunitatea RAG**: https://github.com/langchain-ai/langchain

---

## Concluzie

Urmând acești pași, vei avea un sistem FSP RAG funcțional care poate:
- Răspunde la întrebări specifice despre FSP
- Genera cazuri medicale similare
- Oferi explicații pentru termeni tehnici
- Furniza surse pentru toate răspunsurile

Sistemul poate fi extins și îmbunătățit continuu prin adăugarea de documente noi și feedback de la utilizatori.