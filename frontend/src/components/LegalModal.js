import React, { useState } from 'react';
import { X, Shield, FileText, Eye, Download, ExternalLink } from 'lucide-react';

const LegalModal = ({ isOpen, onClose, initialTab = 'terms' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    { id: 'terms', label: 'Termeni și Condiții', icon: FileText },
    { id: 'privacy', label: 'Politica de Confidențialitate', icon: Shield },
    { id: 'cookies', label: 'Politica Cookie-uri', icon: Eye }
  ];

  const termsContent = `
# Termeni și Condiții de Utilizare - ApprobMed

## 1. Acceptarea Termenilor
Prin utilizarea serviciilor ApprobMed, confirmați că ați citit, înțeles și acceptat acești termeni și condiții în întregime.

## 2. Descrierea Serviciului
ApprobMed este o platformă digitală care oferă ghidare și resurse pentru medicii care doresc să obțină Approbation în Germania. Serviciile includ:
- Ghiduri pas-cu-pas pentru procesul de Approbation
- Tutor AI pentru învățarea germanei medicale
- Management documente
- Resurse educaționale și de sprijin

## 3. Înregistrarea Contului
- Trebuie să furnizați informații exacte și complete
- Sunteți responsabil pentru securitatea contului dvs.
- Notificați-ne imediat despre orice utilizare neautorizată

## 4. Utilizarea Acceptabilă
NU este permis să:
- Folosiți platforma pentru activități ilegale
- Distribuiți conținut fals sau înșelător
- Încercați să compromiteți securitatea sistemului
- Folosiți serviciile pentru practici de spam

## 5. Conținutul Utilizatorului
- Rămâneți proprietarul conținutului pe care îl încărcați
- Ne acordați licența de a folosi conținutul pentru furnizarea serviciilor
- Sunteți responsabil pentru legalitatea conținutului încărcat

## 6. Servicii Premium
- Unele funcții sunt disponibile doar pentru utilizatorii premium
- Plățile sunt procesate sigur prin furnizori terți
- Politicile de rambursare sunt disponibile la solicitare

## 7. Limitarea Răspunderii
ApprobMed nu garantează:
- Obținerea Approbation-ului
- Exactitatea completă a informațiilor oficiale
- Funcționarea neîntreruptă a serviciilor

## 8. Modificări
Ne rezervăm dreptul de a modifica acești termeni. Modificările vor fi comunicate prin email și pe platformă.

## 9. Legea Aplicabilă
Acești termeni sunt guvernați de legislația română și cea germană aplicabilă.

## Contact
Pentru întrebări: contact@approbmed.com

Data ultimei actualizări: Decembrie 2024
  `;

  const privacyContent = `
# Politica de Confidențialitate - ApprobMed

## 1. Informații Generale
Această politică explică cum colectăm, folosim și protejăm datele dvs. personale în conformitate cu GDPR.

## 2. Date Colectate

### Date de Identificare:
- Nume și prenume
- Adresa de email
- Țara de origine
- Bundesland țintă

### Date de Utilizare:
- Progresul în aplicație
- Interacțiunile cu tutorul AI
- Documentele încărcate
- Preferințele de limbă

### Date Tehnice:
- Adresa IP
- Tipul browserului
- Timpul petrecut pe platformă

## 3. Baza Legală pentru Prelucrare
- **Consimțământ**: Pentru serviciile premium și marketing
- **Contract**: Pentru furnizarea serviciilor de bază
- **Interes legitim**: Pentru îmbunătățirea serviciilor

## 4. Cum Folosim Datele

### Finalități Primare:
- Furnizarea serviciilor ApprobMed
- Personalizarea experienței
- Suport tehnic și comunicare

### Finalități Secundare:
- Îmbunătățirea serviciilor
- Analize statistice (anonimizate)
- Marketing direct (cu consimțământ)

## 5. Partajarea Datelor
NU partajăm datele cu terți, EXCEPȚIE:
- Furnizori de servicii necesari (hosting, plăți)
- Autorități legale (la solicitare legală)
- În caz de fuziune/achiziție (cu notificare)

## 6. Transferuri Internaționale
Datele pot fi procesate în țări din UE cu nivel adecvat de protecție.

## 7. Securitatea Datelor

### Măsuri Tehnice:
- Criptarea datelor în tranzit și în repaus
- Autentificare cu doi factori
- Monitorizare securitate 24/7

### Măsuri Organizaționale:
- Personal instruit în protecția datelor
- Politici interne stricte
- Auditări regulate de securitate

## 8. Drepturile Dvs. GDPR

### Drepturi Fundamentale:
- **Acces**: Să știți ce date avem
- **Rectificare**: Să corectați datele incorecte
- **Ștergere**: "Dreptul de a fi uitat"
- **Restricționare**: Să limitați prelucrarea

### Drepturi de Control:
- **Portabilitate**: Să primiți datele în format structurat
- **Opoziție**: Să vă opuneți prelucrării
- **Retragere consimțământ**: Oricând, fără penalizare

## 9. Reținerea Datelor
- **Conturi active**: Atât timp cât utilizați serviciul
- **Conturi inactive**: 3 ani de la ultima activitate
- **Date financiare**: 7 ani (obligație legală)
- **Loguri de securitate**: 1 an

## 10. Cookie-uri și Tracking
Vezi Politica separată de Cookie-uri pentru detalii complete.

## 11. Minori
Serviciile nu sunt destinate persoanelor sub 16 ani fără consimțământul părinților.

## 12. DPO și Contact
**Data Protection Officer**: dpo@approbmed.com
**Contact general**: privacy@approbmed.com

## 13. Autoritatea de Supraveghere
Puteți depune plângeri la:
- ANSPDCP (România)
- Bundesbeauftragte für Datenschutz (Germania)

Data ultimei actualizări: Decembrie 2024
  `;

  const cookiesContent = `
# Politica Cookie-uri - ApprobMed

## 1. Ce sunt Cookie-urile?
Cookie-urile sunt fișiere mici stocate pe dispozitivul dvs. pentru a îmbunătăți experiența de navigare.

## 2. Tipuri de Cookie-uri Folosite

### Cookie-uri Strict Necesare:
- **Sesiune utilizator**: Pentru menținerea login-ului
- **Securitate**: Protecție CSRF și securitate
- **Preferințe limba**: Memorarea limbii selectate
- **GDPR**: Starea consimțământului

*Aceste cookie-uri nu pot fi dezactivate.*

### Cookie-uri de Performanță:
- **Google Analytics**: Statistici de utilizare anonimizate
- **Monitorizare erori**: Pentru îmbunătățirea stabilității
- **Timp încărcare**: Optimizarea performanței

### Cookie-uri de Funcționalitate:
- **Progres tutorial**: Memorarea stadiului tutorialului
- **Preferințe UI**: Tema, setări afișare
- **Progres pași**: Salvarea progresului în aplicație

### Cookie-uri de Marketing (Opționale):
- **Remarketing**: Pentru afișarea anunțurilor relevante
- **Analiză comportament**: Pentru personalizarea conținutului
- **Social media**: Integrare rețele sociale

## 3. Cookie-uri Terți

### Google Services:
- **Analytics**: _ga, _gid, _gat
- **Fonts**: Pentru încărcarea fonturilor
- **ReCaptcha**: Protecție anti-spam

### Stripe (Plăți):
- **Session**: Pentru procesarea plăților secure
- **Fraud protection**: Detectarea tranzacțiilor frauduloase

## 4. Gestionarea Cookie-urilor

### În Browser:
- **Chrome**: Settings > Privacy > Cookies
- **Firefox**: Options > Privacy & Security
- **Safari**: Preferences > Privacy
- **Edge**: Settings > Privacy & Security

### În ApprobMed:
- Accesați setările din aplicație
- Modificați preferințele de cookie-uri
- Ștergeți cookie-urile existente

## 5. Durata de Stocare

| Tip Cookie | Durata | Scop |
|------------|--------|------|
| Sesiune | Până la închiderea browserului | Login, securitate |
| Funcționale | 1 an | Preferințe utilizator |
| Analytics | 2 ani | Statistici anonimizate |
| Marketing | 30 zile | Publicitate personalizată |

## 6. Cookie-uri și GDPR
- Cookie-urile necesare nu necesită consimțământ
- Pentru alte categorii, solicităm consimțământul explicit
- Puteți retrage consimțământul oricând

## 7. Actualizări
Această politică poate fi actualizată. Modificările vor fi comunicate prin:
- Notificare în aplicație
- Email către utilizatori
- Banner de notificare

## Contact
Pentru întrebări despre cookie-uri: cookies@approbmed.com

Data ultimei actualizări: Decembrie 2024
  `;

  const getContent = () => {
    switch (activeTab) {
      case 'terms':
        return termsContent;
      case 'privacy':
        return privacyContent;
      case 'cookies':
        return cookiesContent;
      default:
        return termsContent;
    }
  };

  const handleDownload = () => {
    const content = getContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `approbmed-${activeTab}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[95] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Documente Legale</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2"
              title="Descarcă"
            >
              <Download size={20} />
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-1/3 bg-gray-50 p-4 border-r overflow-y-auto">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Quick Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 mb-2">Informații importante</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Conforme cu GDPR</li>
                <li>• Actualizate decembrie 2024</li>
                <li>• Disponibile în română</li>
                <li>• Consultare gratuită</li>
              </ul>
            </div>

            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-semibold text-green-800 mb-2">Drepturile tale</h3>
              <ul className="text-xs text-green-700 space-y-1">
                <li>• Acces la date</li>
                <li>• Rectificare</li>
                <li>• Ștergere</li>
                <li>• Portabilitate</li>
              </ul>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="prose max-w-none">
              <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
                <ExternalLink size={14} />
                <span>Document legal • Ultima actualizare: Decembrie 2024</span>
              </div>
              
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {getContent().split('\n').map((line, index) => {
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={index} className="text-2xl font-bold text-gray-900 mt-6 mb-4">
                        {line.substring(2)}
                      </h1>
                    );
                  } else if (line.startsWith('## ')) {
                    return (
                      <h2 key={index} className="text-xl font-semibold text-gray-800 mt-5 mb-3">
                        {line.substring(3)}
                      </h2>
                    );
                  } else if (line.startsWith('### ')) {
                    return (
                      <h3 key={index} className="text-lg font-medium text-gray-700 mt-4 mb-2">
                        {line.substring(4)}
                      </h3>
                    );
                  } else if (line.startsWith('| ')) {
                    // Simple table row rendering
                    const cells = line.split('|').slice(1, -1);
                    return (
                      <div key={index} className="flex border-b border-gray-200 py-2">
                        {cells.map((cell, cellIndex) => (
                          <div key={cellIndex} className="flex-1 px-2 text-sm">
                            {cell.trim()}
                          </div>
                        ))}
                      </div>
                    );
                  } else if (line.startsWith('- ') || line.startsWith('* ')) {
                    return (
                      <div key={index} className="flex items-start gap-2 my-1">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{line.substring(2)}</span>
                      </div>
                    );
                  } else if (line.trim() === '') {
                    return <div key={index} className="h-2" />;
                  } else {
                    return (
                      <p key={index} className="mb-3">
                        {line}
                      </p>
                    );
                  }
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            © 2024 ApprobMed. Toate drepturile rezervate.
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Contact legal:</span>
            <a
              href="mailto:legal@approbmed.com"
              className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              legal@approbmed.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;