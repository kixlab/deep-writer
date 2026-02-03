import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { GenerateRequest, GenerateResponse } from '@/types/generation';

// --- Prompt Templates ---

const SYSTEM_PROMPT = `You are a writing assistant for CoWriThink. Generate text ONLY for the [GAP] markers. Preserve all other text exactly. Match the tone, style, and argument direction of the preserved text.

IMPORTANT: Return your response as valid JSON in this exact format:
{ "gaps": [{ "id": "<gap_id>", "text": "<generated text>" }] }

Do not include any other text, explanations, or markdown formatting outside the JSON.`;

function buildUserPrompt(request: GenerateRequest): string {
  const parts: string[] = [];

  parts.push(`User Goal: ${request.goal}`);
  parts.push('');

  if (request.mode === 'continuation') {
    parts.push('Document context:');
    parts.push(request.document);
    parts.push('');
    parts.push(`Continue writing from the indicated position. ${request.userRequest ?? ''}`);
    parts.push('');
    parts.push('Return the continuation as: { "gaps": [{ "id": "continuation", "text": "<your text>" }] }');
  } else {
    parts.push('Document with gaps:');
    parts.push(request.document);
    parts.push('');

    if (request.userRequest) {
      parts.push(`User request: ${request.userRequest}`);
      parts.push('');
    }

    parts.push('Instructions:');
    parts.push('- Fill each [GAP] with coherent text that connects smoothly with surrounding preserved segments.');
    parts.push('- Respect the user\'s writing goal.');
    parts.push('- Do not modify preserved text.');
    parts.push('- Return the gap fills as structured JSON: { "gaps": [{ "id": "<gap_id>", "text": "generated text" }] }');
  }

  return parts.join('\n');
}

// --- Response Parsing ---

function parseGenerateResponse(content: string): GenerateResponse | null {
  // Try direct JSON parse first
  try {
    const parsed = JSON.parse(content);
    if (parsed.gaps && Array.isArray(parsed.gaps)) {
      return parsed as GenerateResponse;
    }
  } catch {
    // Not valid JSON, try fallback
  }

  // Fallback: extract JSON from prose/markdown response
  const jsonMatch = content.match(/\{[\s\S]*"gaps"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.gaps && Array.isArray(parsed.gaps)) {
        return parsed as GenerateResponse;
      }
    } catch {
      // Fallback parsing also failed
    }
  }

  return null;
}

// --- Request Validation ---

function validateRequest(body: unknown): body is GenerateRequest {
  if (!body || typeof body !== 'object') return false;
  const req = body as Record<string, unknown>;

  if (typeof req.goal !== 'string' || req.goal.length === 0) return false;
  if (typeof req.document !== 'string') return false;
  if (!Array.isArray(req.gaps)) return false;
  if (!Array.isArray(req.constraints)) return false;
  if (!['regenerate', 'selection', 'continuation'].includes(req.mode as string)) return false;

  return true;
}

// --- Route Handler ---

export async function POST(request: NextRequest) {
  // Validate API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OpenAI API key not configured.', retryable: false },
      { status: 500 },
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.', retryable: false },
      { status: 400 },
    );
  }

  if (!validateRequest(body)) {
    return NextResponse.json(
      { error: 'Invalid request format.', retryable: false },
      { status: 400 },
    );
  }

  const generateRequest = body as GenerateRequest;

  // Calculate max tokens based on gap sizes
  const totalGapChars = generateRequest.gaps.reduce(
    (sum, gap) => sum + gap.originalText.length,
    0,
  );
  const maxTokens = Math.max(256, Math.min(4096, Math.ceil(totalGapChars * 2)));

  // Build prompt
  const userPrompt = buildUserPrompt(generateRequest);

  // Call OpenAI API with timeout
  const openai = new OpenAI({ apiKey });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const completion = await openai.chat.completions.create(
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      },
      { signal: controller.signal },
    );

    clearTimeout(timeout);

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: 'Empty response from AI. Please try again.', retryable: true },
        { status: 502 },
      );
    }

    // Parse response
    const parsed = parseGenerateResponse(content);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Could not parse AI response. Please try again.', retryable: true },
        { status: 502 },
      );
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    clearTimeout(timeout);

    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.', retryable: true },
        { status: 504 },
      );
    }

    // Handle OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'Rate limited. Please wait and retry.', retryable: true },
          { status: 429 },
        );
      }
      return NextResponse.json(
        { error: 'Generation failed. Please try again.', retryable: true },
        { status: error.status ?? 502 },
      );
    }

    // Network or unknown error
    return NextResponse.json(
      { error: 'Network error. Please try again.', retryable: true },
      { status: 503 },
    );
  }
}
