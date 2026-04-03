const assert = require('assert');
const {
  parseCsv,
  setToCsvContent,
  sanitizeSpreadsheetCell
} = require('../server');

const sampleSet = {
  schemaVersion: 2,
  title: 'Mathe, Klasse 4',
  description: 'Zeile 1\nZeile 2',
  subject: 'Mathe',
  topic: 'Textaufgaben',
  grade: '4',
  language: 'de',
  audience: 'Schueler',
  tags: ['comma,value', 'mehrzeilig'],
  color: '#10B981',
  cards: [
    {
      id: 1,
      question: '=2+2',
      answer: '@cmd',
      explanation: '-SUM(A1:A2)'
    },
    {
      id: 2,
      question: 'Frage, mit Komma',
      answer: 'Antwort',
      explanation: 'Text\nmehrzeilig'
    }
  ]
};

const csv = setToCsvContent(sampleSet);
const parsed = parseCsv(csv);

assert.equal(parsed.title, sampleSet.title);
assert.equal(parsed.description, sampleSet.description);
assert.equal(parsed.subject, sampleSet.subject);
assert.equal(parsed.topic, sampleSet.topic);
assert.equal(parsed.grade, sampleSet.grade);
assert.equal(parsed.language, sampleSet.language);
assert.deepEqual(parsed.tags, sampleSet.tags);
assert.equal(parsed.cards.length, sampleSet.cards.length);
assert.equal(parsed.cards[0].question, "'=2+2");
assert.equal(parsed.cards[0].answer, "'@cmd");
assert.equal(parsed.cards[0].explanation, "'-SUM(A1:A2)");
assert.equal(parsed.cards[1].question, 'Frage, mit Komma');
assert.equal(parsed.cards[1].explanation, 'Text\nmehrzeilig');

assert.equal(sanitizeSpreadsheetCell('=SUM(A1:A2)'), "'=SUM(A1:A2)");
assert.equal(sanitizeSpreadsheetCell('+1'), "'+1");
assert.equal(sanitizeSpreadsheetCell('-cmd'), "'-cmd");
assert.equal(sanitizeSpreadsheetCell('@user'), "'@user");
assert.equal(sanitizeSpreadsheetCell(' =SUM(A1:A2)'), "' =SUM(A1:A2)");
assert.equal(sanitizeSpreadsheetCell('\t=SUM(A1:A2)'), "'\t=SUM(A1:A2)");
assert.equal(sanitizeSpreadsheetCell('normal'), 'normal');

console.log('export smoke ok');
