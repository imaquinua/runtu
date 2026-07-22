import { PROJECT_OUTPUT_SCHEMA, projectAgentInstructions } from '../api/_agent/config.js';
import { buildRadiographyDefinition } from '../api/_agent/radiography.js';

const required = new Set(PROJECT_OUTPUT_SCHEMA.required);
for (const key of ['projects', 'tasks']) {
  if (!required.has(key)) throw new Error(`Falta ${key} en el contrato operativo.`);
}

const projectFields = PROJECT_OUTPUT_SCHEMA.properties.projects.items.required;
const taskFields = PROJECT_OUTPUT_SCHEMA.properties.tasks.items.required;
if (!projectFields.includes('owner') || !taskFields.includes('owner') || !taskFields.includes('project')) {
  throw new Error('La relación proyecto/tarea/responsable no es obligatoria en el esquema.');
}

const instructions = projectAgentInstructions('0.4.7');
for (const rule of ['Nunca inventes responsables', 'source inferred', 'status ready', 'revisión humana']) {
  if (!instructions.includes(rule)) throw new Error(`Falta regla operativa: ${rule}`);
}

const definition = buildRadiographyDefinition({
  id: '00000000-0000-4000-8000-000000000007',
  revision: 8,
  agent_name: 'Minuta operativa',
  primary_user: 'Gerencia y líderes',
  desired_result: 'convertir acuerdos en proyectos y tareas revisables',
  team_context: 'comité semanal',
  purpose_summary: 'Convertir acuerdos en proyectos y tareas revisables.',
});
if (definition.version !== '0.4.7') throw new Error('La familia de versión operativa es incorrecta.');
if (!definition.manifest.capabilities.includes('dictation_input')) throw new Error('El manifiesto no declara dictado.');
if (!definition.manifest.capabilities.includes('owner_attribution')) throw new Error('El manifiesto no declara responsables.');

console.log('PASS: contrato 0.4.x exige proyectos, tareas, relación y responsables; mantiene revisión humana y no invención.');
