export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY; // No REACT_APP_ prefix
  const anthropicUrl = 'https://api.anthropic.com/v1/messages';

  // Log the incoming prompt for debugging
  console.log('Received prompt:', req.body?.prompt);

  // Support both prompt (simple) and full payload (advanced)
  let payload;
  if (req.body && typeof req.body.prompt === 'string') {
    payload = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 256,
      messages: [
        { role: 'user', content: req.body.prompt }
      ]
    };
  } else {
    // Assume the frontend sent a full Anthropic payload (model, max_tokens, messages, etc.)
    payload = req.body;
  }

  const response = await fetch(anthropicUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  // Log the Anthropic API response for debugging
  console.log('Anthropic API raw response:', data);
  // Extract tip from the response (Anthropic Claude returns it in content[0].text)
  let tip = '';
  if (data && Array.isArray(data.content) && data.content.length > 0 && data.content[0].text) {
    tip = data.content[0].text.trim();
    // If the tip is a JSON string, parse it
    try {
      const parsed = JSON.parse(tip);
      if (typeof parsed === 'string') {
        tip = parsed;
      }
    } catch (e) {
      // Not JSON, keep as is
    }
  }
  console.log('Anthropic API key present:', !!apiKey);
  res.status(response.status).json({ ...data, tip });
}
