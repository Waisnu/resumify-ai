import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const apiKeys = (process.env.GEMINI_API_KEYS || '').split(',').map(key => key.trim()).filter(Boolean);
    
    if (apiKeys.length === 0) {
      return res.status(500).json({ error: 'No API keys configured' });
    }

    const healthResults: { [key: string]: 'healthy' | 'unhealthy' } = {};

    // Test each API key
    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i];
      const keyId = `key_${i}`;
      
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
        
        // Simple test prompt - optimized for minimal token usage
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: "OK" }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 5,
          }
        });
        
        const response = result.response.text();
        healthResults[keyId] = response ? 'healthy' : 'unhealthy';
      } catch (error) {
        console.error(`API Key ${i + 1} health check failed:`, error);
        healthResults[keyId] = 'unhealthy';
      }
    }

    return res.status(200).json({ 
      apiKeyHealth: healthResults,
      totalKeys: apiKeys.length,
      healthyKeys: Object.values(healthResults).filter(status => status === 'healthy').length
    });

  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ error: 'Health check failed' });
  }
} 