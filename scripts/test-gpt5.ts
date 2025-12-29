// Test GPT-5.2 API call
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testModel(model: string) {
  console.log(`\n=== Testing ${model} ===`);

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Respond in JSON format.' },
        { role: 'user', content: 'Say hello in JSON: {"greeting": "..."}' }
      ],
      response_format: { type: 'json_object' },
      max_completion_tokens: 1000,
      temperature: 0.3,
    });

    console.log('Success!');
    console.log('Content:', response.choices[0]?.message?.content);
    console.log('Usage:', JSON.stringify(response.usage));

  } catch (error) {
    console.log('Error:', error instanceof Error ? error.message : error);
    if (error instanceof OpenAI.APIError) {
      console.log('Status:', error.status);
      console.log('Code:', error.code);
    }
  }
}

async function main() {
  await testModel('gpt-5.2');
  await testModel('gpt-4o');
}

main();
