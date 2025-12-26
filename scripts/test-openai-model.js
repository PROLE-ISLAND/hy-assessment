/* eslint-disable @typescript-eslint/no-require-imports */
// Quick test for OpenAI model availability
const OpenAI = require('openai');
const fs = require('fs');

// Read API key from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const apiKeyMatch = envContent.match(/OPENAI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : null;

if (!apiKey) {
  console.log('ERROR: OPENAI_API_KEY not found in .env.local');
  process.exit(1);
}

async function testModel(modelName) {
  const openai = new OpenAI({ apiKey });

  try {
    console.log(`\nTesting model: ${modelName}`);
    const response = await openai.chat.completions.create({
      model: modelName,
      messages: [{ role: 'user', content: 'Say OK' }],
      max_completion_tokens: 10
    });
    console.log('SUCCESS!');
    console.log('Response:', response.choices[0]?.message?.content);
    console.log('Model used:', response.model);
    return true;
  } catch (error) {
    console.log('ERROR:', error.message);
    return false;
  }
}

async function main() {
  // Test gpt-5.2
  const result = await testModel('gpt-5.2');

  if (!result) {
    console.log('\n--- Trying alternative models ---');
    // Test alternatives if gpt-5.2 fails
    await testModel('gpt-4o');
    await testModel('gpt-4-turbo');
  }
}

main();
