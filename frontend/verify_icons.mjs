import fs from 'node:fs';
import path from 'node:path';
import * as lucide from 'lucide-react';
import { LESSON_ICON_MAP, CATEGORY_FALLBACK_ICONS } from './src/data/lessonIcons.js';

const lessonIconContent = fs.readFileSync('./src/components/LessonIcon.jsx', 'utf8');
const regMatch = lessonIconContent.match(/const ICON_REGISTRY = \{([^}]+)\}/s);
if (!regMatch) {
  console.error('Could not parse ICON_REGISTRY');
  process.exit(1);
}

const registered = new Set(
  regMatch[1]
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
);

const jsContent = fs.readFileSync('./src/data/lessonIcons.js', 'utf8');
const keywordIcons = [...jsContent.matchAll(/icon:\s*"([A-Za-z0-9]+)"/g)].map(m => m[1]);
const mapIcons = Object.values(LESSON_ICON_MAP);
const fallbackIcons = Object.values(CATEGORY_FALLBACK_ICONS);

const userPromptIcons = [
  'FileCode', 'Code', 'Heading', 'AlignLeft', 'Link', 'Image', 'Table', 'ClipboardList', 'List', 'Globe',
  'Palette', 'Type', 'Box', 'Rows3', 'Grid3X3', 'Layers', 'MonitorSmartphone', 'Clapperboard', 'WandSparkles',
  'Variable', 'Database', 'GitBranch', 'Repeat', 'FunctionSquare', 'Package', 'MousePointerClick', 'Network', 'RefreshCw',
  'BookOpen', 'Puzzle', 'Library', 'Terminal',
  'BrainCircuit', 'Brain', 'Bot', 'Workflow', 'Sparkles', 'Cpu',
  'Calculator', 'Sigma', 'Equal', 'Triangle', 'Shapes', 'ChartNoAxesCombined', 'Divide', 'Radical',
  'Cog', 'Move', 'Weight', 'Zap', 'BatteryCharging', 'Magnet', 'Waves', 'Lightbulb', 'Gauge'
];

const allNeededIcons = new Set([
  ...mapIcons,
  ...fallbackIcons,
  ...keywordIcons,
  ...userPromptIcons
]);

console.log('Total unique icons needed:', allNeededIcons.size);

const missingInLucide = [];
const missingInRegistry = [];

for (const icon of allNeededIcons) {
  if (!lucide[icon]) {
    missingInLucide.push(icon);
  }
  if (!registered.has(icon)) {
    missingInRegistry.push(icon);
  }
}

console.log('Missing in Lucide React:', missingInLucide);
console.log('Missing in LessonIcon.jsx registry:', missingInRegistry);
