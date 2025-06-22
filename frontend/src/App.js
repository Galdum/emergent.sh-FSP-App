import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Check, Lock, Rocket, FileText, UserPlus, Send, Target, X, Clock, Users, ArrowRight, Info, BookOpen, MessageCircle, Youtube, Star, Sparkles, Clipboard, Mail, RefreshCw, ChevronLeft, FolderKanban, Upload, FileCheck2, PencilRuler, Compass, Link as LinkIcon, StickyNote, Trash2, PlusCircle, User, LogOut, Settings, Image as ImageIcon, FileUp } from 'lucide-react';
import './App.css';

// Import new authentication and API components
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useProgress } from './hooks/useProgress';
import { usePersonalFiles } from './hooks/usePersonalFiles';
import { useSubscription } from './hooks/useSubscription';
import SubscriptionUpgrade from './components/SubscriptionUpgrade';
import FeedbackWidget from './components/FeedbackWidget';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';

// Import new utilities
import { renderMarkdown } from './utils/markdownRenderer';
import { conversationManager, ImageOptimizer, CostTracker } from './utils/conversationManager';

// --- Confetti Component ---
const Confetti = () => {
    const confettiCount = 100;
    const colors = ['#fde196', '#fdb497', '#F7941D', '#27AAE1', '#a3d4f4', '#81c784'];
    
    useEffect(() => {
        const timer = setTimeout(() => {
            // Component will unmount itself after 4 seconds
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[100]">
            {Array.from({ length: confettiCount }).map((_, i) => (
                <div 
                    key={i} 
                    className="absolute rounded-full animate-confetti-fall"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${-20 + Math.random() * -80}px`,
                        width: `${Math.random() * 8 + 6}px`,
                        height: `${Math.random() * 8 + 6}px`,
                        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${Math.random() * 2 + 3}s`,
                    }}
                ></div>
            ))}
        </div>
    );
};

// --- Info Documents Data ---
const infoDocs = [
    { 
        id: 'alt-fsp', 
        title: 'Alternative la FSP (telc, FaMed, PKT)',
        content: (
            <div className="space-y-4 text-gray-700">
                <p className="font-bold">Ideea-cheie: Există trei examene alternative la Fachsprachprüfung-ul camerelor medicale: telc Deutsch B2·C1 Medizin, FaMed C1 (LMU München) şi Patientenkommunikationstest (PKT) C1 (Freiburg International Academy).</p>
                <p>Acceptarea lor depinde de land. Detaliile complete sunt mai jos.</p>

                <h4 className="font-bold text-lg text-gray-800 border-b pb-2">1. Examene alternative – format, cost, timpi de aşteptare</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2 font-semibold">Examen</th>
                                <th className="p-2 font-semibold">Conţinut & durată</th>
                                <th className="p-2 font-semibold">Cost tipic</th>
                                <th className="p-2 font-semibold">Rezultat</th>
                                <th className="p-2 font-semibold">Centre România / UE</th>
                                <th className="p-2 font-semibold">Observaţii</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b"><td className="p-2 font-semibold">telc Deutsch B2·C1 Medizin</td><td className="p-2">Scris 80 min (citit, ascultat, gramatică) + oral 65 min (anamneză 20 min · Arztbrief 20 min · prezentare 20 min)</td><td className="p-2">300–360 €</td><td className="p-2">4-6 săpt.</td><td className="p-2">Bucureşti, Iaşi</td><td className="p-2">Înscriere min. 14 zile înainte</td></tr>
                            <tr className="border-b"><td className="p-2 font-semibold">FaMed C1</td><td className="p-2">Identic FSP (20-20-20); barem ≥ 60 %/probă</td><td className="p-2">490 € (Mainz)</td><td className="p-2">≈ 4 săpt. prin e-mail</td><td className="p-2">doar Mainz (LMU)</td><td className="p-2">Din 08/2024 format unic Bayern & RLP</td></tr>
                            <tr><td className="p-2 font-semibold">PKT C1 (FIA)</td><td className="p-2">3×20 min (doc scrisă · prezentare colegială · informare pacient)</td><td className="p-2">450-480 €</td><td className="p-2">&lt; 4 săpt.</td><td className="p-2">Frankfurt (lunar)</td><td className="p-2">Acceptat explicit în HH, HE, SL</td></tr>
                        </tbody>
                    </table>
                </div>

                <h4 className="font-bold text-lg text-gray-800 border-b pb-2 mt-6">2. Landuri care acceptă telc B2·C1 Medizin</h4>
                <ul className="list-disc list-inside space-y-1">
                    <li><strong>Acceptare oficială:</strong> Hamburg, Hessen (candidaţi UE/SEE), Saarland, Schleswig-Holstein.</li>
                    <li><strong>Acceptare la cerere (caz-cu-caz):</strong> Nordrhein-Westfalen, Sachsen, Sachsen-Anhalt, Brandenburg.</li>
                    <li><strong>Refuz explicit (cer FSP propriu):</strong> Berlin, Bayern, Baden-Württemberg, Mecklenburg-Vorpommern.</li>
                </ul>

                <h4 className="font-bold text-lg text-gray-800 border-b pb-2 mt-6">3. Landuri care acceptă FaMed C1</h4>
                 <ul className="list-disc list-inside space-y-1">
                    <li><strong>Acceptare directă:</strong> Bayern, Rheinland-Pfalz.</li>
                    <li><strong>Acceptare condiționată:</strong> Baden-Württemberg (dacă a fost recunoscut deja în BY/RLP).</li>
                </ul>

                <h4 className="font-bold text-lg text-gray-800 border-b pb-2 mt-6">4. Checklist pentru înscriere la telc în România</h4>
                 <ul className="list-disc list-inside space-y-1">
                    <li>Alege centru (B.Smart Bucureşti / Lektor Iaşi) şi data (min. 14 zile în avans).</li>
                    <li>Plăteşte on-site (300–360 €) şi adu CI/paşaport.</li>
                    <li>Pregăteşte-te pe modelul oficial telc.</li>
                    <li>În paralel, trimite dosarul de Approbation – certificatul telc ajunge la timp pentru landurile care îl acceptă.</li>
                </ul>
            </div>
        )
    },
    { 
        id: 'cel-mai', 
        title: 'Analiza Comparativă a Landurilor',
        content: (
            <div className="space-y-4 text-gray-700">
                <p className="font-bold">Pe scurt: Cele mai multe FSP-uri sunt în Nordrhein-Westfalen (cele mai mari șanse de programare rapidă). Cel mai sever barem este în Bayern. Pentru viteză administrativă, Berlin și Baden-Württemberg ies în faţă.</p>

                <h4 className="font-bold text-lg text-gray-800 border-b pb-2">1. Unde prinzi loc cel mai rapid la FSP?</h4>
                <ul className="list-disc list-inside">
                    <li><strong>Nordrhein-Westfalen (NRW):</strong> Cel mai mare volum (2040 examene în 2023), taxe reduse (350-400€).</li>
                    <li><strong>Bayern:</strong> Sesiuni aproape săptămânale la München.</li>
                    <li><strong>Baden-Württemberg:</strong> Patru centre de examen (distribuție bună).</li>
                    <li><strong>Rheinland-Pfalz:</strong> Prioritate dacă ai contract/hospitație în land.</li>
                </ul>
                
                <h4 className="font-bold text-lg text-gray-800 border-b pb-2 mt-6">2. Unde este FSP-ul considerat cel mai dificil?</h4>
                 <ul className="list-disc list-inside">
                    <li><strong>Bayern:</strong> Doar ~48% rată de promovare.</li>
                    <li><strong>Nordrhein (parte din NRW):</strong> 35.8% rată de eșec în 2023.</li>
                    <li><strong>Sachsen:</strong> Taxă mare (590€), listă de termeni foarte tehnică.</li>
                    <li><strong>Thüringen:</strong> Așteptare lungă (4-5 luni) și listă obligatorie de termeni.</li>
                </ul>

                <h4 className="font-bold text-lg text-gray-800 border-b pb-2 mt-6">3. Unde finalizezi cel mai rapid Approbation-ul?</h4>
                 <ul className="list-disc list-inside">
                    <li><strong>Berlin:</strong> Certificat trimis la autoritate în ≤ 10 zile.</li>
                    <li><strong>Baden-Württemberg:</strong> Approbation finalizată în ~35 de zile.</li>
                    <li><strong>NRW:</strong> Procesare în paralel cu FSP.</li>
                    <li><strong>Hamburg:</strong> Rezultat pe loc, dosar digital.</li>
                </ul>

                <h4 className="font-bold text-lg text-gray-800 border-b pb-2 mt-6">4. Cum să alegi în practică?</h4>
                <p><strong>Viteză și cost:</strong> Aplică în NRW. <strong>Reputație și rigurozitate:</strong> Alege Bayern. <strong>Eficiență administrativă:</strong> Optează pentru Berlin sau Baden-Württemberg. <strong>Ai deja o ofertă:</strong> Rheinland-Pfalz sau Sachsen îți pot scurta timpii.</p>
            </div>
        )
    },
    {
        id: 'canale-youtube',
        title: 'Canale Youtube utile',
        content: (
            <div className="space-y-4 text-gray-700">
                <p className="font-bold">Actualizare: iunie 2025. Toate link‑urile au fost verificate manual; sunt afișate integral și pot fi accesate prin click.</p>
                <p className="font-semibold text-blue-700">Cum folosești: urmărește simulările complete, copiază structura răspunsurilor și folosește funcția de redare încetinită pentru a nota terminologia.</p>
                
                <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">1. ärztesprech</h4>
                        <p className="text-sm">Simulări complete FSP, feedback detaliat; ~50 000 abonați</p>
                        <a href="https://www.youtube.com/channel/UCsWBNwfMj0oF5a6fadcMELg" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/channel/UCsWBNwfMj0oF5a6fadcMELg</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">2. DMiNetz International</h4>
                        <p className="text-sm">Ghiduri birocratice și tutoriale KP/FSP; ~45 000 abonați</p>
                        <a href="https://www.youtube.com/channel/UCDIfxnVJryfV4AoheGpi-Uw" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/channel/UCDIfxnVJryfV4AoheGpi-Uw</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">3. MEDDEOnline | Ärztefortbildung</h4>
                        <p className="text-sm">Platformă de curs; simulări live; ~30 000 abonați</p>
                        <a href="https://www.youtube.com/@meddeonline" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/@meddeonline</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">4. Fachsprache_org</h4>
                        <p className="text-sm">Non‑profit, vocabular și simulări; ~28 000 abonați</p>
                        <a href="https://www.youtube.com/c/Deutschf%C3%BCrMediziner" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/c/Deutschf%C3%BCrMediziner</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">5. German Doctor Prep</h4>
                        <p className="text-sm">Clipuri scurte C1 și greșeli frecvente; ~22 000 abonați</p>
                        <a href="https://www.youtube.com/@GermanDoctorPrep" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/@GermanDoctorPrep</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">6. Doctor Oleg [RO]</h4>
                        <p className="text-sm">Perspectivă românească, rapoarte scrise; ~18 000 abonați</p>
                        <a href="https://www.youtube.com/@DoctorOleg" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/@DoctorOleg</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">7. Easy German – Medizin</h4>
                        <p className="text-sm">Interviuri cu pacienți reali; &gt;1 mil. subs la Easy German</p>
                        <a href="https://www.youtube.com/@EasyGerman/search?query=medizin" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/@EasyGerman/search?query=medizin</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">8. AMBOSS Deutschland</h4>
                        <p className="text-sm">Webinarii examene; ~60 000 abonați</p>
                        <a href="https://www.youtube.com/@AMBOSSDeutschland" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/@AMBOSSDeutschland</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">9. Make it in Germany – Doctors</h4>
                        <p className="text-sm">Canal oficial guvern DE; ghiduri integrare; ~15 000 abonați</p>
                        <a href="https://www.youtube.com/watch?v=3pgDVyprl7k" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/watch?v=3pgDVyprl7k</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">10. Rohit Batra Teach</h4>
                        <p className="text-sm">Strategii non‑UE, vize și FSP; ~17 000 abonați</p>
                        <a href="https://www.youtube.com/@RohitBatraTeach" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/@RohitBatraTeach</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">11. Thanos M.D.</h4>
                        <p className="text-sm">Anamneze animate și sfaturi; ~12 000 abonați</p>
                        <a href="https://www.youtube.com/@thanosmd" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/@thanosmd</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">12. Medical German Tips</h4>
                        <p className="text-sm">Shorts terminologie; ~10 000 abonați</p>
                        <a href="https://www.youtube.com/watch?v=lG3H_J8V54E" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/watch?v=lG3H_J8V54E</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">13. Deutsch für Ärzte</h4>
                        <p className="text-sm">Gramatică medicală avansată; ~8 000 abonați</p>
                        <a href="https://www.youtube.com/@DeutschfuerAerzte" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/@DeutschfuerAerzte</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">14. German Made Easy – Medizin</h4>
                        <p className="text-sm">Vocabular audio C1; ~9 000 abonați</p>
                        <a href="https://www.youtube.com/@GermanMadeEasyMed" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/@GermanMadeEasyMed</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">15. Kardiologie für die FSP</h4>
                        <p className="text-sm">Cazuri cardio tipice; ~7 000 abonați</p>
                        <a href="https://www.youtube.com/@FSPKardiologie" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/@FSPKardiologie</a>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'grupuri-suport',
        title: 'Grupuri de suport',
        content: (
            <div className="space-y-4 text-gray-700">
                <p className="font-bold">Grupuri Facebook active pentru medici români în Germania</p>
                <p className="font-semibold text-blue-700">Cum folosești: caută în secțiunea „Fișiere" pentru protocoale PDF recente și folosește bara de căutare internă cu cuvinte‑cheie („FSP raport", „Berufserlaubnis").</p>
                
                <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">1. Medici Români în Germania</h4>
                        <p className="text-sm">≈9 300 membri; protocoale și joburi [RO]</p>
                        <a href="https://www.facebook.com/groups/441619945878317/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/441619945878317/</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">2. Medici Rezidenți & Specialiști Germania</h4>
                        <p className="text-sm">Mentorat rezidenți și fișiere terminologie [RO]</p>
                        <a href="https://www.facebook.com/groups/570464712984847/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/570464712984847/</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">3. Medici moldoveni în Germania</h4>
                        <p className="text-sm">Comunitate basarabeană; live Q&A [RO]</p>
                        <a href="https://www.facebook.com/groups/2070183739878628/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/2070183739878628/</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">4. Medici Români Baden‑Württemberg</h4>
                        <p className="text-sm">Focus FSP Stuttgart; hospitații [RO]</p>
                        <a href="https://www.facebook.com/groups/320787598356013/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/320787598356013/</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">5. Medici Stomatologi RO în DE</h4>
                        <p className="text-sm">FSP Zahnärzte specific [RO]</p>
                        <a href="https://www.facebook.com/groups/1209699985770522/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/1209699985770522/</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">6. Medici în Elveția și Germania</h4>
                        <p className="text-sm">Comparație salarizare și KP [RO]</p>
                        <a href="https://www.facebook.com/groups/1241910363204105/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/1241910363204105/</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">7. Romanian Doctors NRW</h4>
                        <p className="text-sm">Networking și chirie NRW [RO]</p>
                        <a href="https://www.facebook.com/groups/romanian.doctors.nrw/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/romanian.doctors.nrw/</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">8. Romanian Doctors Bayern</h4>
                        <p className="text-sm">Cerinte BLÄK & examene München [RO]</p>
                        <a href="https://www.facebook.com/groups/romaniandoctors.bayern/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/romaniandoctors.bayern/</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">9. Pacienți și Doctori RO DE</h4>
                        <p className="text-sm">Comunitate mixtă; schimb de experiențe [RO]</p>
                        <a href="https://www.facebook.com/groups/797227794106598/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/797227794106598/</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">10. Joburi medici – DE & CH</h4>
                        <p className="text-sm">Oferte zilnice, hospitații plătite [RO]</p>
                        <a href="https://www.facebook.com/groups/648506815198596/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/648506815198596/</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">11. Fachsprachprüfung Protokolle</h4>
                        <p className="text-sm">Arhivă protocoale actualizate</p>
                        <a href="https://www.facebook.com/groups/fachsprachpruefung/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/fachsprachpruefung/</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">12. Approbation & FSP Münster</h4>
                        <p className="text-sm">Detalii logistice locale NRW</p>
                        <a href="https://www.facebook.com/groups/kenntnispruefungmuenster/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/kenntnispruefungmuenster/</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">13. FSP/KP Berlin‑Brandenburg</h4>
                        <p className="text-sm">Experiențe ÄK Berlin</p>
                        <a href="https://www.facebook.com/groups/536789996657319/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/536789996657319/</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">14. Doctors Going to Germany</h4>
                        <p className="text-sm">Comunitate internațională (EN)</p>
                        <a href="https://www.facebook.com/groups/DoctorsLearningGermanTogether/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/DoctorsLearningGermanTogether/</a>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800">15. Ärzte in Deutschland (AR/EN)</h4>
                        <p className="text-sm">Update taxe KP și vize</p>
                        <a href="https://www.facebook.com/groups/1407818903141573/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/1407818903141573/</a>
                    </div>
                </div>
            </div>
        )
    },
    {
        id: 'site-oficiale',
        title: 'Site-uri oficiale',
        content: (
            <div className="space-y-4 text-gray-700">
                <p className="font-bold">Linkuri oficiale pe land pentru Fachsprachprüfung și Approbation</p>
                <p className="font-semibold text-blue-700">Sugestie: verifică întâi site‑ul autorității de Approbation pentru lista de documente, apoi rezervă data pentru FSP pe site‑ul camerei medicale.</p>
                
                <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-bold text-lg text-gray-800 mb-2">Baden‑Württemberg</h4>
                        <div className="space-y-1">
                            <div>
                                <span className="font-semibold">Fachsprachprüfung – LÄK BW:</span>
                                <a href="https://www.aerztekammer-bw.de/fachsprachenpruefung" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.aerztekammer-bw.de/fachsprachenpruefung</a>
                            </div>
                            <div>
                                <span className="font-semibold">Approbation – Regierungspräsidium Stuttgart:</span>
                                <a href="https://rp.baden-wuerttemberg.de/themen/bildung/ausbildung/seiten/approbation-inland/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://rp.baden-wuerttemberg.de/themen/bildung/ausbildung/seiten/approbation-inland/</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-bold text-lg text-gray-800 mb-2">Bayern</h4>
                        <div className="space-y-1">
                            <div>
                                <span className="font-semibold">Fachsprachprüfung – BLÄK:</span>
                                <a href="https://www.blaek.de/arzt/ausland/fachsprachpruefung" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.blaek.de/arzt/ausland/fachsprachpruefung</a>
                            </div>
                            <div>
                                <span className="font-semibold">Approbation – Regierung Oberbayern:</span>
                                <a href="https://www.regierung.oberbayern.bayern.de/aufgaben/43132/43189/43301/index.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.regierung.oberbayern.bayern.de/aufgaben/43132/43189/43301/index.html</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-l-4 border-gray-500 pl-4">
                        <h4 className="font-bold text-lg text-gray-800 mb-2">Berlin</h4>
                        <div className="space-y-1">
                            <div>
                                <span className="font-semibold">Fachsprachprüfung – ÄK Berlin:</span>
                                <a href="https://www.aekb.de/aerzt-innen/aus-dem-ausland-ins-ausland/fachsprachpruefung" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.aekb.de/aerzt-innen/aus-dem-ausland-ins-ausland/fachsprachpruefung</a>
                            </div>
                            <div>
                                <span className="font-semibold">Approbation – LAGeSo:</span>
                                <a href="https://www.berlin.de/lageso/gesundheit/berufe-im-gesundheitswesen/akademisch/aerztin-arzt/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.berlin.de/lageso/gesundheit/berufe-im-gesundheitswesen/akademisch/aerztin-arzt/</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-bold text-lg text-gray-800 mb-2">Brandenburg</h4>
                        <div className="space-y-1">
                            <div>
                                <span className="font-semibold">Ärztekammer Brandenburg – FSP Info:</span>
                                <a href="https://www.laekb.de/ausbildung-ausland/fachsprachpruefung" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.laekb.de/ausbildung-ausland/fachsprachpruefung</a>
                            </div>
                            <div>
                                <span className="font-semibold">Approbation – LAVG Brandenburg:</span>
                                <a href="https://lavg.brandenburg.de/lavg/de/gesundheit/app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://lavg.brandenburg.de/lavg/de/gesundheit/app</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-l-4 border-blue-300 pl-4">
                        <h4 className="font-bold text-lg text-gray-800 mb-2">Bremen</h4>
                        <div className="space-y-1">
                            <div>
                                <span className="font-semibold">Ärztekammer Bremen – FSP:</span>
                                <a href="https://www.aekhb.de/auslaendische-aerzte/fachsprachenpruefung" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.aekhb.de/auslaendische-aerzte/fachsprachenpruefung</a>
                            </div>
                            <div>
                                <span className="font-semibold">Approbation – Gesundheitsamt Bremen:</span>
                                <a href="https://www.gesundheit.bremen.de/approbation" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.gesundheit.bremen.de/approbation</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-l-4 border-red-600 pl-4">
                        <h4 className="font-bold text-lg text-gray-800 mb-2">Hamburg</h4>
                        <div className="space-y-1">
                            <div>
                                <span className="font-semibold">Fachsprachprüfung – ÄK Hamburg:</span>
                                <a href="https://www.aerztekammer-hamburg.org/fachsprachenpruefung.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.aerztekammer-hamburg.org/fachsprachenpruefung.html</a>
                            </div>
                            <div>
                                <span className="font-semibold">Approbation – Sozialbehörde Hamburg:</span>
                                <a href="https://www.hamburg.de/behoerdenfinder/info/11254303/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.hamburg.de/behoerdenfinder/info/11254303/</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-l-4 border-yellow-500 pl-4">
                        <h4 className="font-bold text-lg text-gray-800 mb-2">Hessen</h4>
                        <div className="space-y-1">
                            <div>
                                <span className="font-semibold">Fachsprachprüfung – LÄK Hessen:</span>
                                <a href="https://www.laekh.de/fuer-aerzte/fachsprachenpruefung" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.laekh.de/fuer-aerzte/fachsprachenpruefung</a>
                            </div>
                            <div>
                                <span className="font-semibold">Approbation – HLfGP Hessen:</span>
                                <a href="https://rp-giessen.hessen.de/gesundheit-und-soziales/hessisches-landespruefungs-und-untersuchungsamt-im-gesundheitswesen" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://rp-giessen.hessen.de/gesundheit-und-soziales/hessisches-landespruefungs-und-untersuchungsamt-im-gesundheitswesen</a>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-l-4 border-purple-500 pl-4">
                        <h4 className="font-bold text-lg text-gray-800 mb-2">Nordrhein‑Westfalen</h4>
                        <div className="space-y-1">
                            <div>
                                <span className="font-semibold">Fachsprachprüfung – ÄK Nordrhein:</span>
                                <a href="https://www.aekno.de/fortbildung/fachsprachenpruefung" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.aekno.de/fortbildung/fachsprachenpruefung</a>
                            </div>
                            <div>
                                <span className="font-semibold">Fachsprachprüfung – ÄK Westfalen‑Lippe:</span>
                                <a href="https://www.aekwl.de/fuer-aerzte/weitere-themen/fachsprachenpruefung/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.aekwl.de/fuer-aerzte/weitere-themen/fachsprachenpruefung/</a>
                            </div>
                            <div>
                                <span className="font-semibold">Approbation – Bezirksregierungen NRW:</span>
                                <a href="https://www.br.nrw.de/themen/gesundheit-soziales/approbationen-gesundheitsberufe" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.br.nrw.de/themen/gesundheit-soziales/approbationen-gesundheitsberufe</a>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-6 p-3 bg-yellow-50 rounded-lg">
                        <strong>Notă:</strong> Linkurile pentru celelalte landuri (Mecklenburg‑Vorpommern, Niedersachsen, Rheinland‑Pfalz, Saarland, Sachsen, Sachsen‑Anhalt, Schleswig‑Holstein, Thüringen) sunt disponibile în versiunea completă a ghidului. Toate link‑urile au fost verificate în iunie 2025.
                    </p>
                </div>
            </div>
        )
    }
];

// Remove old subscription tiers definition - now handled by useSubscription hook

// Subscription Modal Component - Updated to use new hooks
const SubscriptionModal = ({ isOpen, onClose }) => {
    const { subscriptionTier, upgradeSubscription, SUBSCRIPTION_TIERS } = useSubscription();

    if (!isOpen) return null;

    const handleUpgrade = async (tier) => {
        const result = await upgradeSubscription(tier);
        if (result.success) {
            onClose();
            // In a real app, you'd redirect to payment processor
            if (tier !== 'FREE') {
                alert(`Redirection către procesarea plății pentru planul ${SUBSCRIPTION_TIERS[tier].name} (€${SUBSCRIPTION_TIERS[tier].price}/lună)`);
            }
        } else {
            alert(`Eroare: ${result.error}`);
        }
    };

    // Handle image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Validate file
            ImageOptimizer.validateFile(file);
            
            setUploadingImage(true);
            
            // Compress and convert to base64
            const base64Image = await ImageOptimizer.fileToBase64(file);
            
            const newImage = {
                id: Date.now(),
                name: file.name,
                data: base64Image,
                size: file.size,
                type: file.type
            };
            
            setUploadedImages(prev => [...prev, newImage]);
            
            // Add to conversation context
            const imageMessage = `📷 Am încărcat imaginea: ${file.name}. Poți să o analizezi și să-mi dai sfaturi specifice bazate pe documentul din imagine.`;
            conversationManager.addMessage('user', imageMessage);
            setHistory(prev => [...prev, { role: "user", parts: [{ text: imageMessage }] }]);
            
        } catch (error) {
            alert(error.message || 'Eroare la încărcarea imaginii.');
        } finally {
            setUploadingImage(false);
            if (imageInputRef.current) {
                imageInputRef.current.value = '';
            }
        }
    };

    const handleImageRemove = (imageId) => {
        setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[70] p-4 animate-fade-in-fast">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl text-gray-800 p-6 md:p-8 relative transform animate-scale-in">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
                    <X size={28} />
                </button>
                
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">Alege Planul Tău</h2>
                <p className="text-gray-600 text-center mb-8">Deblocează toate funcționalitățile pentru călătoria ta către Approbation</p>
                
                <div className="grid md:grid-cols-3 gap-6">
                    {/* Free Tier */}
                    <div className="border-2 border-gray-200 rounded-xl p-6 relative">
                        {subscriptionTier === 'FREE' && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                Plan Actual
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-center mb-2">Free</h3>
                        <div className="text-center mb-4">
                            <span className="text-3xl font-bold">€0</span>
                            <span className="text-gray-500">/lună</span>
                        </div>
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-500" />
                                <span className="text-sm">Primii 2 pași</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-500" />
                                <span className="text-sm">1 funcție bonus</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-500" />
                                <span className="text-sm">Dosarul personal complet</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <X size={16} className="text-red-500" />
                                <span className="text-sm text-gray-500">Fără suport AI</span>
                            </li>
                        </ul>
                        <button 
                            disabled={subscriptionTier === 'FREE'}
                            className="w-full py-3 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
                        >
                            Plan Curent
                        </button>
                    </div>

                    {/* Basic Tier */}
                    <div className="border-2 border-blue-500 rounded-xl p-6 relative">
                        {subscriptionTier === 'BASIC' && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                Plan Actual
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-center mb-2 text-blue-600">Basic</h3>
                        <div className="text-center mb-4">
                            <span className="text-3xl font-bold">€10</span>
                            <span className="text-gray-500">/lună</span>
                        </div>
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-500" />
                                <span className="text-sm">Toți cei 6 pași</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-500" />
                                <span className="text-sm">Toate funcțiile bonus</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-500" />
                                <span className="text-sm">Dosarul personal complet</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-500" />
                                <span className="text-sm">Ghiduri detaliate</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <X size={16} className="text-red-500" />
                                <span className="text-sm text-gray-500">Fără suport AI</span>
                            </li>
                        </ul>
                        <button 
                            onClick={() => handleUpgrade('BASIC')}
                            disabled={subscriptionTier === 'BASIC'}
                            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                                subscriptionTier === 'BASIC' 
                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                        >
                            {subscriptionTier === 'BASIC' ? 'Plan Actual' : 'Upgradeaza'}
                        </button>
                    </div>

                    {/* Premium Tier */}
                    <div className="border-2 border-purple-500 rounded-xl p-6 relative">
                        {subscriptionTier === 'PREMIUM' && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                Plan Actual
                            </div>
                        )}
                        <div className="absolute -top-3 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            RECOMANDAT
                        </div>
                        <h3 className="text-xl font-bold text-center mb-2 text-purple-600">Premium</h3>
                        <div className="text-center mb-4">
                            <span className="text-3xl font-bold">€30</span>
                            <span className="text-gray-500">/lună</span>
                        </div>
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-500" />
                                <span className="text-sm">Toți cei 6 pași</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-500" />
                                <span className="text-sm">Toate funcțiile bonus</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-500" />
                                <span className="text-sm">Dosarul personal complet</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Check size={16} className="text-green-500" />
                                <span className="text-sm">Ghiduri detaliate</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Sparkles size={16} className="text-purple-500" />
                                <span className="text-sm font-semibold">Suport AI complet</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Sparkles size={16} className="text-purple-500" />
                                <span className="text-sm font-semibold">Tutor FSP cu AI</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Sparkles size={16} className="text-purple-500" />
                                <span className="text-sm font-semibold">Generator emailuri AI</span>
                            </li>
                        </ul>
                        <button 
                            onClick={() => handleUpgrade('PREMIUM')}
                            disabled={subscriptionTier === 'PREMIUM'}
                            className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                                subscriptionTier === 'PREMIUM' 
                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                            }`}
                        >
                            {subscriptionTier === 'PREMIUM' ? 'Plan Actual' : 'Upgradeaza'}
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center text-sm text-gray-500">
                    <p>Poți anula oricând. Fără costuri ascunse.</p>
                </div>
            </div>
        </div>
    );
};
const initialStepsData = [
    { id: 1, title: 'Startul Călătoriei', icon: Rocket, description: 'Bun venit pe drumul către Approbation! Completează primii pași pentru a înțelege procesul și a porni la drum cu dreptul.', tasks: [ 
        { id: 101, text: 'Citește ghidul Approbation.', completed: false, viewed: false, action: { type: 'modal', content: { title: 'Ghid General Approbation', body: ( <div className="space-y-4 text-gray-600"> <p>Acest proces reprezintă recunoașterea completă a diplomei tale de medic în Germania. Călătoria este complexă și necesită multă organizare.</p> <h4 className="font-bold text-lg text-gray-800">Etapele Majore</h4> <ul className="list-disc list-inside space-y-2"> <li>Colectarea și traducerea documentelor.</li> <li>Învățarea limbii germane la nivel avansat (C1 Medicină).</li> <li>Aplicarea la un "Landesamt für Gesundheit" dintr-un land german.</li> <li>Susținerea examenului de limbaj medical (Fachsprachprüfung - FSP).</li> <li>(Dacă este cazul) Susținerea examenului de echivalare (Kenntnisprüfung - KP).</li> </ul> <p>Folosește această hartă pentru a te ghida. Fiecare pas deblocat este o victorie! Mult succes!</p> </div> ) } } },
        { id: 102, text: 'Confirmă adresa de e-mail.', completed: false, viewed: false, action: { type: 'modal', content: { title: 'Confirmarea Adresei de E-mail', body: ( <div className="space-y-4 text-gray-600"> <p><b>De ce este important?</b> Adresa de e-mail este esențială pentru comunicarea cu autoritățile germane și pentru primirea confirmărilor importante.</p> <p><b>Ce trebuie să faci:</b> Verifică că ai acces la adresa de e-mail pe care o vei folosi în dosarul de Approbation. Asigură-te că este o adresă profesională și că o verifici regulat.</p> <p><b>Sfat:</b> Creează o mapă separată în e-mail pentru toată corespondența legată de Approbation pentru a fi organizat.</p> </div> ) } } },
        { id: 103, text: 'Citește Recomandări & Sfaturi Utile.', completed: false, viewed: false, action: { type: 'modal', content: { title: 'Tips & Tricks pentru Călătoria Ta', body: ( <div className="space-y-4 text-gray-600"> <h4 className="font-bold text-lg text-gray-800">Diferențe între Landuri</h4> <p>Fiecare Land are propriul "Landesprüfungsamt" sau "Approbationsbehörde" cu cerințe ușor diferite. Unele landuri (ex. Bayern, Baden-Württemberg) sunt cunoscute ca fiind mai stricte, în timp ce altele (ex. Thüringen, Hessen) pot avea procese mai rapide. Alege landul cu atenție, în funcție de oportunitățile de muncă și de cerințele specifice.</p> <h4 className="font-bold text-lg text-gray-800">Bugetul Necesar</h4> <p>Procesul poate fi costisitor. Iată o estimare brută: <b>Buget de pornire: 2000-3000€</b> (pentru acte, traduceri, taxe inițiale). <b>Buget total: 5000-10000€+</b>, incluzând cursuri de limbă, costul examenelor (FSP ~400-600€, KP ~600-1100€), cheltuieli de trai până la primul salariu. Este esențial să ai o rezervă financiară.</p> <h4 className="font-bold text-lg text-gray-800">Durata Procesului</h4> <p>În cel mai bun caz, procesul poate dura 1-1.5 ani. Factorii care influențează durata sunt: viteza cu care înveți limba, timpul de așteptare pentru programarea la examene (poate dura luni de zile!), și timpul de procesare a dosarului de către autorități, care variază enorm între landuri.</p> </div> )}}} 
    ] },
    { id: 2, title: 'Documente din România', icon: FileText, description: 'Primul set de documente. Acestea trebuie obținute din România înainte de a putea aplica.', tasks: [ 
        { id: 200, text: 'Înțelege Ordinea Colectării Actelor.', completed: false, viewed: false, action: {type: 'modal', content: {title: 'Strategia Colectării Documentelor', body: <div className="space-y-3 text-gray-600"><p>Ordinea în care obții documentele este crucială din cauza termenelor de valabilitate.</p><p><b>Pasul 1: Acte fără termen de valabilitate.</b> Începe cu acestea: Diplomă de Licență, Supliment la Diplomă, Certificat de Conformitate. Obținerea lor poate dura, deci ocupă-te de ele din timp.</p><p><b>Pasul 2: Acte cu valabilitate mai lungă.</b> Cazierul Judiciar este valabil 6 luni. Îl poți obține după ce ai actele de la pasul 1.</p><p><b>Pasul 3: Acte cu valabilitate scurtă.</b> Adeverința de "Good Standing" și Certificatul Medical sunt valabile doar 1-3 luni. Obține-le ultimele, chiar înainte de a trimite dosarul, pentru a te asigura că nu expiră în timpul procesării.</p></div>}} },
        { id: 201, text: 'Obține Diploma de Licență și Suplimentul.', completed: false, viewed: false, action: {type: 'modal', content: {title: 'Detalii: Diplomă și Supliment', body: <div className="space-y-3 text-gray-600"><p><b>Ce sunt?</b> Documentele care atestă absolvirea facultății de medicină.</p><p><b>De ce sunt necesare?</b> Stau la baza întregului dosar. Fără ele, nu se poate începe procesul.</p><p><b>Atenție:</b> Asigură-te că ai ambele documente, în original. Unele autorități germane pot cere copii legalizate, care se fac la notar.</p></div>}} },
        { id: 202, text: 'Obține Certificatul de Conformitate.', completed: false, viewed: false, action: {type: 'modal', content: {title: 'Detalii: Certificat de Conformitate', body: <div className="space-y-3 text-gray-600"><p><b>Ce este?</b> Un document eliberat de Ministerul Sănătății care atestă că formarea ta ca medic este conformă cu directivele UE.</p><p><b>De ce este necesar?</b> Este esențial pentru recunoașterea automată a diplomei în spațiul UE.</p><p><b>Cum se obține?</b> Se depune o cerere la Ministerul Sănătății. Procesul poate dura câteva săptămâni. Caută pe Google "Certificat de conformitate Ministerul Sănătății medici" pentru a găsi lista de acte și formulare.</p><a href="https://www.ms.ro/ro/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Link către Ministerul Sănătății</a></div>}} },
        { id: 203, text: 'Obține Adeverința de "Good Standing".', completed: false, viewed: false, action: {type: 'modal', content: {title: 'Detalii: Good Standing Certificate', body: <div className="space-y-3 text-gray-600"><p><b>Ce este?</b> O adeverință de la Colegiul Medicilor din România care certifică faptul că ai drept de liberă practică și nu ai abateri profesionale.</p><p><b>Atenție:</b> Acest document are o valabilitate limitată, de obicei 3 luni! Nu-l solicita prea devreme.</p><p><b>Cum se obține?</b> Se face o cerere la Colegiul Medicilor din județul în care ești înscris.</p></div>}} },
        { id: 204, text: 'Obține Cazierul Judiciar.', completed: false, viewed: false, action: {type: 'modal', content: {title: 'Detalii: Cazier Judiciar', body: <div className="space-y-3 text-gray-600"><p><b>Ce este?</b> Atestă că nu ai înscrieri în cazierul judiciar.</p><p><b>De ce este necesar?</b> Autoritățile germane cer acest document pentru a se asigura de integritatea ta.</p><p><b>Atenție:</b> Are o valabilitate de 6 luni. Costul este de obicei zero.</p><p><b>Cum se obține?</b> Poate fi obținut fizic de la orice secție de poliție sau online, prin Ghișeul.ro sau hub.mai.gov.ro.</p></div>}} }
    ] },
    { id: 3, title: 'Limba Germană și FSP', icon: BookOpen, description: 'Una dintre cele mai importante etape. Fără un nivel avansat de limbă, procesul nu poate avansa.', status: 'locked', tasks: [ 
        { id: 301, text: 'Atinge nivelul B2 General.', completed: false, viewed: false, action: {type: 'modal', content: {title: 'Detalii: Nivel B2 General', body: <p>Majoritatea landurilor cer un certificat de limbă B2 (ex: Goethe, Telc) ca pre-condiție pentru a te putea înscrie la examenul de limbaj medical (FSP).</p>}} },
        { id: 302, text: 'Urmează un curs de C1 Medicină.', completed: false, viewed: false, action: {type: 'modal', content: {title: 'Detalii: Curs C1 Medicină (Fachsprache)', body: <p>Aceste cursuri sunt specializate pe terminologie medicală, structura sistemului medical german și pregătirea specifică pentru examenul FSP. Sunt extrem de recomandate.</p>}} }
    ] },
    { id: 4, title: 'Traduceri și Aplicare', icon: Send, description: 'Cu documentele și limba germană pregătite, este timpul să aplici oficial.', status: 'locked', tasks: [ 
        { id: 401, text: 'Tradu documentele la un traducător autorizat.', completed: false, viewed: false, action: {type: 'modal', content: {title: 'Detalii: Traducători autorizați', body: <div className="space-y-3 text-gray-600"><p>Toate documentele în limba română trebuie traduse în germană. Traducerea trebuie făcută de un traducător autorizat de o instanță din Germania ("vereidigter Übersetzer").</p><p><b>Costuri:</b> În Germania, costurile sunt mai mari (20-50€/pagină standard), dar traducerile sunt acceptate fără probleme. În România, costurile sunt mai mici, dar există riscul ca unele landuri să nu le accepte. Majoritatea candidaților aleg traducători autorizați din Germania pentru siguranță.</p><p><b>Cum găsești?</b> Caută pe Google "vereidigter Übersetzer Rumänisch" sau pe platforma oficială: <a href="https://www.justiz-dolmetscher.de/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">justiz-dolmetscher.de</a>.</p></div>}} },
        { id: 402, text: 'Trimite dosarul complet prin poștă.', completed: false, viewed: false, action: {type: 'modal', content: {title: 'Detalii: Trimiterea Dosarului', body: <div className="space-y-3 text-gray-600"><p><b>Ce se trimite?</b> De regulă, se trimit copiile legalizate ale documentelor originale și traducerile autorizate. Unele landuri pot solicita anumite documente în original (ex: certificatul medical). Verifică lista exactă a autorității din landul tău!</p><p><b>Ce poștă?</b> Folosește un serviciu de curierat internațional (ex: DHL, UPS) care oferă urmărire (Tracking). Costă mai mult (~50-70€), dar este sigur. Alternativ, poți folosi serviciul "Einschreiben" de la poșta germană/română.</p><p><b>Cât durează?</b> Câteva zile lucrătoare prin curier rapid.</p></div>}} }
    ] },
    { id: 5, title: 'Examene de Echivalare', icon: Users, description: 'Dacă diploma ta nu este considerată echivalentă, vei primi un "Defizitbescheid" și va trebui să susții examene.', status: 'locked', tasks: [ 
        { id: 501, text: 'Analizează "Defizitbescheid"-ul.', completed: false, viewed: false, action: {type: 'modal', content: {title: 'Detalii: Defizitbescheid', body: <p>Este documentul oficial prin care autoritatea germană îți comunică dacă diploma ta este considerată echivalentă ("gleichwertig") sau nu. Dacă nu este, acest document va specifica materiile la care ai deficiențe și te va informa despre necesitatea susținerii examenului de echivalare (Kenntnisprüfung).</p>}} },
        { id: 502, text: 'Înscrie-te la examenul Kenntnisprüfung.', completed: false, viewed: false, action: { type: 'modal', content: { title: 'Despre Kenntnisprüfung (KP) - Detalii Esențiale', body: <div className="space-y-4 text-gray-600"> <p><b>De ce?</b> KP este necesar atunci când autoritățile germane constată "deficiențe substanțiale" între formarea ta medicală din România și curicula germană. Este o modalitate de a demonstra că ai cunoștințe echivalente cu ale unui absolvent german.</p> <p><b>Organizare și Costuri:</b> Examenul este organizat de Camera Medicilor (`Ärztekammer`) din landul respectiv. Costurile variază, dar se situează în general între 600€ și 1100€. Timpul de așteptare pentru o programare poate fi de la câteva luni la peste un an, în funcție de land.</p> <p><b>Structura și Dificultate:</b> Este un examen oral-practic, centrat pe un caz clinic. Evaluează cunoștințele din Medicină Internă, Chirurgie, și o a treia materie la alegere (sau impusă). Dificultatea este ridicată; examenul este considerat mai greu decât multe examene din timpul facultății.</p> <p><b>Pregătire:</b> Sursele de bază sunt manualele standard germane (ex. Herold pentru Medicină Internă). Cursurile de pregătire specializate pentru KP sunt extrem de recomandate și cresc semnificativ rata de succes.</p> <p><b>Pot lucra fără KP?</b> Da. După FSP, poți obține o autorizație temporară de practică (`Berufserlaubnis`), valabilă de obicei 2 ani. În acest timp poți lucra ca medic sub supraveghere (`Assistenzarzt`) și te poți pregăti pentru KP. Nu poți obține Approbation (drept de liberă practică deplin) fără a promova KP, dacă acesta a fost impus.</p> </div> }}}, 
        { id: 503, text: 'Promovează examenul Kenntnisprüfung.', completed: false, viewed: false, action: {type: 'modal', content: {title: 'Felicitări pentru promovare!', body: <p>Promovarea acestui examen este, de obicei, ultimul obstacol academic înainte de a primi Approbation-ul. Este o realizare majoră!</p>}} }
    ] },
    { id: 6, title: 'Approbation Obținut!', icon: Target, description: 'Felicitări, Doktortitel! Ai parcurs tot drumul și ai obținut dreptul de liberă practică în Germania. ', status: 'locked', tasks: [ 
        { id: 601, text: 'Primește Approbationsurkunde.', completed: false, viewed: false, action: {type: 'modal', content: {title: 'Detalii: Approbationsurkunde', body: <div className="space-y-4 text-gray-600"><p><b>Ce este?</b> Este documentul final, "Sfântul Graal" al acestui proces. Atestă dreptul tău deplin și nelimitat de a profesa ca medic pe teritoriul Germaniei.</p><p><b>Când îl primesc?</b> De obicei, la câteva săptămâni după promovarea ultimului examen necesar (FSP sau KP). Taxa pentru eliberarea documentului (~200-400€) se achită în acest interval.</p><p><b>Sfat Important:</b> Când ridici documentul personal, solicită pe loc eliberarea a 1-2 copii legalizate ("beglaubigte Kopien"). Le vei avea nevoie pentru angajare și înscrierea la Camera Medicilor și te scutește de un drum ulterior la notar.</p></div>}} },
        { id: 602, text: 'Înscrie-te la Camera Medicilor.', completed: false, viewed: false, action: {type: 'modal', content: {title: 'Detalii: Înscrierea la Ärztekammer', body: <div className="space-y-4 text-gray-600"><p><b>Este obligatoriu?</b> Da, absolut. Orice medic care profesează în Germania trebuie să fie membru al Camerei Medicilor din landul respectiv.</p><p><b>Până când?</b> Imediat după primirea Approbation-ului și înainte de a începe efectiv lucrul. Nu poți lucra fără a fi înscris.</p><p><b>Costuri:</b> Există o taxă de înscriere și o cotizație anuală. Cotizația este procentuală din venitul brut ca medic și variază între landuri (poate fi de la câteva sute la peste o mie de euro pe an).</p><p><b>Unde și cum?</b> Procesul se face la sediul Ärztekammer din landul tău. Vei avea nevoie de Approbationsurkunde și alte documente personale. Verifică site-ul lor oficial pentru lista exactă.</p></div>}} },
        { id: 603, text: 'Sărbătorește succesul!', completed: false, viewed: false, action: {type: 'modal', content: {title: 'E timpul pentru o pauză!', body: <p>Ai muncit enorm pentru a ajunge aici. Nu uita să iei o pauză și să te bucuri de această realizare extraordinară înainte de a începe următorul capitol al carierei tale!</p>}} }
    ] },
];

// Node positions for the SVG path (adjusted and all 6 nodes visible)
const nodePositions = [
    { x: 200, y: 80 },
    { x: 120, y: 160 },
    { x: 280, y: 240 },
    { x: 160, y: 320 },
    { x: 240, y: 400 },
    { x: 140, y: 480 }
];

// Static bonus nodes positioned laterally away from step nodes
const bonusNodes = [
    { id: 'fsp_tutor', icon: MessageCircle, title: 'Simulator FSP', position: { x: 340, y: 130 }, action: { type: 'gemini_fsp_tutor' } },
    { id: 'email_gen', icon: Mail, title: 'Generator Email', position: { x: 50, y: 270 }, action: { type: 'gemini_email_generator' } },
    { id: 'land_rec', icon: Compass, title: 'Recomandare Land', position: { x: 350, y: 370 }, action: { type: 'gemini_land_recommender' } },
    { id: 'info_hub', icon: Info, title: 'Informații Utile', position: { x: 50, y: 440 }, action: { type: 'info_hub' } }
];

// --- Personal File Modal Component - Updated to use new API integration ---
const PersonalFileModal = ({ isOpen, onClose }) => {
    const { files, loading, addFile, uploadFile, deleteFile, handleFileClick } = usePersonalFiles();
    const [newItemType, setNewItemType] = useState(null);
    const [noteContent, setNoteContent] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [linkTitle, setLinkTitle] = useState('');
    const fileInputRef = useRef(null);
    const modalRef = useRef(null);

    // Chatbot state
    const [history, setHistory] = useState([]);
    const [prompt, setPrompt] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef(null);
    
    // Image upload state
    const [uploadedImages, setUploadedImages] = useState([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const imageInputRef = useRef(null);

    // Handle click outside - close completely since this is a top-level modal
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            setHistory([{role: 'model', parts: [{ text: 'Salut! Sunt asistentul tău personal. Mă poți întreba despre pașii următori, valabilitatea documentelor sau orice altceva legat de procesul de Approbation.'}]}]);
        }
    }, [isOpen]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleAddItem = async () => {
        let newItem = null;
        if (newItemType === 'note' && noteContent.trim()) {
            newItem = { type: 'note', content: noteContent.trim() };
        } else if (newItemType === 'link' && linkUrl.trim()) {
            let formattedUrl = linkUrl.trim();
            if (!/^https?:\/\//i.test(formattedUrl)) {
                formattedUrl = 'https://' + formattedUrl;
            }
            newItem = { type: 'link', url: formattedUrl, title: linkTitle.trim() || linkUrl.trim() };
        }
        
        if (newItem) {
            try {
                await addFile(newItem);
                setNewItemType(null);
                setNoteContent('');
                setLinkUrl('');
                setLinkTitle('');
            } catch (error) {
                console.error('Failed to add item:', error);
                alert('Failed to add item. Please try again.');
            }
        }
    };
    
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                await uploadFile(file);
            } catch (error) {
                console.error('Failed to upload file:', error);
                alert('Failed to upload file. Please try again.');
            }
        }
    };
    
    const handleDeleteItem = async (id) => {
        try {
            await deleteFile(id);
        } catch (error) {
            console.error('Failed to delete item:', error);
            alert('Failed to delete item. Please try again.');
        }
    };

    const callGeminiAssistantAPI = async (currentPrompt) => {
        setChatLoading(true);
        const systemPrompt = `Du bist ein hochqualifizierter Berater für ausländische Ärzte, die ihre Approbation in Deutschland anstreben. Du bist auf den Prozess für rumänische Ärzte spezialisiert. Deine Antworten müssen präzise, hilfreich und auf den bereitgestellten Dokumenten basieren.
        
        **Deine Aufgabe:**
        1.  **Antworte auf die Fragen des Nutzers auf Rumänisch:** Beantworte Fragen zum Approbationsprozess, zur Reihenfolge der Dokumente, zu deren Gültigkeit, zu den nächsten Schritten usw.
        2.  **Sei kontextbewusst:** Beziehe dich auf die vom Nutzer in der linken Spalte gespeicherten Notizen und Dateien, um personalisierte Ratschläge zu geben.
        3.  **Gib klare, strukturierte Antworten:** Verwende Listen, Fettformatierungen und klare Formulierungen mit Markdown:
           - **Text îngroșat**: **text**
           - *Text italic*: *text*
           - Liste numerotate: 1. punct, 2. punct
           - Liste cu puncte: • punct sau - punct
           - Emoji-uri pentru a face răspunsul mai prietenos
        4.  **Gib Links und Referenzen:** Wenn möglich, gib Links zu offiziellen Quellen (z.B. Landesprüfungsämter, Bundesärztekammer) oder verweise auf relevante Abschnitte in den vom Nutzer bereitgestellten Vorbereitungsdokumenten.
        5.  **Sei ermutigend und professionell.**
        
        **Aktueller Status der gespeicherten Elemente des Nutzers:**
        ${files.length > 0 ? files.map(it => `- ${it.type.toUpperCase()}: ${it.title || it.content?.substring(0, 40) + '...' || 'Untitled'}`).join('\n') : "Niciun element salvat."}
        
        Antworte jetzt auf die folgende Frage des Nutzers auf Rumänisch:`;

        // Start conversation if needed
        if (!conversationManager.currentConversationId) {
            conversationManager.startNewConversation('assistant');
        }

        // Add user message to conversation manager
        conversationManager.addMessage('user', currentPrompt);

        // Get optimized history from conversation manager
        const optimizedHistory = conversationManager.getOptimizedHistory();
        const apiHistory = [ 
            { role: "user", parts: [{ text: systemPrompt }] }, 
            { role: "model", parts: [{ text: "Înțeles. Cum vă pot ajuta? 😊" }] }, 
            ...optimizedHistory 
        ];

        try { 
            const payload = { contents: apiHistory }; 
            const apiKey = process.env.REACT_APP_GEMINI_API_KEY; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`; 
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); 
            const result = await response.json(); 
            
            let responseText = "Scuze, nu pot răspunde acum. 😅";
            
            if (result.candidates && result.candidates.length > 0) { 
                const newResponse = result.candidates[0].content; 
                responseText = newResponse.parts[0].text;
                
                // Add AI response to conversation manager
                conversationManager.addMessage('model', responseText);
                
                // Track cost
                const totalTokens = conversationManager.estimateTokens(JSON.stringify(payload)) + 
                                  conversationManager.estimateTokens(responseText);
                CostTracker.updateCost(totalTokens);
                
                setHistory(prev => [...prev, { role: "user", parts: [{ text: currentPrompt }] }, newResponse]); 
            } else { 
                conversationManager.addMessage('model', responseText);
                setHistory(prev => [...prev, { role: "user", parts: [{ text: currentPrompt }] }, { role: 'model', parts: [{ text: responseText}] }]); 
            } 
        } catch (error) { 
            console.error("Error calling Gemini API:", error); 
            const errorResponse = "A apărut o eroare. Vă rog să încercați din nou. 🔧";
            conversationManager.addMessage('model', errorResponse);
            setHistory(prev => [...prev, { role: "user", parts: [{ text: currentPrompt }] }, { role: 'model', parts: [{ text: errorResponse}] }]); 
        } finally { 
            setChatLoading(false); 
            setPrompt(''); 
        } 
    };

    const handleSend = () => { if (prompt.trim() && !chatLoading) { callGeminiAssistantAPI(prompt.trim()); } };

    const renderItem = (item) => {
        const itemIcon = {
            note: <StickyNote className="h-5 w-5 text-yellow-600 flex-shrink-0" />,
            link: <LinkIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />,
            file: <FileText className="h-5 w-5 text-purple-600 flex-shrink-0" />,
        };
        const isClickable = item.type === 'file';

        return (
            <div 
                key={item.id} 
                className={`bg-white p-3 rounded-lg shadow-sm flex items-start gap-3 transition-all ${isClickable ? 'cursor-pointer hover:shadow-md hover:bg-gray-50' : ''}`}
                onClick={() => isClickable && handleFileClick(item)}
            >
                <div className="mt-1">{itemIcon[item.type]}</div>
                <div className="flex-grow min-w-0">
                    {item.type === 'note' && <p className="text-gray-700 whitespace-pre-wrap break-words">{item.content}</p>}
                    {item.type === 'link' && <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-600 hover:underline break-all" title={item.url}>{item.title}</a>}
                    {item.type === 'file' && <p className="text-gray-700 truncate" title={item.title}>{item.title}</p>}
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }} 
                    className="text-gray-400 hover:text-red-500 flex-shrink-0 p-1"
                >
                    <Trash2 size={18} />
                </button>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 animate-fade-in-fast">
            <div ref={modalRef} className="bg-gray-100 rounded-2xl shadow-2xl w-full max-w-6xl text-gray-800 relative transform animate-scale-in flex flex-col max-h-[90vh] overflow-hidden">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors z-20"><X size={28} /></button>
                <h2 className="text-2xl md:text-3xl font-bold p-6 pb-2 text-center md:text-left flex-shrink-0">Dosarul Meu & Asistent Personal</h2>
                
                <div className="grid md:grid-cols-2 flex-grow min-h-0 gap-6 p-6 pt-2">
                    {/* Left Column: File Management */}
                    <div className="flex flex-col bg-gray-200 p-4 rounded-lg min-h-0">
                        <h3 className="text-lg font-bold mb-3 flex-shrink-0 text-gray-700">Resurse Personale</h3>
                         <div className="flex-shrink-0 flex flex-wrap justify-center gap-2 mb-3 p-2 bg-gray-300 rounded-lg">
                            <button onClick={() => setNewItemType('note')} className="flex-1 text-sm flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white hover:bg-yellow-100 text-yellow-800 shadow-sm transition-colors">
                                <StickyNote size={18}/> Notiță
                            </button>
                            <button onClick={() => setNewItemType('link')} className="flex-1 text-sm flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white hover:bg-blue-100 text-blue-800 shadow-sm transition-colors">
                                <LinkIcon size={18}/> Link
                            </button>
                            <button onClick={() => fileInputRef.current?.click()} className="flex-1 text-sm flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-white hover:bg-purple-100 text-purple-800 shadow-sm transition-colors">
                               <Upload size={18}/> Fișier
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                        </div>
                        {newItemType && (
                             <div className="bg-white p-3 rounded-lg mb-3 border border-gray-300 flex-shrink-0">
                                {newItemType === 'note' && <textarea value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="Scrie notița aici..." className="w-full p-2 border rounded-md" rows="3"/>}
                                {newItemType === 'link' && (<div className="space-y-2"><input type="text" value={linkTitle} onChange={e => setLinkTitle(e.target.value)} placeholder="Titlu (opțional)" className="w-full p-2 border rounded-md" /><input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://exemplu.com" className="w-full p-2 border rounded-md" /></div>)}
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setNewItemType(null)} className="px-3 py-1 text-sm rounded-md bg-gray-200 hover:bg-gray-300">Anulează</button>
                                    <button onClick={handleAddItem} className="px-3 py-1 text-sm rounded-md bg-green-500 text-white hover:bg-green-600">Salvează</button>
                                </div>
                            </div>
                        )}
                        <div className="flex-grow overflow-y-auto space-y-3 pr-2 -mr-2">
                             {loading ? (
                                <div className="text-center text-gray-500 pt-10">Se încarcă...</div>
                             ) : files.length > 0 ? files.map(renderItem) : (
                                <div className="text-center text-gray-500 pt-10">
                                    <p>Dosarul tău este gol.</p>
                                    <p className="text-sm">Folosește butoanele de mai sus pentru a adăuga elemente.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Chatbot */}
                    <div className="flex flex-col bg-gray-200 p-4 rounded-lg min-h-0">
                         <h3 className="text-lg font-bold mb-3 flex items-center flex-shrink-0 text-gray-700"><Sparkles className="text-purple-600 mr-2"/> Asistent Approbation</h3>
                         <div className="flex-grow bg-white rounded-lg p-4 overflow-y-auto mb-4 border border-gray-300">
                            {history.map((msg, index) => (
                                 <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                                     <div className={`p-3 rounded-lg max-w-lg shadow-sm ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                         {msg.role === 'user' ? msg.parts[0].text : renderMarkdown(msg.parts[0].text)}
                                     </div>
                                 </div>
                             ))}
                             {chatLoading && <div className="flex justify-start"><div className="p-3 rounded-lg bg-gray-100 text-gray-800">...</div></div>}
                             <div ref={chatEndRef} />
                         </div>
                         
                         {/* Image Upload Section */}
                         <input
                             type="file"
                             ref={imageInputRef}
                             onChange={handleImageUpload}
                             accept="image/*,application/pdf"
                             className="hidden"
                         />
                         
                         {/* Display uploaded images */}
                         {uploadedImages.length > 0 && (
                             <div className="mb-3 flex flex-wrap gap-2">
                                 {uploadedImages.map(image => (
                                     <div key={image.id} className="relative bg-gray-100 p-2 rounded-lg border">
                                         <div className="flex items-center gap-2">
                                             <ImageIcon className="h-4 w-4 text-blue-600" />
                                             <span className="text-sm text-gray-700 truncate max-w-[120px]">{image.name}</span>
                                             <button
                                                 onClick={() => handleImageRemove(image.id)}
                                                 className="text-red-500 hover:text-red-700"
                                             >
                                                 <X className="h-4 w-4" />
                                             </button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         )}
                         
                         <div className="flex items-center flex-shrink-0">
                             <button
                                 onClick={() => imageInputRef.current?.click()}
                                 disabled={uploadingImage}
                                 className="bg-gray-500 text-white p-3 border hover:bg-gray-600 disabled:bg-gray-400 flex items-center justify-center"
                                 title="Adaugă imagine sau document"
                             >
                                 {uploadingImage ? <RefreshCw className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                             </button>
                             <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !chatLoading && handleSend()} className="flex-grow p-3 border focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Pune o întrebare sau încarcă o imagine..." />
                             <button onClick={handleSend} disabled={chatLoading} className="bg-purple-600 text-white p-3 rounded-r-lg hover:bg-purple-700 disabled:bg-purple-400"><Send /></button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Bundesland Recommender Modal ---
const BundeslandRecommenderModal = ({ onClose }) => {
    const criteriaOptions = [
      { id: 'cost', label: 'Cost de Trai & Chirii Scăzute' },
      { id: 'jobs', label: 'Oportunități de Angajare Bune' },
      { id: 'social', label: 'Viață Socială & Culturală Activă' },
      { id: 'integration', label: 'Comunitate Mare de Expați' },
      { id: 'nature', label: 'Aproape de Natură & Aer Liber' },
      { id: 'family', label: 'Potrivit pentru Familii' },
      { id: 'process', label: 'Proces de Approbation Rapid' },
      { id: 'accent', label: 'Accent Lingvistic Ușor' },
      { id: 'travel', label: 'Conexiuni Bune de Călătorie' }
    ];

    const germanStates = [
      'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen', 
      'Mecklenburg-Vorpommern', 'Niedersachsen', 'Nordrhein-Westfalen', 'Rheinland-Pfalz', 
      'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'
    ];
    
    const [view, setView] = useState('selection');
    const [selectedCriteria, setSelectedCriteria] = useState([]);
    const [interestedLands, setInterestedLands] = useState([]);
    const [customText, setCustomText] = useState('');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const modalRef = useRef(null);

    // Handle click outside - go one step back
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                if (view === 'result') {
                    setView('selection'); // Go back to selection
                } else {
                    onClose(); // Close completely
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [view, onClose]);

    const toggleCriterion = (id) => {
        setSelectedCriteria(prev => 
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const toggleInterestedLand = (land) => {
        setInterestedLands(prev =>
            prev.includes(land) ? prev.filter(l => l !== land) : [...prev, land]
        );
    };

    const createPrompt = () => {
        const criteriaText = selectedCriteria.map(id => criteriaOptions.find(c => c.id === id)?.label).join(', ');
        const interestedLandsText = interestedLands.join(', ');

        let taskInstruction;
        if (interestedLandsText) {
            taskInstruction = `Analizează și compară **doar** următoarele landuri pre-selectate de utilizator: **${interestedLandsText}**. Clasifică-le în funcție de prioritățile utilizatorului și oferă o analiză detaliată pentru fiecare.`;
        } else {
            taskInstruction = `Basierend auf diesen Prioritäten, erstelle eine Top-3-Liste der am besten geeigneten Bundesländer.`;
        }
        
        return `Du bist ein Experte für das Leben und Arbeiten in Deutschland, spezialisiert auf die Beratung von ausländischen Ärzten. Ein Arzt aus Rumänien sucht nach dem idealen Bundesland für sich und bittet um deine Hilfe.

**Prioritäten des Arztes:**
${criteriaText ? `- Wichtige Kriterien: ${criteriaText}` : '- Keine spezifischen Kriterien ausgewählt.'}
${customText ? `- Persönliche Anmerkungen: "${customText}"` : ''}
${interestedLandsText ? `- Landuri de interes specific: ${interestedLandsText}` : ''}

**Deine Aufgabe:**
${taskInstruction}

Präsentiere deine Antwort **auf Rumänisch** und formatiere sie mit Markdown für gute Lesbarkeit.

Für jedes Bundesland in deiner Analyse, gib bitte die folgenden Informationen an:
1.  **De ce este o alegere bună?** O scurtă descriere a motivelor pentru care acest land se potrivește profilului.
2.  **Analiza Criteriilor:** Explică detaliat cum se aliniază landul cu fiecare dintre prioritățile selectate.
3.  **Pro & Contra:** O listă echilibrată de avantaje și dezavantaje specifice pentru un medic din România.
4.  **Plan de Acțiune:** Pași concreți și practici pentru a începe (ex. autoritatea relevantă pentru Approbation, portaluri de joburi recomandate în regiune, sfaturi pentru integrare).

Strukturiere deine Antwort klar und beginne direkt mit der Empfehlung für Platz 1. Sei ermutigend und professionell.`;
    };

    const getRecommendation = async () => {
        setLoading(true);
        setView('loading');
        const prompt = createPrompt();
        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const apiKey = process.env.REACT_APP_GEMINI_API_KEY; 
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const apiResult = await response.json();
            if (apiResult.candidates && apiResult.candidates.length > 0) {
                setResult(apiResult.candidates[0].content.parts[0].text);
            } else {
                setResult("Nu am putut genera o recomandare. Vă rugăm să încercați din nou.");
            }
        } catch (error) {
            console.error("Error calling Gemini API for land recommendation:", error);
            setResult("A apărut o eroare de rețea. Vă rugăm verificați conexiunea și încercați din nou.");
        } finally {
            setLoading(false);
            setView('result');
        }
    };

    // Simple Markdown renderer
    const SimpleMarkdownRenderer = ({ text }) => {
        const lines = text.split('\n').map(line => line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'));
        return (
            <div className="space-y-2 text-gray-700">
                {lines.map((line, index) => {
                    if (line.startsWith('### ')) return <h4 key={index} className="text-lg font-bold mt-3 text-gray-800">{line.substring(4)}</h4>;
                    if (line.startsWith('## ')) return <h3 key={index} className="text-xl font-bold mt-4 border-b pb-1 text-gray-900">{line.substring(3)}</h3>;
                    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) return <p key={index} className="ml-5 relative before:content-['•'] before:absolute before:-left-4 before:text-blue-500" dangerouslySetInnerHTML={{ __html: line.trim().substring(2) }} />;
                    if (line.trim() === "") return <div key={index} className="h-2"></div>;
                    return <p key={index} dangerouslySetInnerHTML={{ __html: line }} />;
                })}
            </div>
        );
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 animate-fade-in-fast">
        <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl text-gray-800 p-6 md:p-8 relative transform animate-scale-in flex flex-col max-h-[90vh]">
            <button onClick={view === 'result' ? () => setView('selection') : onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors z-10"><X size={28} /></button>
             <div className="flex-shrink-0 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-center flex items-center justify-center gap-2"><Compass className="text-blue-600"/> Consilier Federal</h2>
                <p className="text-gray-600 text-center mt-2">Găsește landul perfect pentru tine pe baza priorităților tale.</p>
            </div>
            {view === 'loading' && <div className="flex-grow flex items-center justify-center"><p className="text-lg font-semibold animate-pulse">AI-ul analizează preferințele tale...</p></div>}
            {view === 'result' && (
                <div className="flex-grow overflow-y-auto pr-4 -mr-4">
                    <SimpleMarkdownRenderer text={result} />
                    <button onClick={() => setView('selection')} className="w-full mt-6 bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700">Modifică preferințele</button>
                </div>
            )}
            {view === 'selection' && (
                <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-6">
                    <div>
                        <h3 className="font-bold text-lg mb-3">1. Selectează ce este cel mai important pentru tine:</h3>
                        <div className="flex flex-wrap gap-3">
                            {criteriaOptions.map(c => (
                                <button key={c.id} onClick={() => toggleCriterion(c.id)} className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200 ${selectedCriteria.includes(c.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'}`}>
                                    {c.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-3">2. (Opțional) Ai deja câteva landuri în minte?</h3>
                        <p className="text-sm text-gray-500 mb-3">Selectează-le aici, iar AI-ul se va concentra pe analiza lor comparativă. Dacă nu selectezi niciunul, AI-ul îți va sugera top 3 din toată Germania.</p>
                        <div className="flex flex-wrap gap-2">
                            {germanStates.map(land => (
                                <button key={land} onClick={() => toggleInterestedLand(land)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all duration-200 ${interestedLands.includes(land) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-500'}`}>
                                    {land}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-lg mb-3">3. Adaugă orice alt detaliu relevant:</h3>
                        <textarea value={customText} onChange={e => setCustomText(e.target.value)} rows="4" placeholder="Ex: Vreau un oraș mare, dar nu foarte aglomerat; este important să am acces la un aeroport internațional; prefer o zonă unde se vorbește germana standard etc." className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                    </div>

                     <button onClick={getRecommendation} className="w-full mt-6 bg-green-600 text-white font-bold p-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                        <Sparkles size={20}/> Obține Recomandare Personalizată
                    </button>
                </div>
            )}
        </div>
      </div>
    );
};

// --- Info Hub Modal ---
const InfoHubModal = ({ isOpen, onClose, fromStepModal = false }) => {
    const [view, setView] = useState('list');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const modalRef = useRef(null);

    // Handle click outside - go one step back
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                if (view === 'detail') {
                    handleBack(); // Go back to list view
                } else {
                    onClose(); // Close completely (back to main app or step modal)
                }
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen, view, onClose]);

    const handleSelectDoc = (doc) => {
        setSelectedDoc(doc);
        setView('detail');
    };

    const handleBack = () => {
        setView('list');
        setSelectedDoc(null);
    };

    const handleClose = () => {
        setView('list');
        setSelectedDoc(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 animate-fade-in-fast">
            <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl text-gray-800 p-6 md:p-8 relative transform animate-scale-in flex flex-col max-h-[90vh]">
                <button onClick={view === 'detail' ? handleBack : handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors z-10"><X size={28} /></button>
                
                {view === 'list' && (
                    <>
                        <h2 className="text-2xl md:text-3xl font-bold text-center mb-6">Informații Utile</h2>
                        <div className="flex-grow overflow-y-auto pr-2 -mr-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {infoDocs.map(doc => (
                                    <button key={doc.id} onClick={() => handleSelectDoc(doc)} className="text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 p-4 rounded-lg transition-all duration-200 hover:shadow-md">
                                        <h3 className="font-bold text-blue-700">{doc.title}</h3>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {view === 'detail' && selectedDoc && (
                       <div className="flex flex-col h-full min-h-0">
                            <div className="flex items-center mb-4 flex-shrink-0">
                               <button onClick={handleBack} className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"><ChevronLeft size={24} /></button>
                               <h2 className="text-xl md:text-2xl font-bold">{selectedDoc.title}</h2>
                            </div>
                            <div className="flex-grow overflow-y-auto pr-4 -mr-4 bg-gray-50 p-4 rounded-lg border">
                                {selectedDoc.content}
                            </div>
                       </div>
                )}
            </div>
        </div>
    );
};

// --- FSP Tutor Modal ---
const GeminiFspTutorModal = ({ onClose }) => {
    const [view, setView] = useState('menu');
    const [history, setHistory] = useState([]);
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadedCase, setUploadedCase] = useState(null);
    const [selectedMedicalCase, setSelectedMedicalCase] = useState(null);
    const fileInputRef = useRef(null);
    const chatEndRef = useRef(null);
    const modalRef = useRef(null);

    // Handle click outside - go one step back
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                if (view === 'chat') {
                    handleBackToMenu(); // Go back to appropriate previous view
                } else if (view === 'case_selection') {
                    setView('menu'); // Go back to menu
                } else {
                    onClose(); // Close completely from menu
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [view, onClose]);

    const menuOptions = [
        { id: 'case', title: 'Simulează un Caz', description: 'Exercitiu complet de FSP cu pacient virtual' },
        { id: 'upload_case', title: 'Încarcă Cazul Tău', description: 'Încarcă propriul caz pentru evaluare și feedback' },
        { id: 'grammar', title: 'Discută Gramatica', description: 'Ajutor cu structurile gramaticale medicale' },
        { id: 'terms', title: 'Învață Termeni Medicali', description: 'Explicații pentru vocabularul medical german' },
        { id: 'correction', title: 'Corectează Textul Meu', description: 'Revizuiește și îmbunătățește scrisorile medicale' }
    ];

    const medicalCases = [
        // Kardiologie
        { category: 'Kardiologie', cases: ['KHK', 'Herzinsuffizienz', 'pAVK', 'TVT', 'Akute arterielle Thrombose', 'Myokardinfarkt', 'Vorhofflimmern', 'Aortenaneurysma'] },
        // Pneumologie  
        { category: 'Pneumologie', cases: ['COPD', 'Asthma bronchiale', 'Pneumonie', 'Lungentumor', 'Pleuraerguss', 'Pneumothorax'] },
        // Gastroenterologie
        { category: 'Gastroenterologie', cases: ['Gastritis', 'Ulcus ventriculi', 'Cholezystitis', 'Pankreatitis', 'Hepatitis', 'Zirrhose'] },
        // Neurologie
        { category: 'Neurologie', cases: ['Schlaganfall', 'Migräne', 'Epilepsie', 'Multiple Sklerose', 'Parkinson', 'Demenz'] },
        // Endokrinologie
        { category: 'Endokrinologie', cases: ['Diabetes mellitus', 'Hyperthyreose', 'Hypothyreose', 'Adipositas'] },
        // Orthopädie
        { category: 'Orthopädie', cases: ['Fraktur', 'Arthrose', 'Bandscheibenvorfall', 'Osteoporose'] }
    ];

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setUploadedCase({
                    name: file.name,
                    content: e.target.result,
                    type: file.type
                });
                setView('chat');
                setHistory([{ 
                    role: 'model', 
                    parts: [{ 
                        text: `Perfect! Am primit cazul tău: "${file.name}". Acum îl voi analiza conform criteriilor FSP și îți voi oferi feedback detaliat. Te rog să-mi spui pentru ce land german vrei evaluarea (ex: Bayern, NRW, Berlin) pentru a folosi criteriile specifice de evaluare.` 
                    }] 
                }]);
            };
            reader.readAsText(file);
        }
    };

    const handleMenuSelect = (option) => {
        if (option === 'upload_case') {
            fileInputRef.current?.click();
            return;
        }
        
        if (option === 'case') {
            setView('case_selection');
            return;
        }

        setView('chat');
        let systemMessage;
        
        switch(option) {
            case 'grammar':
                systemMessage = "Salut! Sunt aici să te ajut cu gramatica medicală germană. Întreabă-mă despre structuri gramaticale, conjugări sau construcții specifice limbajului medical.";
                break;
            case 'terms':
                systemMessage = "Bună! Sunt dicționarul tău medical german. Poți să-mi ceri explicații pentru termeni medicali, sinonime sau traduceri româno-germane.";
                break;
            case 'correction':
                systemMessage = "Salut! Sunt corectorul tău de texte medicale. Trimite-mi orice text medical în germană și îl voi corecta și îmbunătăți.";
                break;
            default:
                systemMessage = "Bună! Cu ce te pot ajuta astăzi la pregătirea FSP?";
        }
        
        setHistory([{ role: 'model', parts: [{ text: systemMessage }] }]);
    };

    const handleCaseSelection = (caseType) => {
        if (caseType === 'random') {
            const allCases = medicalCases.flatMap(cat => cat.cases);
            const randomCase = allCases[Math.floor(Math.random() * allCases.length)];
            setSelectedMedicalCase(randomCase);
        } else if (caseType === 'custom') {
            setSelectedMedicalCase('custom');
        } else {
            setSelectedMedicalCase(caseType);
        }
        
        setView('chat');
        const systemMessage = caseType === 'custom' 
            ? "Perfect! Descrie-mi cazul medical pe care vrei să-l exersăm. Îți voi juca rolul pacientului și apoi îți voi oferi feedback detaliat."
            : `Excelent! Am ales cazul: "${caseType === 'random' ? selectedMedicalCase || 'caz aleatoriu' : caseType}". Sunt pacientul tău - începe anamneza! Întreabă-mă ce simptome am și de când.`;
        
        setHistory([{ role: 'model', parts: [{ text: systemMessage }] }]);
    };

    const callGeminiAPI = async (currentPrompt, mode) => {
        setLoading(true);
        
        let systemPrompt;
        
        if (uploadedCase) {
            systemPrompt = `Du bist ein FSP-Experte und -Examinator für deutsche Fachsprachprüfungen in der Medizin. Du bewertest medizinische Fälle nach den offiziellen FSP-Kriterien.

Der Nutzer hat einen medizinischen Fall hochgeladen: "${uploadedCase.name}"
Fallinhalt: ${uploadedCase.content}

Deine Aufgabe:
1. Analysiere den Fall nach FSP-Standards (Anamnese, Arztbrief, Präsentation)
2. Bewerte nach den Kriterien des angegebenen Bundeslandes
3. Gib detailliertes Feedback auf Rumänisch mit:
   - Stärken des Falls
   - Verbesserungsvorschläge
   - Sprachliche Korrekturen
   - Strukturelle Empfehlungen
   - Bewertung nach FSP-Kriterien (60% Mindestanforderung)

Antworte strukturiert und konstruktiv auf Rumänisch.`;
        } else if (selectedMedicalCase) {
            systemPrompt = `Du bist ein FSP-Simulator und -Tutor. Du spielst sowohl die Rolle eines deutschen Patienten als auch eines Examinators.

${selectedMedicalCase !== 'custom' ? `Aktueller Fall: ${selectedMedicalCase}` : 'Der Nutzer wird einen eigenen Fall beschreiben.'}

Struktur deiner Antworten:
1. [PATIENT]: Antworte als Patient auf die Frage des Arztes (auf Deutsch, natürlich und realistisch)
2. [FEEDBACK]: Gib konstruktives Feedback zur Frage des Arztes (auf Rumänisch)

Regeln:
- Als Patient: Sei realistisch, verwende alltägliche Sprache, nicht zu medizinisch
- Als Examinator: Bewerte die Fragetechnik, schlage bessere Formulierungen vor
- Bleibe im medizinischen Kontext des gewählten Falls
- Sei ermutigend aber konstruktiv kritisch`;
        } else {
            switch(mode || 'case') {
                case 'grammar':
                    systemPrompt = `Du bist ein Experte für deutsche Medizinsprache. Beantworte Fragen zur Grammatik, zu Satzstrukturen und sprachlichen Besonderheiten im medizinischen Deutsch. Antworte auf Rumänisch und gib klare Beispiele.`;
                    break;
                case 'terms':
                    systemPrompt = `Du bist ein medizinisches Wörterbuch und Terminologie-Experte. Erkläre medizinische Begriffe, gib Synonyme und übersetze zwischen Rumänisch und Deutsch. Antworte auf Rumänisch mit klaren Definitionen und Beispielen.`;
                    break;
                case 'correction': 
                    systemPrompt = `Du bist ein Korrektor für medizinische Texte. Korrigiere deutsche medizinische Texte, verbessere den Stil und erkläre die Änderungen auf Rumänisch. Gib sowohl die korrigierte Version als auch Erklärungen für die Verbesserungen.`;
                    break;
            }
        }

        const fullHistory = [...history, { role: "user", parts: [{ text: currentPrompt }] }];
        const apiHistory = [
            { role: "user", parts: [{ text: systemPrompt }] },
            { role: "model", parts: [{ text: "Verstanden. Wie kann ich dir helfen?" }] },
            ...fullHistory
        ];

        try {
            const payload = { contents: apiHistory };
            const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0) {
                const newResponse = result.candidates[0].content;
                setHistory(prev => [...prev, { role: "user", parts: [{ text: currentPrompt }] }, newResponse]);
            } else {
                setHistory(prev => [...prev, { role: "user", parts: [{ text: currentPrompt }] }, { role: 'model', parts: [{ text: "Scuze, nu pot răspunde acum." }] }]);
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            setHistory(prev => [...prev, { role: "user", parts: [{ text: currentPrompt }] }, { role: 'model', parts: [{ text: "A apărut o eroare. Vă rog să încercați din nou." }] }]);
        } finally {
            setLoading(false);
            setPrompt('');
        }
    };

    const handleSend = () => {
        if (prompt.trim() && !loading) {
            callGeminiAPI(prompt.trim(), 'case');
        }
    };

    const handleBackToMenu = () => {
        setView('menu');
        setUploadedCase(null);
        setSelectedMedicalCase(null);
        setHistory([]);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 animate-fade-in-fast">
            <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl text-gray-800 p-6 md:p-8 relative transform animate-scale-in flex flex-col max-h-[90vh]">
                <button onClick={view === 'chat' ? handleBackToMenu : view === 'case_selection' ? () => setView('menu') : onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors z-10"><X size={28} /></button>
                
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                    <MessageCircle className="text-blue-600"/> Tutor FSP AI
                </h2>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileUpload}
                    accept=".txt,.doc,.docx,.pdf"
                />

                {view === 'menu' && (
                    <div className="flex-grow overflow-y-auto">
                        <p className="text-gray-600 text-center mb-6">Alege modul de pregătire pentru examenul Fachsprachprüfung:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {menuOptions.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => handleMenuSelect(option.id)}
                                    className="text-left bg-blue-50 hover:bg-blue-100 border border-blue-200 p-4 rounded-lg transition-all duration-200 hover:shadow-md"
                                >
                                    <h3 className="font-bold text-blue-800 mb-2">{option.title}</h3>
                                    <p className="text-blue-600 text-sm">{option.description}</p>
                                    {option.id === 'upload_case' && (
                                        <div className="mt-2 flex items-center gap-2 text-blue-700">
                                            <Upload size={16} />
                                            <span className="text-xs">Suportă: TXT, DOC, DOCX, PDF</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'case_selection' && (
                    <div className="flex-grow overflow-y-auto">
                        <div className="flex items-center mb-4">
                            <button onClick={handleBackToMenu} className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors">
                                <ChevronLeft size={24} />
                            </button>
                            <h3 className="text-lg font-semibold">Alege un Caz Medical</h3>
                        </div>
                        
                        <div className="space-y-4 mb-6">
                            <button
                                onClick={() => handleCaseSelection('random')}
                                className="w-full p-4 bg-gray-200 hover:bg-gray-300 rounded-lg text-center font-semibold transition-colors"
                            >
                                Caz Aleatoriu Necunoscut
                            </button>
                            <button
                                onClick={() => handleCaseSelection('custom')}
                                className="w-full p-4 bg-gray-200 hover:bg-gray-300 rounded-lg text-center font-semibold transition-colors"
                            >
                                Propune Tu un Caz
                            </button>
                        </div>

                        <div className="space-y-4">
                            {medicalCases.map(category => (
                                <div key={category.category}>
                                    <h4 className="font-bold text-gray-800 mb-2">{category.category}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {category.cases.map(caseItem => (
                                            <button
                                                key={caseItem}
                                                onClick={() => handleCaseSelection(caseItem)}
                                                className="p-2 bg-gray-100 hover:bg-blue-100 rounded text-sm transition-colors"
                                            >
                                                {caseItem}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'chat' && (
                    <div className="flex flex-col flex-grow min-h-0">
                        <div className="flex items-center mb-4">
                            <button onClick={handleBackToMenu} className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors">
                                <ChevronLeft size={24} />
                            </button>
                            <h3 className="text-lg font-semibold">
                                {uploadedCase ? `Evaluare Caz: ${uploadedCase.name}` : 
                                 selectedMedicalCase ? `Caz Medical: ${selectedMedicalCase}` : 'Sesiune de Pregătire FSP'}
                            </h3>
                        </div>
                        
                        <div className="flex-grow bg-gray-50 rounded-lg p-4 overflow-y-auto mb-4 border">
                            {history.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                                    <div className={`p-3 rounded-lg max-w-lg shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border'}`}>
                                        <div>{msg.role === 'user' ? <div className="prose max-w-none">{renderMarkdown(msg.parts[0].text)}</div> : renderMarkdown(msg.parts[0].text)}</div>
                                    </div>
                                </div>
                            ))}
                            {loading && <div className="flex justify-start"><div className="p-3 rounded-lg bg-white text-gray-800 border">Se gândește...</div></div>}
                            <div ref={chatEndRef} />
                        </div>
                        
                        <div className="flex items-center">
                            <input
                                type="text"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
                                className="flex-grow p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={uploadedCase ? "Întreabă despre cazul tău..." : 
                                           selectedMedicalCase ? "Pune întrebări pacientului..." : "Scrie mesajul tău aici..."}
                            />
                            <button onClick={handleSend} disabled={loading} className="bg-blue-600 text-white p-3 rounded-r-lg hover:bg-blue-700 disabled:bg-blue-400">
                                <Send />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Email Generator Modal ---
const GeminiEmailModal = ({ onClose }) => {
    const [view, setView] = useState('menu');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({});
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
    const modalRef = useRef(null);

    // Handle click outside - go one step back
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                if (view === 'result') {
                    setView('form'); // Go back to form
                } else if (view === 'form') {
                    setView('menu'); // Go back to menu
                } else {
                    onClose(); // Close completely from menu
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [view, onClose]);

    const emailTemplates = [
        { id: 'status', title: 'Cerere status dosar', description: 'Întreabă autoritățile despre stadiul procesării dosarului tău de Approbation' },
        { id: 'appointment', title: 'Solicitare programare FSP', description: 'Cere o programare pentru examenul de limbaj medical (FSP) la Camera Medicilor' },
        { id: 'document_response', title: 'Răspuns la o solicitare de document', description: 'Răspunde la o cerere de documente suplimentare de la autorități' },
        { id: 'kp_info', title: 'Cerere informații despre KP', description: 'Solicită informații detaliate despre structura examenului de echivalare (Kenntnisprüfung)' },
        { id: 'berufserlaubnis', title: 'Cerere pentru Berufserlaubnis', description: 'Solicită eliberarea permisului temporar de practică medicală după promovarea FSP' },
        { id: 'document_question', title: 'Întrebare despre un document', description: 'Cere clarificări despre cerințele specifice pentru un anumit document (ex: format, valabilitate)' },
        { id: 'withdraw_application', title: 'Retragere aplicație', description: 'Retrage-ți în mod oficial aplicația pentru Approbation dintr-un anumit land' },
        { id: 'ai_correction', title: 'Corectează e-mailul meu (AI)', description: 'Scrie dorința unui e-mail iar asistentul AI îl va corecta și îmbunătăți pentru un ton oficial' }
    ];

    const getFormFields = (templateId) => {
        const commonFields = [
            { key: 'name', label: 'Numele tău complet', type: 'text', required: true },
            { key: 'email', label: 'Adresa ta de email', type: 'email', required: true },
            { key: 'authority', label: 'Numele autorității (ex: Landesärztekammer Bayern)', type: 'text', required: true }
        ];

        switch(templateId) {
            case 'status':
                return [...commonFields, 
                    { key: 'applicationNumber', label: 'Numărul dosarului (dacă îl ai)', type: 'text', required: false },
                    { key: 'applicationDate', label: 'Data depunerii cererii', type: 'date', required: true }
                ];
            case 'appointment':
                return [...commonFields,
                    { key: 'examType', label: 'Tipul examenului (FSP/KP)', type: 'text', required: true },
                    { key: 'preferredDates', label: 'Perioada preferată', type: 'text', required: false }
                ];
            case 'document_response':
                return [...commonFields,
                    { key: 'requestedDocument', label: 'Documentul solicitat', type: 'text', required: true },
                    { key: 'responseAction', label: 'Acțiunea ta (ex: trimit documentul, solicit clarificări)', type: 'textarea', required: true }
                ];
            case 'kp_info':
                return [...commonFields,
                    { key: 'specificQuestions', label: 'Întrebări specifice despre KP', type: 'textarea', required: true }
                ];
            case 'berufserlaubnis':
                return [...commonFields,
                    { key: 'fspDate', label: 'Data promovării FSP', type: 'date', required: true },
                    { key: 'workPlace', label: 'Locul de muncă dorit/contractat', type: 'text', required: false }
                ];
            case 'document_question':
                return [...commonFields,
                    { key: 'documentName', label: 'Numele documentului', type: 'text', required: true },
                    { key: 'specificQuestion', label: 'Întrebarea ta specifică', type: 'textarea', required: true }
                ];
            case 'withdraw_application':
                return [...commonFields,
                    { key: 'applicationNumber', label: 'Numărul dosarului', type: 'text', required: true },
                    { key: 'reason', label: 'Motivul retragerii (opțional)', type: 'textarea', required: false }
                ];
            case 'ai_correction':
                return [
                    { key: 'emailDraft', label: 'Schița e-mailului tău (scrie în română sau germană)', type: 'textarea', required: true },
                    { key: 'recipientType', label: 'Tipul destinatarului (ex: Landesärztekammer, Approbationsbehörde)', type: 'text', required: true },
                    { key: 'purpose', label: 'Scopul e-mailului', type: 'text', required: true }
                ];
            default:
                return commonFields;
        }
    };

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        setView('form');
        setFormData({});
    };

    const handleInputChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const generateEmail = async () => {
        setLoading(true);
        
        const prompt = `Du bist ein Experte für offizielle Korrespondenz mit deutschen Behörden im Gesundheitswesen. Erstelle einen professionellen, höflichen und präzisen E-Mail-Text auf Deutsch.

Template-Typ: ${selectedTemplate.title}
Empfänger: ${formData.authority || 'Deutsche Behörde'}
Absender: ${formData.name || 'Antragsteller'}

Weitere Informationen:
${Object.entries(formData).map(([key, value]) => `${key}: ${value}`).join('\n')}

Anforderungen:
1. Formeller, respektvoller Ton
2. Klare Struktur mit Betreff, Anrede, Inhalt, Schluss
3. Korrekte deutsche Grammatik und Rechtschreibung
4. Präzise und konkrete Formulierungen
5. Angemessene Höflichkeitsformen

Bitte erstelle die komplette E-Mail inklusive Betreff.`;

        try {
            const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
            const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
            const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const apiResult = await response.json();
            
            if (apiResult.candidates && apiResult.candidates.length > 0) {
                setResult(apiResult.candidates[0].content.parts[0].text);
                setView('result');
            } else {
                alert("Nu am putut genera emailul. Încercați din nou.");
            }
        } catch (error) {
            console.error("Error generating email:", error);
            alert("A apărut o eroare. Verificați conexiunea și încercați din nou.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (view === 'result') {
            setView('form');
        } else if (view === 'form') {
            setView('menu');
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4 animate-fade-in-fast">
            <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl text-gray-800 p-6 md:p-8 relative transform animate-scale-in flex flex-col max-h-[90vh]">
                <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors z-10"><X size={28} /></button>
                
                <h2 className="text-2xl md:text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                    <Mail className="text-green-600"/> Generator Email AI
                </h2>

                {view === 'menu' && (
                    <div className="flex-grow overflow-y-auto">
                        <p className="text-gray-600 text-center mb-6">Alege tipul de email pe care vrei să-l generez:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {emailTemplates.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => handleTemplateSelect(template)}
                                    className={`text-left border-2 p-4 rounded-lg transition-all duration-200 hover:shadow-md ${
                                        template.id === 'ai_correction' 
                                            ? 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200' 
                                            : 'bg-green-50 hover:bg-green-100 border-green-200'
                                    }`}
                                >
                                    <h3 className={`font-bold mb-2 ${
                                        template.id === 'ai_correction' ? 'text-cyan-800' : 'text-green-800'
                                    }`}>
                                        {template.title}
                                        {template.id === 'ai_correction' && (
                                            <span className="ml-2 text-xs bg-cyan-200 text-cyan-800 px-2 py-1 rounded-full">AI</span>
                                        )}
                                    </h3>
                                    <p className={`text-sm ${
                                        template.id === 'ai_correction' ? 'text-cyan-600' : 'text-green-600'
                                    }`}>
                                        {template.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {view === 'form' && selectedTemplate && (
                    <div className="flex flex-col flex-grow min-h-0">
                        <div className="flex items-center mb-4">
                            <button onClick={() => setView('menu')} className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors">
                                <ChevronLeft size={24} />
                            </button>
                            <h3 className="text-lg font-semibold">{selectedTemplate.title}</h3>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto mb-4">
                            <div className="space-y-4">
                                {getFormFields(selectedTemplate.id).map(field => (
                                    <div key={field.key}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        {field.type === 'textarea' ? (
                                            <textarea
                                                value={formData[field.key] || ''}
                                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                                rows="3"
                                            />
                                        ) : (
                                            <input
                                                type={field.type}
                                                value={formData[field.key] || ''}
                                                onChange={(e) => handleInputChange(field.key, e.target.value)}
                                                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <button 
                            onClick={generateEmail} 
                            disabled={loading}
                            className="w-full bg-green-600 text-white font-bold p-3 rounded-lg hover:bg-green-700 disabled:bg-green-400 flex items-center justify-center gap-2"
                        >
                            {loading ? <RefreshCw className="animate-spin" size={20} /> : <Sparkles size={20} />}
                            {loading ? 'Generez emailul...' : 'Generează Email'}
                        </button>
                    </div>
                )}

                {view === 'result' && (
                    <div className="flex flex-col flex-grow min-h-0">
                        <div className="flex items-center mb-4">
                            <button onClick={() => setView('form')} className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors">
                                <ChevronLeft size={24} />
                            </button>
                            <h3 className="text-lg font-semibold">Email Generat</h3>
                        </div>
                        
                        <div className="flex-grow bg-gray-50 rounded-lg p-4 overflow-y-auto mb-4 border">
                            <div className="prose max-w-none">{renderMarkdown(result)}</div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => navigator.clipboard.writeText(result)}
                                className="flex-1 bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                            >
                                <Clipboard size={20} /> Copiază
                            </button>
                            <button 
                                onClick={() => setView('menu')}
                                className="flex-1 bg-gray-600 text-white font-bold p-3 rounded-lg hover:bg-gray-700"
                            >
                                Email Nou
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Step Node Component ---
const StepNode = ({ step, position, onStepClick, isCurrent, isAccessible }) => {
    const getStatusStyles = () => {
        if (!isAccessible) {
            return 'fill-gray-300 cursor-not-allowed';
        }
        
        switch (step.status) {
            case 'completed':
                return 'fill-green-500 hover:fill-green-600 cursor-pointer';
            case 'unlocked':
                return 'fill-blue-500 hover:fill-blue-600 cursor-pointer';
            case 'locked':
            default:
                return 'fill-gray-400 cursor-not-allowed';
        }
    };

    const getIcon = () => {
        if (step.status === 'completed') return <Check size={24} />;
        if (step.status === 'locked' || !isAccessible) return <Lock size={20} />;
        return <step.icon size={20} />;
    };

    const getIconColor = () => {
        if (!isAccessible) return 'text-gray-400';
        
        switch (step.status) {
            case 'completed':
                return 'text-white';
            case 'unlocked':
                return 'text-white';
            case 'locked':
            default:
                return 'text-gray-200';
        }
    };

    const handleClick = () => {
        if (isAccessible && step.status !== 'locked') {
            onStepClick(step);
        }
    };

    return (
        <g>
            {/* Larger invisible clickable area */}
            <circle
                cx={position.x}
                cy={position.y}
                r="40"
                className="fill-transparent cursor-pointer"
                onClick={handleClick}
                style={{ cursor: (isAccessible && step.status !== 'locked') ? 'pointer' : 'not-allowed' }}
            />
            {/* Visible circle */}
            <circle
                cx={position.x}
                cy={position.y}
                r="30"
                className={`transition-all duration-300 ${getStatusStyles()}`}
                style={{ pointerEvents: 'none' }}
            />
            <foreignObject x={position.x - 12} y={position.y - 12} width="24" height="24" style={{ pointerEvents: 'none' }}>
                <div className={`flex items-center justify-center w-full h-full ${getIconColor()}`}>
                    {getIcon()}
                </div>
            </foreignObject>
            {((step.status === 'unlocked' || step.status === 'completed') && isAccessible) && (
                <text x={position.x} y={position.y + 50} textAnchor="middle" className="fill-gray-700 text-sm font-semibold pointer-events-none">
                    {step.title}
                </text>
            )}
            {!isAccessible && (
                <text x={position.x} y={position.y + 50} textAnchor="middle" className="fill-gray-400 text-xs font-semibold pointer-events-none">
                    {step.title}
                </text>
            )}
        </g>
    );
};

// --- Bonus Node Component ---
const BonusNode = ({ node, onClick, isAccessible }) => {
    const handleClick = () => {
        if (isAccessible) {
            onClick(node.action);
        }
    };

    return (
        <g>
            {/* Larger invisible clickable area */}
            <circle
                cx={node.position.x}
                cy={node.position.y}
                r="35"
                className="fill-transparent cursor-pointer"
                onClick={handleClick}
                style={{ cursor: isAccessible ? 'pointer' : 'not-allowed' }}
            />
            {/* Visible circle */}
            <circle
                cx={node.position.x}
                cy={node.position.y}
                r="25"
                className={`transition-all duration-300 ${
                    isAccessible 
                        ? 'fill-orange-500 hover:fill-orange-600' 
                        : 'fill-gray-300'
                }`}
                style={{ pointerEvents: 'none' }}
            />
            <foreignObject x={node.position.x - 12} y={node.position.y - 12} width="24" height="24" style={{ pointerEvents: 'none' }}>
                <div className={`flex items-center justify-center w-full h-full ${isAccessible ? 'text-white' : 'text-gray-400'}`}>
                    <node.icon size={20} />
                </div>
            </foreignObject>
            <text x={node.position.x} y={node.position.y + 40} textAnchor="middle" className={`text-xs font-semibold pointer-events-none ${isAccessible ? 'fill-gray-700' : 'fill-gray-400'}`}>
                {node.title}
            </text>
            {!isAccessible && (
                <Lock 
                    size={12} 
                    className="pointer-events-none text-gray-400" 
                    style={{ 
                        position: 'absolute', 
                        left: node.position.x + 15, 
                        top: node.position.y - 15 
                    }} 
                />
            )}
        </g>
    );
};

// --- Step Modal Component ---
const StepModal = ({ step, onTaskToggle, onActionClick, onClose }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (step) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [step, onClose]);

    if (!step) return null;

    const allTasksCompleted = step.tasks.every(task => task.completed);
    const completedTasks = step.tasks.filter(task => task.completed).length;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in-fast">
            <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full text-gray-800 p-6 md:p-8 relative transform animate-scale-in max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
                    <X size={28} />
                </button>

                <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${allTasksCompleted ? 'bg-green-500' : 'bg-blue-500'} text-white`}>
                        {allTasksCompleted ? <Check size={28} /> : <step.icon size={28} />}
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold">{step.title}</h2>
                        <p className="text-gray-600 mt-1">{step.description}</p>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-600">Progres</span>
                        <span className="text-sm font-semibold text-gray-600">{completedTasks}/{step.tasks.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                            className="bg-green-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(completedTasks / step.tasks.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-bold">Sarcini:</h3>
                    {step.tasks.map(task => (
                        <div key={task.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                            <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => onTaskToggle(step.id, task.id)}
                                disabled={task.action && !task.viewed}
                                className="mt-1 w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex-grow">
                                <p className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                    {task.text}
                                </p>
                                {task.action && (
                                    <button
                                        onClick={() => onActionClick(task.action, step.id, task.id)}
                                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    >
                                        <Info size={16} />
                                        {task.viewed ? 'Revizuiește' : 'Detalii'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {allTasksCompleted && (
                    <div className="mt-6 p-4 bg-green-100 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-800">
                            <Check size={20} />
                            <span className="font-semibold">Felicitări! Ai completat acest pas.</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Content Modal Component ---
const ContentModal = ({ content, onClose, onBackToStep }) => {
    const modalRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                // Close current content modal first, then let step modal handle its own closing
                onClose();
            }
        };

        if (content) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [content, onBackToStep]);

    if (!content) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 animate-fade-in-fast">
            <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full text-gray-800 p-6 md:p-8 relative transform animate-scale-in max-h-[90vh] overflow-y-auto">
                <button onClick={onBackToStep} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
                    <X size={28} />
                </button>
                
                <h2 className="text-2xl md:text-3xl font-bold mb-6">{content.title}</h2>
                
                <div className="text-gray-700 leading-relaxed">
                    {content.body}
                </div>
            </div>
        </div>
    );
};

// --- Decorative Cloud Component ---
const Cloud = ({ style }) => (
    <div className="absolute bg-white/80 rounded-full" style={style}></div>
);

// --- Main Application Component with Authentication Integration ---
const AppContent = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const { canAccessStep, canAccessOrangeNode, hasAIAccess, subscriptionTier, SUBSCRIPTION_TIERS } = useSubscription();
    const { updateTaskProgress, getTaskProgress, isStepUnlocked } = useProgress();
    
    const [steps, setSteps] = useState(initialStepsData);
    const [selectedStep, setSelectedStep] = useState(null);
    const [activeContent, setActiveContent] = useState(null);
    const [activeGeminiModal, setActiveGeminiModal] = useState(null);
    const [personalFileModalOpen, setPersonalFileModalOpen] = useState(false);
    const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
    const [infoHubModalOpen, setInfoHubModalOpen] = useState(false);
    const [recommenderModalOpen, setRecommenderModalOpen] = useState(false);
    const [confetti, setConfetti] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [subscriptionUpgradeOpen, setSubscriptionUpgradeOpen] = useState(false);
    const [freeMode, setFreeMode] = useState(false);

    useEffect(() => {
        let loadedSteps = initialStepsData.map(step => {
            const savedStep = JSON.parse(localStorage.getItem(`step_${step.id}`) || 'null');
            return savedStep ? { ...step, ...savedStep } : { ...step, tasks: step.tasks.map(t => ({...t, completed: false, viewed: false})) };
        });
        setSteps(loadedSteps);
    }, []);

    const isBonusNodeAccessible = (nodeIndex) => {
        return canAccessOrangeNode(nodeIndex);
    };



    const displayedSteps = useMemo(() => {
        let currentSteps = steps.map(s => ({ ...s }));
        let lockNext = false;
        currentSteps.forEach((step, index) => {
            const allTasksCompleted = step.tasks.every(t => t.completed);
            
            if (index === 0) {
                step.status = allTasksCompleted ? 'completed' : 'unlocked';
            } else {
                const prevStep = currentSteps[index - 1];
                if (prevStep.status === 'completed') {
                    step.status = allTasksCompleted ? 'completed' : 'unlocked';
                } else {
                    step.status = 'locked';
                }
            }
            if (step.status !== 'completed' && !lockNext) {
                lockNext = true;
            }
            if (lockNext) {
                 for(let j = index + 1; j < currentSteps.length; j++) {
                    currentSteps[j].status = 'locked';
                }
            }
        });

        return currentSteps.map((step, index) => ({...step, icon: initialStepsData[index].icon}));
    }, [steps]);

    const handleTaskToggle = (stepId, taskId) => {
        const oldStep = steps.find(s => s.id === stepId);
        const wasCompleted = oldStep.tasks.every(t => t.completed);

        const newSteps = steps.map(step => {
            if (step.id === stepId) {
                const newTasks = step.tasks.map((task) => {
                    if (task.id === taskId) {
                        return { ...task, completed: !task.completed };
                    }
                    return task;
                });
                const updatedStep = { ...step, tasks: newTasks };
                localStorage.setItem(`step_${step.id}`, JSON.stringify(updatedStep));
                if (selectedStep && selectedStep.id === stepId) {
                    setSelectedStep(updatedStep);
                }
                return updatedStep;
            }
            return step;
        });
        setSteps(newSteps);
        
        // Check if step was just completed
        const newStep = newSteps.find(s => s.id === stepId);
        const isNowCompleted = newStep.tasks.every(t => t.completed);

        if (!wasCompleted && isNowCompleted) {
            setConfetti(true);
            setTimeout(() => setConfetti(false), 4000);
        }
    };

    const handleActionClick = (action, stepId, taskId) => {
        // Check AI access for AI-powered features
        if ((action.type === 'gemini_fsp_tutor' || action.type === 'gemini_email_generator' || action.type === 'gemini_land_recommender') && !hasAIAccess()) {
            setSubscriptionModalOpen(true);
            return;
        }

        if (action.type === 'personal_file') { 
            setPersonalFileModalOpen(true); 
            return; 
        }

        if (stepId && taskId) {
            setSteps(prevSteps => {
                const newSteps = prevSteps.map(step => {
                    if (step.id === stepId) {
                        const newTasks = step.tasks.map(task => 
                            task.id === taskId ? { ...task, viewed: true } : task
                        );
                        const updatedStep = { ...step, tasks: newTasks };
                        localStorage.setItem(`step_${stepId}`, JSON.stringify(updatedStep));
                        if (selectedStep && selectedStep.id === stepId) {
                            setSelectedStep(updatedStep);
                        }
                        return updatedStep;
                    }
                    return step;
                });
                return newSteps;
            });
        }

        // Handle different action types
        if (action.type === 'link') { 
            window.open(action.content, '_blank', 'noopener,noreferrer'); 
        } else if (action.type === 'modal') { 
            setActiveContent(action.content); 
            // Don't close step modal here - content modal will handle the hierarchy
        } else if (action.type === 'gemini_fsp_tutor') { 
            setActiveGeminiModal('fsp_tutor'); 
        } else if (action.type === 'gemini_email_generator') { 
            setActiveGeminiModal('email_generator'); 
        } else if (action.type === 'gemini_land_recommender') { 
            setRecommenderModalOpen(true); 
        } else if (action.type === 'info_hub') { 
            setInfoHubModalOpen(true); 
        }
    };

    const handleStepClick = (step) => {
        const stepIndex = displayedSteps.findIndex(s => s.id === step.id);
        if (!canAccessStep(stepIndex + 1)) {
            setSubscriptionModalOpen(true);
            return;
        }

        if (step.status !== 'locked') {
            const originalStepData = initialStepsData.find(s => s.id === step.id);
            const stepWithIcons = {...step, icon: originalStepData.icon };
            setSelectedStep(stepWithIcons);
        }
    };

    const handleSubscriptionUpgrade = async (tier) => {
        try {
            await upgradeSubscription(tier);
            setSubscriptionModalOpen(false);
            // In a real app, you'd redirect to payment processor
            alert(`Redirection către procesarea plății pentru planul ${SUBSCRIPTION_TIERS[tier].name} (€${SUBSCRIPTION_TIERS[tier].price}/lună)`);
        } catch (error) {
            console.error('Failed to upgrade subscription:', error);
            alert('Failed to upgrade subscription. Please try again.');
        }
    };

    const closeModal = () => setSelectedStep(null);

    const handleBonusNodeClick = (action) => {
        const nodeIndex = bonusNodes.findIndex(node => node.action.type === action.type);
        if (!isBonusNodeAccessible(nodeIndex)) {
            setSubscriptionModalOpen(true);
            return;
        }

        handleActionClick(action);
    };
    const closeContentModal = () => setActiveContent(null); // This closes content modal but keeps step modal open
    const backToStepFromContent = () => {
        setActiveContent(null);
        // Keep step modal open
    };
    const closeGeminiModal = () => setActiveGeminiModal(null);
    const closeRecommenderModal = () => setRecommenderModalOpen(false);
    const closeInfoHubModal = () => setInfoHubModalOpen(false);

    const currentStep = displayedSteps.find(step => step.status === 'unlocked');
    const progressPercentage = (steps.filter(s => s.tasks.every(t => t.completed)).length / steps.length) * 100;

    return (
        <div className="bg-gradient-to-b from-sky-200 via-sky-100 to-emerald-200 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {confetti && <Confetti />}
            
            {/* Subscription info and upgrade button */}
            <div className="fixed top-4 left-4 z-40 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
                <div className="text-sm font-semibold text-gray-700">
                    Plan: <span className={`${subscriptionTier === 'FREE' ? 'text-gray-600' : subscriptionTier === 'BASIC' ? 'text-blue-600' : 'text-purple-600'}`}>
                        {subscriptionTier === 'FREE' ? 'Free' : subscriptionTier === 'BASIC' ? 'Basic' : 'Premium'}
                    </span>
                </div>
                {subscriptionTier !== 'PREMIUM' && (
                    <button 
                        onClick={() => setSubscriptionModalOpen(true)}
                        className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded mt-1 hover:from-purple-600 hover:to-pink-600 transition-colors"
                    >
                        Upgrade
                    </button>
                )}
                {/* Developer Testing Buttons */}
                <div className="mt-2 text-xs space-y-1">
                    <div className="text-gray-500">Test Mode:</div>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => setSubscriptionModalOpen(true)}
                            className={`px-2 py-0.5 rounded text-xs ${subscriptionTier === 'FREE' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                            Free
                        </button>
                        <button 
                            onClick={() => setSubscriptionModalOpen(true)}
                            className={`px-2 py-0.5 rounded text-xs ${subscriptionTier === 'BASIC' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                            Basic
                        </button>
                        <button 
                            onClick={() => setSubscriptionModalOpen(true)}
                            className={`px-2 py-0.5 rounded text-xs ${subscriptionTier === 'PREMIUM' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                            Premium
                        </button>
                    </div>
                </div>
            </div>
            
            <button 
                onClick={() => setPersonalFileModalOpen(true)}
                className="fixed top-4 right-4 z-40 bg-purple-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 transition-transform duration-300 hover:scale-110"
                title="Dosarul Meu Personal"
            >
                <FolderKanban size={28} />
            </button>
            
            <div className="fixed bottom-4 right-4 z-40 flex items-center space-x-2 bg-white/80 p-2 rounded-full shadow-lg backdrop-blur-sm">
                <span className={`text-sm font-bold ${!freeMode ? 'text-blue-600' : 'text-gray-500'}`}>Progresiv</span>
                <button onClick={() => setFreeMode(!freeMode)} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${freeMode ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <span className={`block w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${freeMode ? 'translate-x-6' : 'translate-x-0'}`}></span>
                </button>
                <span className={`text-sm font-bold ${freeMode ? 'text-green-600' : 'text-gray-500'}`}>Liber</span>
            </div>

            <div className="w-full max-w-md mx-auto">
                <header className="text-center mb-6 bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-md">
                    <h1 className="text-3xl md:text-4xl font-black text-gray-800">Approbation în Germania</h1>
                    <p className="text-gray-500 mt-1">Ghidul tău interactiv pas cu pas.</p>
                    <div className="w-full bg-gray-200 rounded-full h-4 mt-4 overflow-hidden border border-gray-300">
                        <div className="bg-green-500 h-4 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </header>
                
                <main className="relative w-full h-[520px]">
                    <Cloud style={{ top: '5%', left: '10%', width: '80px', height: '80px' }} />
                    <Cloud style={{ top: '60%', right: '5%', width: '60px', height: '60px' }} />
                    
                    <svg width="100%" height="100%" viewBox="0 0 400 520" preserveAspectRatio="xMidYMid meet" className="absolute top-0 left-0">
                        <path d="M 200 80 Q 120 115, 120 160 T 280 240 Q 340 275, 160 320 T 240 400 Q 280 435, 140 480" stroke="#d6a770" strokeWidth="8" fill="none" strokeLinecap="round" />
                        <path d="M 200 80 Q 120 115, 120 160 T 280 240 Q 340 275, 160 320 T 240 400 Q 280 435, 140 480" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="1 10" />
                        
                        {displayedSteps.map((step, index) => ( 
                            <StepNode key={step.id} step={step} position={nodePositions[index]} onStepClick={handleStepClick} isCurrent={currentStep?.id === step.id} isAccessible={canAccessStep(index + 1)} /> 
                        ))}
                        
                        {bonusNodes.map((node, index) => 
                            <BonusNode 
                                key={node.id} 
                                node={node} 
                                onClick={handleBonusNodeClick} 
                                isAccessible={isBonusNodeAccessible(index)}
                            />
                        )}
                    </svg>
                </main>
            </div>
            
            <StepModal step={selectedStep} onTaskToggle={handleTaskToggle} onActionClick={handleActionClick} onClose={closeModal} />
            <ContentModal content={activeContent} onClose={closeContentModal} onBackToStep={backToStepFromContent} />
            {activeGeminiModal === 'fsp_tutor' && <GeminiFspTutorModal onClose={closeGeminiModal} />}
            {activeGeminiModal === 'email_generator' && <GeminiEmailModal onClose={closeGeminiModal} />}
            {recommenderModalOpen && <BundeslandRecommenderModal onClose={closeRecommenderModal} />}
            <InfoHubModal isOpen={infoHubModalOpen} onClose={closeInfoHubModal} />
            <PersonalFileModal isOpen={personalFileModalOpen} onClose={() => setPersonalFileModalOpen(false)} />
            <SubscriptionUpgrade 
                isOpen={subscriptionUpgradeOpen} 
                onClose={() => setSubscriptionUpgradeOpen(false)}
            />
            <AdminPanel 
                isOpen={freeMode} 
                onClose={() => setFreeMode(false)}
            />
            <AuthModal 
                isOpen={authModalOpen} 
                onClose={() => setAuthModalOpen(false)}
            />
            
            {/* Feedback Widget */}
            <FeedbackWidget />
        </div>
    );
};

// Main App Component with AuthProvider
export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}