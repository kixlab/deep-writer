import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// --- Prompt Templates ---

const SYSTEM_PROMPT = `You are a writing assistant. Generate 3-4 alternative phrasings for the selected text.
Each alternative should:
- Preserve the original meaning
- Vary in style, word choice, or sentence structure
- Be roughly similar in length to the original
- Fit naturally in the surrounding context

IMPORTANT: Return your response as valid JSON in this exact format:
{ "alternatives": ["alternative 1", "alternative 2", "alternative 3"] }

Do not include any other text, explanations, or markdown formatting outside the JSON.`;

function buildUserPrompt(selectedText: string, context: string, goal: string): string {
  const parts: string[] = [];

  if (goal) {
    parts.push(`Writing goal: ${goal}`);
    parts.push('');
  }

  if (context) {
    parts.push('Surrounding context:');
    parts.push(context);
    parts.push('');
  }

  parts.push('Selected text to rephrase:');
  parts.push(selectedText);

  return parts.join('\n');
}

// --- Response Parsing ---

interface AlternativesResponse {
  alternatives: string[];
}

function parseAlternativesResponse(content: string): AlternativesResponse | null {
  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  let cleaned = content.trim();
  const fenceMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Try direct JSON parse
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Not valid JSON, try extracting JSON from prose
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        // Also failed
      }
    }
  }

  if (!parsed) return null;

  // Case 1: Standard format { "alternatives": ["...", "..."] }
  if (parsed.alternatives && Array.isArray(parsed.alternatives)) {
    const alternatives = (parsed.alternatives as unknown[]).filter(
      (item): item is string => typeof item === 'string' && item.length > 0,
    );
    if (alternatives.length > 0) {
      return { alternatives };
    }
  }

  // Case 2: Model returned an array at top level
  if (Array.isArray(parsed)) {
    const alternatives = (parsed as unknown[]).filter(
      (item): item is string => typeof item === 'string' && item.length > 0,
    );
    if (alternatives.length > 0) {
      return { alternatives };
    }
  }

  // Case 3: Model returned { "options": [...] } or { "suggestions": [...] }
  const altArray = parsed.options ?? parsed.suggestions ?? parsed.rephrased ?? parsed.results;
  if (Array.isArray(altArray)) {
    const alternatives = (altArray as unknown[]).filter(
      (item): item is string => typeof item === 'string' && item.length > 0,
    );
    if (alternatives.length > 0) {
      return { alternatives };
    }
  }

  return null;
}

// --- Request Validation ---

interface AlternativesRequest {
  selectedText: string;
  context: string;
  goal: string;
}

function validateRequest(body: unknown): body is AlternativesRequest {
  if (!body || typeof body !== 'object') return false;
  const req = body as Record<string, unknown>;

  if (typeof req.selectedText !== 'string' || req.selectedText.trim().length === 0) return false;
  if (req.selectedText.length > 500) return false;

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
      { error: 'Invalid request. selectedText is required and must be at most 500 characters.', retryable: false },
      { status: 400 },
    );
  }

  const selectedText = body.selectedText.trim();
  const context = typeof body.context === 'string' ? body.context : '';
  const goal = typeof body.goal === 'string' ? body.goal : '';

  // Build prompt
  const userPrompt = buildUserPrompt(selectedText, context, goal);

  // Call OpenAI API with timeout
  const openai = new OpenAI({ apiKey });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const completion = await openai.chat.completions.create(
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 256,
        response_format: { type: 'json_object' },
      },
      { signal: controller.signal },
    );

    clearTimeout(timeout);

    const message = completion.choices[0]?.message;
    const content = message?.content;
    const finishReason = completion.choices[0]?.finish_reason;

    console.log('[/api/alternatives] finish_reason:', finishReason);
    console.log('[/api/alternatives] raw content:', content?.slice(0, 500));

    if (!content) {
      console.error('[/api/alternatives] Empty content. refusal:', message?.refusal);
      return NextResponse.json(
        { error: 'Empty response from AI. Please try again.', retryable: true },
        { status: 502 },
      );
    }

    // Parse response
    const parsed = parseAlternativesResponse(content);
    if (!parsed) {
      console.error('[/api/alternatives] Parse failed. Raw:', content.slice(0, 1000));
      return NextResponse.json(
        { error: `Could not parse AI response. Raw: ${content.slice(0, 200)}`, retryable: true },
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
