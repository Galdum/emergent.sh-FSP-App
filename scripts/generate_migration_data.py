#!/usr/bin/env python3
"""
Generate migration data as JSON that can be imported into MongoDB.
This works without requiring a live MongoDB connection.
"""

import json
import uuid
from datetime import datetime

# Static content to migrate (same as the original migration script)
STATIC_CONTENT = [
    {
        "title": "Alternative la FSP (telc, FaMed, PKT)",
        "description": "Examene alternative la Fachsprachprüfung-ul camerelor medicale",
        "category": "alternatives",
        "content_type": "rich-content",
        "icon_emoji": "📋",
        "color_theme": "blue",
        "order_priority": 1,
        "rich_content": """
<div class="space-y-4 text-gray-700">
    <p class="font-bold">Ideea-cheie: Există trei examene alternative la Fachsprachprüfung-ul camerelor medicale: telc Deutsch B2·C1 Medizin, FaMed C1 (LMU München) şi Patientenkommunikationstest (PKT) C1 (Freiburg International Academy).</p>
    <p>Acceptarea lor depinde de land. Detaliile complete sunt mai jos.</p>
    
    <h4 class="font-bold text-lg text-gray-800 border-b pb-2">1. Examene alternative – format, cost, timpi de aşteptare</h4>
    <div class="overflow-x-auto">
        <table class="w-full text-sm text-left border-collapse border border-gray-300">
            <thead class="bg-gray-100">
                <tr>
                    <th class="p-2 font-semibold border border-gray-300">Examen</th>
                    <th class="p-2 font-semibold border border-gray-300">Conţinut & durată</th>
                    <th class="p-2 font-semibold border border-gray-300">Cost tipic</th>
                    <th class="p-2 font-semibold border border-gray-300">Rezultat</th>
                    <th class="p-2 font-semibold border border-gray-300">Centre România / UE</th>
                    <th class="p-2 font-semibold border border-gray-300">Observaţii</th>
                </tr>
            </thead>
            <tbody>
                <tr class="border-b">
                    <td class="p-2 font-semibold border border-gray-300">telc Deutsch B2·C1 Medizin</td>
                    <td class="p-2 border border-gray-300">Scris 80 min (citit, ascultat, gramatică) + oral 65 min (anamneză 20 min · Arztbrief 20 min · prezentare 20 min)</td>
                    <td class="p-2 border border-gray-300">300–360 €</td>
                    <td class="p-2 border border-gray-300">4-6 săpt.</td>
                    <td class="p-2 border border-gray-300">Bucureşti, Iaşi</td>
                    <td class="p-2 border border-gray-300">Înscriere min. 14 zile înainte</td>
                </tr>
                <tr class="border-b">
                    <td class="p-2 font-semibold border border-gray-300">FaMed C1</td>
                    <td class="p-2 border border-gray-300">Identic FSP (20-20-20); barem ≥ 60 %/probă</td>
                    <td class="p-2 border border-gray-300">490 € (Mainz)</td>
                    <td class="p-2 border border-gray-300">≈ 4 săpt. prin e-mail</td>
                    <td class="p-2 border border-gray-300">doar Mainz (LMU)</td>
                    <td class="p-2 border border-gray-300">Din 08/2024 format unic Bayern & RLP</td>
                </tr>
                <tr>
                    <td class="p-2 font-semibold border border-gray-300">PKT C1 (FIA)</td>
                    <td class="p-2 border border-gray-300">3×20 min (doc scrisă · prezentare colegială · informare pacient)</td>
                    <td class="p-2 border border-gray-300">450-480 €</td>
                    <td class="p-2 border border-gray-300">&lt; 4 săpt.</td>
                    <td class="p-2 border border-gray-300">Frankfurt (lunar)</td>
                    <td class="p-2 border border-gray-300">Acceptat explicit în HH, HE, SL</td>
                </tr>
            </tbody>
        </table>
    </div>
    
    <h4 class="font-bold text-lg text-gray-800 border-b pb-2 mt-6">2. Landuri care acceptă telc B2·C1 Medizin</h4>
    <ul class="list-disc list-inside space-y-1">
        <li><strong>Acceptare oficială:</strong> Hamburg, Hessen (candidaţi UE/SEE), Saarland, Schleswig-Holstein.</li>
        <li><strong>Acceptare la cerere (caz-cu-caz):</strong> Nordrhein-Westfalen, Sachsen, Sachsen-Anhalt, Brandenburg.</li>
        <li><strong>Refuz explicit (cer FSP propriu):</strong> Berlin, Bayern, Baden-Württemberg, Mecklenburg-Vorpommern.</li>
    </ul>
    
    <h4 class="font-bold text-lg text-gray-800 border-b pb-2 mt-6">3. Landuri care acceptă FaMed C1</h4>
    <ul class="list-disc list-inside space-y-1">
        <li><strong>Acceptare directă:</strong> Bayern, Rheinland-Pfalz.</li>
        <li><strong>Acceptare condiționată:</strong> Baden-Württemberg (dacă a fost recunoscut deja în BY/RLP).</li>
    </ul>
    
    <h4 class="font-bold text-lg text-gray-800 border-b pb-2 mt-6">4. Checklist pentru înscriere la telc în România</h4>
    <ul class="list-disc list-inside space-y-1">
        <li>Alege centru (B.Smart Bucureşti / Lektor Iaşi) şi data (min. 14 zile în avans).</li>
        <li>Plăteşte on-site (300–360 €) şi adu CI/paşaport.</li>
        <li>Pregăteşte-te pe modelul oficial telc.</li>
        <li>În paralel, trimite dosarul de Approbation – certificatul telc ajunge la timp pentru landurile care îl acceptă.</li>
    </ul>
</div>
        """
    },
    {
        "title": "Analiza Comparativă a Landurilor",
        "description": "Cele mai multe FSP-uri sunt în Nordrhein-Westfalen, cel mai sever barem este în Bayern",
        "category": "land-comparison",
        "content_type": "rich-content",
        "icon_emoji": "📊",
        "color_theme": "green",
        "order_priority": 2,
        "rich_content": """
<div class="space-y-4 text-gray-700">
    <p class="font-bold">Pe scurt: Cele mai multe FSP-uri sunt în Nordrhein-Westfalen (cele mai mari șanse de programare rapidă). Cel mai sever barem este în Bayern. Pentru viteză administrativă, Berlin și Baden-Württemberg ies în faţă.</p>

    <h4 class="font-bold text-lg text-gray-800 border-b pb-2">1. Unde prinzi loc cel mai rapid la FSP?</h4>
    <ul class="list-disc list-inside">
        <li><strong>Nordrhein-Westfalen (NRW):</strong> Cel mai mare volum (2040 examene în 2023), taxe reduse (350-400€).</li>
        <li><strong>Bayern:</strong> Sesiuni aproape săptămânale la München.</li>
        <li><strong>Baden-Württemberg:</strong> Patru centre de examen (distribuție bună).</li>
        <li><strong>Rheinland-Pfalz:</strong> Prioritate dacă ai contract/hospitație în land.</li>
    </ul>
    
    <h4 class="font-bold text-lg text-gray-800 border-b pb-2 mt-6">2. Unde este FSP-ul considerat cel mai dificil?</h4>
    <ul class="list-disc list-inside">
        <li><strong>Bayern:</strong> Doar ~48% rată de promovare.</li>
        <li><strong>Nordrhein (parte din NRW):</strong> 35.8% rată de eșec în 2023.</li>
        <li><strong>Sachsen:</strong> Taxă mare (590€), listă de termeni foarte tehnică.</li>
        <li><strong>Thüringen:</strong> Așteptare lungă (4-5 luni) și listă obligatorie de termeni.</li>
    </ul>

    <h4 class="font-bold text-lg text-gray-800 border-b pb-2 mt-6">3. Unde finalizezi cel mai rapid Approbation-ul?</h4>
    <ul class="list-disc list-inside">
        <li><strong>Berlin:</strong> Certificat trimis la autoritate în ≤ 10 zile.</li>
        <li><strong>Baden-Württemberg:</strong> Approbation finalizată în ~35 de zile.</li>
        <li><strong>NRW:</strong> Procesare în paralel cu FSP.</li>
        <li><strong>Hamburg:</strong> Rezultat pe loc, dosar digital.</li>
    </ul>

    <h4 class="font-bold text-lg text-gray-800 border-b pb-2 mt-6">4. Cum să alegi în practică?</h4>
    <p><strong>Viteză și cost:</strong> Aplică în NRW. <strong>Reputație și rigurozitate:</strong> Alege Bayern. <strong>Eficiență administrativă:</strong> Optează pentru Berlin sau Baden-Württemberg. <strong>Ai deja o ofertă:</strong> Rheinland-Pfalz sau Sachsen îți pot scurta timpii.</p>
</div>
        """
    },
    {
        "title": "Canale YouTube utile",
        "description": "Lista actualizată de canale YouTube pentru pregătirea FSP și Approbation",
        "category": "youtube",
        "content_type": "rich-content",
        "icon_emoji": "📺",
        "color_theme": "red",
        "order_priority": 3,
        "rich_content": """
<div class="space-y-4 text-gray-700">
    <p class="font-bold">Actualizare: iunie 2025. Toate link‑urile au fost verificate manual; sunt afișate integral și pot fi accesate prin click.</p>
    <p class="font-semibold text-blue-700">Cum folosești: urmărește simulările complete, copiază structura răspunsurilor și folosește funcția de redare încetinită pentru a nota terminologia.</p>
    
    <div class="space-y-3">
        <div class="p-3 bg-gray-50 rounded-lg">
            <h4 class="font-semibold text-gray-800">1. ärztesprech</h4>
            <p class="text-sm">Simulări complete FSP, feedback detaliat; ~50 000 abonați</p>
            <a href="https://www.youtube.com/channel/UCsWBNwfMj0oF5a6fadcMELg" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/channel/UCsWBNwfMj0oF5a6fadcMELg</a>
        </div>
        
        <div class="p-3 bg-gray-50 rounded-lg">
            <h4 class="font-semibold text-gray-800">2. DMiNetz International</h4>
            <p class="text-sm">Ghiduri birocratice și tutoriale KP/FSP; ~45 000 abonați</p>
            <a href="https://www.youtube.com/channel/UCDIfxnVJryfV4AoheGpi-Uw" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.youtube.com/channel/UCDIfxnVJryfV4AoheGpi-Uw</a>
        </div>
    </div>
</div>
        """
    },
    {
        "title": "Grupuri de suport",
        "description": "Grupuri Facebook active pentru medici români în Germania",
        "category": "support-groups",
        "content_type": "rich-content",
        "icon_emoji": "👥",
        "color_theme": "purple",
        "order_priority": 4,
        "rich_content": """
<div class="space-y-4 text-gray-700">
    <p class="font-bold">Grupuri Facebook active pentru medici români în Germania</p>
    <p class="font-semibold text-blue-700">Cum folosești: caută în secțiunea "Fișiere" pentru protocoale PDF recente și folosește bara de căutare internă cu cuvinte‑cheie ("FSP raport", "Berufserlaubnis").</p>
    
    <div class="space-y-3">
        <div class="p-3 bg-gray-50 rounded-lg">
            <h4 class="font-semibold text-gray-800">1. Medici Români în Germania</h4>
            <p class="text-sm">≈9 300 membri; protocoale și joburi [RO]</p>
            <a href="https://www.facebook.com/groups/441619945878317/" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline text-sm break-all">https://www.facebook.com/groups/441619945878317/</a>
        </div>
    </div>
</div>
        """
    },
    {
        "title": "Site-uri oficiale",
        "description": "Linkuri oficiale pe land pentru Fachsprachprüfung și Approbation",
        "category": "official-sites",
        "content_type": "rich-content",
        "icon_emoji": "🏛️",
        "color_theme": "gray",
        "order_priority": 5,
        "rich_content": """
<div class="space-y-4 text-gray-700">
    <p class="font-bold">Linkuri oficiale pe land pentru Fachsprachprüfung și Approbation</p>
    <p class="font-semibold text-blue-700">Sugestie: verifică întâi site‑ul autorității de Approbation pentru lista de documente, apoi rezervă data pentru FSP pe site‑ul camerei medicale.</p>
    
    <div class="space-y-4">
        <div class="border-l-4 border-blue-500 pl-4">
            <h4 class="font-bold text-lg text-gray-800 mb-2">Baden‑Württemberg</h4>
            <div class="space-y-1">
                <div>
                    <span class="font-semibold">Fachsprachprüfung – LÄK BW:</span>
                    <a href="https://www.aerztekammer-bw.de/fachsprachenpruefung" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://www.aerztekammer-bw.de/fachsprachenpruefung</a>
                </div>
                <div>
                    <span class="font-semibold">Approbation – Regierungspräsidium Stuttgart:</span>
                    <a href="https://rp.baden-wuerttemberg.de/themen/bildung/ausbildung/seiten/approbation-inland/" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline ml-2 break-all">https://rp.baden-wuerttemberg.de/themen/bildung/ausbildung/seiten/approbation-inland/</a>
                </div>
            </div>
        </div>
    </div>
</div>
        """
    },
    {
        "title": "Documente specifice per Land",
        "description": "Ghiduri detaliate pentru fiecare Land german cu cerințe specifice și proceduri locale",
        "category": "land-specific",
        "content_type": "rich-content",
        "icon_emoji": "📁",
        "color_theme": "indigo",
        "order_priority": 6,
        "rich_content": """
<div class="space-y-6 text-gray-700">
    <p class="font-bold text-lg">Ghiduri detaliate pentru fiecare Land german cu cerințe specifice și proceduri locale.</p>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border rounded-lg p-4 bg-blue-50">
            <h4 class="font-bold text-blue-700 mb-2">🏛️ Bayern</h4>
            <ul class="text-sm space-y-1">
                <li>• Cerințe specifice FSP</li>
                <li>• Proceduri Landesprüfungsamt</li>
                <li>• Timeline și documentația</li>
            </ul>
            <a href="https://fromsmash.com/FSP-info-utile-per-Land" target="_blank" rel="noopener noreferrer" 
               class="text-blue-600 hover:underline text-sm mt-2 inline-block">
               📄 Descarcă ghidul Bayern →
            </a>
        </div>

        <div class="border rounded-lg p-4 bg-green-50">
            <h4 class="font-bold text-green-700 mb-2">🌊 Baden-Württemberg</h4>
            <ul class="text-sm space-y-1">
                <li>• Specificități regionale</li>
                <li>• Contact autorități</li>
                <li>• Cerințe suplimentare</li>
            </ul>
            <a href="https://fromsmash.com/FSP-info-utile-per-Land" target="_blank" rel="noopener noreferrer" 
               class="text-green-600 hover:underline text-sm mt-2 inline-block">
               📄 Descarcă ghidul B-W →
            </a>
        </div>
    </div>
</div>
        """
    }
]

def generate_migration_data():
    """Generate JSON data for MongoDB import."""
    print("🔄 Generating migration data for Informatii Utile documents...")
    
    migration_docs = []
    current_time = datetime.utcnow().isoformat()
    
    for content in STATIC_CONTENT:
        doc = {
            "id": str(uuid.uuid4()),
            "title": content["title"],
            "description": content.get("description"),
            "category": content["category"],
            "content_type": content["content_type"],
            "file_id": content.get("file_id"),
            "external_url": content.get("external_url"),
            "rich_content": content.get("rich_content"),
            "icon_emoji": content.get("icon_emoji"),
            "color_theme": content.get("color_theme"),
            "order_priority": content["order_priority"],
            "is_active": True,
            "created_by": "migration_script",
            "created_at": current_time,
            "updated_by": None,
            "updated_at": None
        }
        migration_docs.append(doc)
        print(f"✓ Prepared: {doc['title']}")
    
    # Save to JSON file
    output_file = "informatii_utile_migration_data.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(migration_docs, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Migration data generated successfully!")
    print(f"📄 File saved: {output_file}")
    print(f"📊 Documents prepared: {len(migration_docs)}")
    
    return output_file, migration_docs

if __name__ == "__main__":
    generate_migration_data()