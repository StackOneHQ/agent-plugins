// For hosts whose JSON event schema is not pinned down yet: collect anything
// shaped like a tool call, and take the last assistant text as the reply.

import { parseJsonLines } from '../process.ts';
import type { JsonEvent, RawRun, ToolCall, Transcript } from '../types.ts';

export function parseLiberally(raw: RawRun): Transcript {
  const toolCalls: ToolCall[] = [];
  let finalText = '';
  let turns = 0;
  for (const event of parseJsonLines(raw.stdout)) {
    walk(event, (node) => {
      if (isToolCallShaped(node)) {
        toolCalls.push({ name: node.name ?? node.tool ?? 'tool', input: node.input ?? node.arguments ?? node.args ?? node });
      }
    });
    if (event.type === 'assistant' || event.role === 'assistant') {
      turns += 1;
      const text = extractText(event);
      if (text) {
        finalText = text;
      }
    }
    if (event.type === 'result' && typeof event.result === 'string') {
      finalText = event.result;
    }
  }
  return { toolCalls, finalText, turns, error: raw.error };
}

function isToolCallShaped(node: unknown): node is JsonEvent {
  if (!node || typeof node !== 'object') {
    return false;
  }
  const type = (node as JsonEvent).type;
  return type === 'tool_use' || type === 'tool_call' || type === 'function_call';
}

function extractText(event: JsonEvent): string {
  const content = event.message?.content ?? event.content;
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .filter((block: JsonEvent) => block.type === 'text')
      .map((block: JsonEvent) => block.text)
      .join('\n');
  }
  return '';
}

function walk(node: unknown, visit: (node: unknown) => void): void {
  visit(node);
  if (node && typeof node === 'object') {
    for (const value of Object.values(node as Record<string, unknown>)) {
      walk(value, visit);
    }
  }
}
