/**
 * Seed muscle groups + exercises for Gym11 (one-shot).
 * Uses Firebase CLI access token (project IAM → bypasses rules).
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

const PROJECT = 'gym11-1111';
const USER_ID = 'aL6wMQQZMmbVKFzBbXClmmq7PPt1';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const groups = [
  { name: 'Pecho', color: '#ef4444' },
  { name: 'Espalda', color: '#3b82f6' },
  { name: 'Hombros', color: '#f59e0b' },
  { name: 'Bíceps', color: '#8b5cf6' },
  { name: 'Tríceps', color: '#ec4899' },
  { name: 'Piernas', color: '#22c55e' },
  { name: 'Glúteos', color: '#14b8a6' },
  { name: 'Core', color: '#06b6d4' },
  { name: 'Cardio', color: '#f97316' },
];

const exercisesByGroup = {
  Pecho: ['Press banca', 'Press inclinado', 'Aperturas', 'Fondos en paralelas', 'Press mancuernas'],
  Espalda: ['Dominadas', 'Remo con barra', 'Jalón al pecho', 'Remo mancuerna', 'Peso muerto'],
  Hombros: ['Press militar', 'Elevaciones laterales', 'Pájaros', 'Press Arnold', 'Encogimientos'],
  Bíceps: ['Curl barra', 'Curl mancuernas', 'Curl martillo', 'Curl predicador'],
  Tríceps: ['Press francés', 'Extensión polea', 'Fondos en banco', 'Patada de tríceps'],
  Piernas: ['Sentadilla', 'Prensa', 'Peso muerto rumano', 'Extensión de cuádriceps', 'Curl femoral', 'Gemelos de pie'],
  Glúteos: ['Hip thrust', 'Puente de glúteos', 'Patada de glúteo'],
  Core: ['Plancha', 'Crunch', 'Elevación de piernas', 'Russian twist'],
  Cardio: ['Cinta', 'Bici', 'Elíptica', 'Remo máquina'],
};

function getAccessToken() {
  const cfgPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  return cfg.tokens.access_token;
}

function str(v) {
  return { stringValue: v };
}
function num(v) {
  return { integerValue: String(v) };
}
function ts(iso) {
  return { timestampValue: iso };
}

async function createDoc(collection, fields) {
  const token = getAccessToken();
  const res = await fetch(`${BASE}/${collection}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${collection}: ${res.status} ${text}`);
  }
  const data = await res.json();
  const id = data.name.split('/').pop();
  return id;
}

async function main() {
  const now = new Date().toISOString();
  const groupIds = {};

  console.log('Creando grupos musculares...');
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const id = await createDoc('muscleGroups', {
      name: str(g.name),
      color: str(g.color),
      userId: str(USER_ID),
      sortOrder: num(i),
      createdAt: ts(now),
    });
    groupIds[g.name] = id;
    console.log(`  ✓ ${g.name}`);
  }

  console.log('Creando ejercicios...');
  let order = 0;
  for (const [groupName, list] of Object.entries(exercisesByGroup)) {
    const muscleGroupId = groupIds[groupName];
    const color = groups.find((g) => g.name === groupName)?.color || '#6b7280';
    for (const name of list) {
      await createDoc('exercises', {
        name: str(name),
        muscleGroupId: str(muscleGroupId),
        color: str(color),
        notes: str(''),
        userId: str(USER_ID),
        sortOrder: num(order++),
        createdAt: ts(now),
      });
      console.log(`  ✓ ${name} (${groupName})`);
    }
  }

  console.log(`\nListo: ${groups.length} grupos, ${order} ejercicios para felipemonsegur@gmail.com`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
