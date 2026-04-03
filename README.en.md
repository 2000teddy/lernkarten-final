# Lernkarten App

🇩🇪 [Deutsch](README.md)

Local browser-based flashcard app for students, teachers, and self-study.

## Overview

This project is a lightweight flashcard application built with Node.js, Express, and plain HTML/CSS/JavaScript. There is no build step. Card sets are stored as JSON or CSV files, while user progress and statistics are stored in SQLite.

## Features

- Flashcards with flip animation
- Multiple learning modes: flip, multiple choice, typing, due cards
- In-browser editor for creating and updating JSON sets
- JSON, CSV, and XLSX import
- Download of original set files
- Export of existing sets as CSV or XLSX
- Daily card spotlight on the home screen
- Quick-add block for creating many cards from plain text
- Browser text-to-speech for question and answer playback
- User profiles with separate learning progress
- Spaced repetition (SM-2)
- Statistics dashboard
- PWA support
- Starter templates for teachers and students

## Installation

```bash
git clone https://github.com/2000teddy/lernkarten-final.git
cd lernkarten-final
npm install
npm start
```

Open: `http://localhost:3004`

## Data Format

### JSON

```json
{
  "schemaVersion": 2,
  "title": "English - Travel Vocabulary",
  "description": "Basic travel vocabulary",
  "subject": "English",
  "topic": "Vocabulary",
  "grade": "5-6",
  "language": "en",
  "audience": "Students",
  "tags": ["travel", "everyday"],
  "color": "#3B82F6",
  "cards": [
    {
      "id": 1,
      "question": "train station",
      "answer": "Bahnhof",
      "explanation": "Useful travel word.",
      "quality": null
    }
  ]
}
```

### CSV

```csv
schemaVersion,2
title,English - Travel Vocabulary
subject,English
topic,Vocabulary
grade,5-6
language,en
tags,travel|everyday
color,#3B82F6
question,answer,explanation
train station,Bahnhof,Useful travel word.
```

## Templates

The upload dialog offers downloadable starter templates:

- `public/templates/vokabeln-template.json`
- `public/templates/vokabeln-template.csv`
- `public/templates/teacher-template.csv`

## Notes

- Uploaded filenames are normalized on the server.
- Existing target filenames are rejected to avoid overwriting data.
- Legacy sets without metadata still work.
