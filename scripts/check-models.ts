// Check available OpenAI models
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.log('OPENAI_API_KEY not found');
  process.exit(1);
}

console.log('API Key length:', apiKey.length);
console.log('API Key prefix:', apiKey.substring(0, 10) + '...');

async function main() {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  const data = await response.json();

  if (data.error) {
    console.log('API Error:', data.error.message);
    return;
  }

  const models = (data.data as Array<{ id: string }>)
    .map(m => m.id)
    .filter(id =>
      id.includes('gpt-5') ||
      id.includes('gpt-4o') ||
      id.includes('gpt-4-') ||
      id.startsWith('o1') ||
      id.startsWith('o3')
    )
    .sort();

  console.log('\nAvailable models (' + models.length + '):');
  models.forEach(m => console.log(' -', m));
}

main().catch(console.error);
