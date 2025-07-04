"""
Prototip FSP RAG System - Exemplu Practic
=========================================

Acest fișier oferă un exemplu practic de implementare a unui sistem RAG
pentru informații specifice despre FSP (Family Systems Perspective).

Instalare dependențe:
pip install langchain openai pinecone-client sentence-transformers
"""

import os
import json
from typing import List, Dict, Any
from langchain.embeddings import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Pinecone
from langchain.llms import OpenAI
from langchain.chains import RetrievalQA
from langchain.document_loaders import PyPDFLoader, TextLoader
from langchain.schema import Document
import pinecone

class FSPRAGSystem:
    """
    Sistem RAG specializat pentru Family Systems Perspective (FSP)
    """
    
    def __init__(self, openai_api_key: str, pinecone_api_key: str, pinecone_env: str):
        """
        Inițializează sistemul RAG pentru FSP
        
        Args:
            openai_api_key: Cheia API OpenAI
            pinecone_api_key: Cheia API Pinecone
            pinecone_env: Mediul Pinecone
        """
        self.openai_api_key = openai_api_key
        self.pinecone_api_key = pinecone_api_key
        self.pinecone_env = pinecone_env
        
        # Inițializează componentele
        self.embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
        self.llm = OpenAI(openai_api_key=openai_api_key, model_name="gpt-4")
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )
        
        # Configurează Pinecone
        pinecone.init(
            api_key=pinecone_api_key,
            environment=pinecone_env
        )
        
        self.index_name = "fsp-knowledge-base"
        self.vectorstore = None
        self.qa_chain = None
        
    def load_fsp_documents(self, documents_path: str) -> List[Document]:
        """
        Încarcă documentele FSP din director
        
        Args:
            documents_path: Calea către directorul cu documente FSP
            
        Returns:
            Lista de documente procesate
        """
        documents = []
        
        # Încarcă fișiere PDF și TXT
        for filename in os.listdir(documents_path):
            file_path = os.path.join(documents_path, filename)
            
            if filename.endswith('.pdf'):
                loader = PyPDFLoader(file_path)
                docs = loader.load()
                documents.extend(docs)
            elif filename.endswith('.txt'):
                loader = TextLoader(file_path)
                docs = loader.load()
                documents.extend(docs)
        
        # Împarte documentele în bucăți
        split_docs = self.text_splitter.split_documents(documents)
        
        # Adaugă metadata FSP
        for doc in split_docs:
            doc.metadata['domain'] = 'FSP'
            doc.metadata['type'] = 'medical_knowledge'
            
        return split_docs
    
    def create_knowledge_base(self, documents: List[Document]):
        """
        Creează baza de cunoștințe vectorială
        
        Args:
            documents: Lista de documente procesate
        """
        try:
            # Verifică dacă indexul există
            if self.index_name not in pinecone.list_indexes():
                pinecone.create_index(
                    name=self.index_name,
                    dimension=1536,  # Dimensiunea embeddings-urilor OpenAI
                    metric='cosine'
                )
            
            # Creează vectorstore
            self.vectorstore = Pinecone.from_documents(
                documents=documents,
                embedding=self.embeddings,
                index_name=self.index_name
            )
            
            print(f"Baza de cunoștințe creată cu {len(documents)} documente")
            
        except Exception as e:
            print(f"Eroare la crearea bazei de cunoștințe: {e}")
            raise
    
    def setup_qa_chain(self):
        """
        Configurează chain-ul pentru întrebări și răspunsuri
        """
        if not self.vectorstore:
            raise ValueError("Baza de cunoștințe nu este încărcată")
        
        # Promptul specializat pentru FSP
        fsp_prompt = """
        Ești un specialist în Family Systems Perspective (FSP) cu experiență clinică vastă.
        Folosește doar informațiile din contextul furnizat pentru a răspunde la întrebări.
        
        Când răspunzi:
        1. Oferă definiții clare și precise
        2. Incluzi termeni tehnici relevanți (Fachbegriffe)
        3. Dă exemple clinice concrete când este posibil
        4. Menționează sursele informațiilor
        5. Specifică dacă informațiile sunt incomplete
        
        Context: {context}
        
        Întrebare: {question}
        
        Răspuns structurat:
        """
        
        # Creează chain-ul QA
        self.qa_chain = RetrievalQA.from_chain_type(
            llm=self.llm,
            chain_type="stuff",
            retriever=self.vectorstore.as_retriever(search_kwargs={"k": 5}),
            return_source_documents=True
        )
        
        print("Chain-ul QA pentru FSP a fost configurat cu succes")
    
    def ask_fsp_question(self, question: str) -> Dict[str, Any]:
        """
        Pune o întrebare despre FSP și primește răspuns
        
        Args:
            question: Întrebarea despre FSP
            
        Returns:
            Dicționar cu răspunsul și sursele
        """
        if not self.qa_chain:
            raise ValueError("Chain-ul QA nu este configurat")
        
        try:
            # Obține răspunsul
            result = self.qa_chain({"query": question})
            
            # Procesează sursele
            sources = []
            if 'source_documents' in result:
                for doc in result['source_documents']:
                    sources.append({
                        'content': doc.page_content[:200] + "...",
                        'metadata': doc.metadata
                    })
            
            return {
                'question': question,
                'answer': result['result'],
                'sources': sources,
                'confidence': self._calculate_confidence(result)
            }
            
        except Exception as e:
            return {
                'question': question,
                'answer': f"Eroare la procesarea întrebării: {e}",
                'sources': [],
                'confidence': 0.0
            }
    
    def generate_fsp_case(self, patient_context: str) -> Dict[str, Any]:
        """
        Generează un caz medical FSP bazat pe contextul pacientului
        
        Args:
            patient_context: Contextul pacientului
            
        Returns:
            Dicționar cu cazul generat
        """
        case_prompt = f"""
        Bazându-te pe principiile FSP din baza de cunoștințe, creează un caz medical similar pentru:
        
        Context pacient: {patient_context}
        
        Incluzi în caz:
        1. Descrierea familiei și dinamicii familiale
        2. Principalele probleme identificate
        3. Tiparele de comunicare observate
        4. Strategii de intervenție FSP recomandate
        5. Termeni tehnici relevanți (Fachbegriffe)
        6. Prognosticul și obiectivele terapeutice
        
        Prezintă cazul în format structurat și profesional.
        """
        
        return self.ask_fsp_question(case_prompt)
    
    def explain_fsp_concept(self, concept: str, context: str = "general") -> Dict[str, Any]:
        """
        Explică un concept FSP în detaliu
        
        Args:
            concept: Conceptul FSP de explicat
            context: Contextul explicației
            
        Returns:
            Dicționar cu explicația detaliată
        """
        explanation_prompt = f"""
        Explică conceptul FSP: "{concept}" în contextul: "{context}"
        
        Structurează explicația astfel:
        1. Definiție tehnică precisă
        2. Originea și dezvoltarea conceptului
        3. Aplicarea în practica clinică
        4. Exemple concrete de utilizare
        5. Termeni tehnici asociați (Fachbegriffe)
        6. Legături cu alte concepte FSP
        7. Limitări sau contraindicații
        
        Oferă o explicație completă și educativă.
        """
        
        return self.ask_fsp_question(explanation_prompt)
    
    def _calculate_confidence(self, result: Dict) -> float:
        """
        Calculează nivelul de încredere în răspuns
        
        Args:
            result: Rezultatul chain-ului QA
            
        Returns:
            Scor de încredere între 0 și 1
        """
        # Implementare simplă - poate fi îmbunătățită
        if 'source_documents' in result:
            num_sources = len(result['source_documents'])
            if num_sources >= 3:
                return 0.9
            elif num_sources >= 2:
                return 0.7
            elif num_sources >= 1:
                return 0.5
        
        return 0.3

# Exemplu de utilizare
def main():
    """
    Exemplu de utilizare a sistemului FSP RAG
    """
    # Configurează API keys (înlocuiește cu valorile reale)
    openai_api_key = "your-openai-api-key"
    pinecone_api_key = "your-pinecone-api-key"
    pinecone_env = "your-pinecone-environment"
    
    # Creează sistemul RAG
    fsp_rag = FSPRAGSystem(
        openai_api_key=openai_api_key,
        pinecone_api_key=pinecone_api_key,
        pinecone_env=pinecone_env
    )
    
    # Încarcă documentele FSP
    documents_path = "./fsp_documents"  # Calea către documentele FSP
    documents = fsp_rag.load_fsp_documents(documents_path)
    
    # Creează baza de cunoștințe
    fsp_rag.create_knowledge_base(documents)
    
    # Configurează chain-ul QA
    fsp_rag.setup_qa_chain()
    
    # Testează sistemul
    print("=== Testare Sistem FSP RAG ===\n")
    
    # 1. Întrebare despre concept FSP
    result1 = fsp_rag.explain_fsp_concept(
        concept="circularitatea",
        context="terapia familială"
    )
    print("1. Explicație concept FSP:")
    print(f"Întrebare: {result1['question']}")
    print(f"Răspuns: {result1['answer']}")
    print(f"Încredere: {result1['confidence']:.2f}")
    print(f"Surse: {len(result1['sources'])}")
    print("-" * 50)
    
    # 2. Generare caz medical
    result2 = fsp_rag.generate_fsp_case(
        patient_context="Familie cu adolescent cu probleme de comportament, părinți divorțați recent"
    )
    print("2. Caz medical generat:")
    print(f"Context: {result2['question']}")
    print(f"Caz: {result2['answer']}")
    print(f"Încredere: {result2['confidence']:.2f}")
    print("-" * 50)
    
    # 3. Întrebare tehnică
    result3 = fsp_rag.ask_fsp_question(
        "Care sunt principalele Fachbegriffe în FSP și cum se aplică în practică?"
    )
    print("3. Termeni tehnici FSP:")
    print(f"Întrebare: {result3['question']}")
    print(f"Răspuns: {result3['answer']}")
    print(f"Încredere: {result3['confidence']:.2f}")
    print("-" * 50)

# Clasa pentru interfața web simplă
class FSPWebInterface:
    """
    Interfață web simplă pentru sistemul FSP RAG
    """
    
    def __init__(self, fsp_rag_system: FSPRAGSystem):
        self.fsp_rag = fsp_rag_system
    
    def create_flask_app(self):
        """
        Creează aplicația Flask pentru interfața web
        """
        from flask import Flask, render_template, request, jsonify
        
        app = Flask(__name__)
        
        @app.route('/')
        def index():
            return render_template('fsp_interface.html')
        
        @app.route('/ask', methods=['POST'])
        def ask_question():
            data = request.json
            question = data.get('question', '')
            question_type = data.get('type', 'general')
            
            if question_type == 'concept':
                result = self.fsp_rag.explain_fsp_concept(question)
            elif question_type == 'case':
                result = self.fsp_rag.generate_fsp_case(question)
            else:
                result = self.fsp_rag.ask_fsp_question(question)
            
            return jsonify(result)
        
        @app.route('/health')
        def health_check():
            return jsonify({
                'status': 'healthy',
                'system': 'FSP RAG',
                'version': '1.0.0'
            })
        
        return app

# Utilitare pentru procesarea documentelor
class FSPDocumentProcessor:
    """
    Procesează și pregătește documentele FSP pentru RAG
    """
    
    @staticmethod
    def create_sample_fsp_documents():
        """
        Creează documente FSP de exemplu pentru testare
        """
        sample_docs = {
            "fsp_basics.txt": """
            Family Systems Perspective (FSP) Concepte Fundamentale
            
            FSP este o abordare terapeutică care privește familia ca un sistem complex de relații interdependente.
            Principiile de bază includ:
            
            1. Circularitatea: Relațiile sunt circulare, nu lineare
            2. Homeostaza: Sistemele tind să mențină echilibrul
            3. Subsistemele: Familia conține subsisteme (parental, frățesc, etc.)
            4. Frontierele: Limitele dintre subsisteme și cu exteriorul
            
            Fachbegriffe importante:
            - Zirkularität (Circularitate)
            - Homöostase (Homeostaza)
            - Subsysteme (Subsisteme)
            - Grenzen (Frontiere)
            """,
            
            "fsp_techniques.txt": """
            Tehnici de Intervenție în FSP
            
            1. Genograma familială: Reprezentarea grafică a relațiilor familiale
            2. Questioning circular: Tehnica de întrebări care evidențiază circularitatea
            3. Reframing: Schimbarea perspectivei asupra problemei
            4. Boundary work: Lucrul cu frontierele familiale
            
            Aplicații clinice:
            - Terapia familială
            - Counseling matrimonial
            - Intervenții în criză
            - Medierea conflictelor familiale
            """,
            
            "fsp_case_example.txt": """
            Studiu de Caz FSP
            
            Familie: Părinți (45, 42 ani) cu doi copii (16, 12 ani)
            Problema: Conflicte frecvente între părinți și adolescent
            
            Analiza FSP:
            1. Frontierele fuzzy între subsistemul parental și cel frățesc
            2. Tipar circular: adolescentul se retrage → părinții insistă → conflict escaladă
            3. Homeostaza disfuncțională: conflictele mențin echilibrul familial
            
            Intervenții:
            1. Clarificarea frontierelor
            2. Întrebări circulare pentru conștientizarea tiparelor
            3. Reframing: "rebeliunea" ca "creștere către independență"
            
            Rezultate: Îmbunătățirea comunicării și reducerea conflictelor
            """
        }
        
        # Creează directorul pentru documente
        os.makedirs("fsp_documents", exist_ok=True)
        
        # Scrie documentele
        for filename, content in sample_docs.items():
            with open(f"fsp_documents/{filename}", "w", encoding="utf-8") as f:
                f.write(content)
        
        print("Documente FSP de exemplu create în directorul 'fsp_documents'")

if __name__ == "__main__":
    # Creează documente de exemplu
    FSPDocumentProcessor.create_sample_fsp_documents()
    
    # Rulează exemplul principal
    print("Pentru a rula exemplul complet, configurează API keys în funcția main()")
    print("Documentele de exemplu au fost create în directorul 'fsp_documents'")