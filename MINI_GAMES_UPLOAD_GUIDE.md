# Mini-Games Upload Guide

## Overview
This guide explains how to upload Word documents (.docx) to add questions for the Fachbegriffe Flash and Clinical Cases mini-games through the Admin Panel.

## Accessing the Upload Feature

1. **Open Admin Panel**: Access the admin panel from your application
2. **Navigate to Mini Games**: Click on the "Mini Games" tab in the admin panel
3. **Select Game Type**: Choose between "Fachbegriffe Flash" or "Clinical Cases"

## Document Format Requirements

### Fachbegriffe Flash Questions
**Format**: Word document (.docx)
**Structure**: Each question should follow this pattern:

```
Ce înseamnă 'Schmerzen' în română?
a) Dureri
b) Febră
c) Greață
d) Amețeală
Răspuns: a
```

**Requirements**:
- Question in Romanian
- 4 options labeled a), b), c), d)
- Correct answer marked with "Răspuns: [letter]"
- One question per section

### Clinical Cases Questions
**Format**: Word document (.docx)
**Structure**: Each case should follow this pattern:

```
Pacient de 45 ani, bărbat, prezintă durere toracică intensă, irradiată în brațul stâng, transpirații reci și dispnee. Care este cel mai probabil diagnostic?
a) Pneumonie
b) Infarct miocardic acut
c) Reflux gastroesofagian
d) Anxietate
Răspuns: b
```

**Requirements**:
- Clinical case description in Romanian
- 4 diagnostic options labeled a), b), c), d)
- Correct answer marked with "Răspuns: [letter]"
- One case per section

## Upload Process

1. **Prepare Document**: Create your Word document following the format above
2. **Upload File**: 
   - Click the upload area in the admin panel
   - Select your .docx file
   - The system will automatically process the document
3. **Review Results**: Check the notification for upload success and number of questions added

## Tips for Best Results

- **Clear Formatting**: Use simple text formatting in Word
- **Consistent Structure**: Follow the exact format shown in the examples
- **Quality Content**: Ensure questions are clear and unambiguous
- **Correct Answers**: Double-check that the "Răspuns" matches one of the options
- **Multiple Questions**: You can include multiple questions in one document

## Troubleshooting

### Common Issues

1. **Upload Fails**: 
   - Ensure file is .docx format
   - Check file size (should be under 10MB)
   - Verify document follows the required format

2. **Questions Not Parsed**:
   - Check that questions follow the exact format
   - Ensure "Răspuns:" is included for each question
   - Verify all options are labeled a), b), c), d)

3. **Wrong Answers**:
   - Confirm "Răspuns:" letter matches one of the options
   - Check for typos in option labels

### Error Messages

- **"Only .docx files are supported"**: Convert your document to .docx format
- **"No valid questions found"**: Check document format and structure
- **"Upload failed"**: Try again or contact support

## Technical Details

### Backend Processing
- Documents are parsed using the `python-docx` library
- Questions are extracted and stored in MongoDB
- Automatic validation ensures proper format

### Data Storage
- Questions are stored in the `quiz_questions` collection
- Each question includes: question text, options, correct answer, category
- Questions are marked as active and available for mini-games

### Integration
- Mini-games automatically fetch questions from the database
- Questions are randomly selected for each game session
- Fallback questions are available if database is unavailable

## Support

If you encounter issues:
1. Check this guide for common solutions
2. Verify your document format matches the examples
3. Contact the development team for technical support

## Example Documents

### Fachbegriffe Example
```
Ce înseamnă 'Herz' în română?
a) Inimă
b) Plămân
c) Ficat
d) Rinichi
Răspuns: a

Cum se spune 'durere' în germană?
a) Schmerzen
b) Fieber
c) Husten
d) Übelkeit
Răspuns: a
```

### Clinical Cases Example
```
Femeie de 28 ani prezintă febră de 39°C, durere de cap intensă, rigiditate cervicală și fotofobia. Diagnostic?
a) Gripă
b) Meningită
c) Sinuzită
d) Migrene
Răspuns: b

Copil de 6 ani cu febră, durere în gât, ganglioni măriți și placaj alb pe amigdale. Diagnostic?
a) Laringită
b) Angină streptococică
c) Gripă
d) Bronșită
Răspuns: b
```