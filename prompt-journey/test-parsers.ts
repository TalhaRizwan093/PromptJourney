import { parseConversation } from './src/lib/parsers/smart-paste-parser';
import { detectPlatformFromUrl, isValidShareUrl } from './src/lib/parsers/url-share-parser';

let pass = 0;
let fail = 0;

function assert(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${name}${detail ? ' - ' + detail : ''}`);
    pass++;
  } else {
    console.log(`[FAIL] ${name}${detail ? ' - ' + detail : ''}`);
    fail++;
  }
}

console.log('\n===== Parser Unit Tests =====\n');

// ChatGPT paste parsing
const chatgptResult = parseConversation('User: How do I sort an array?\nChatGPT: You can use Array.sort().\nUser: What about reverse?\nChatGPT: Use Array.reverse().');
assert('ChatGPT paste: detected platform', chatgptResult.platform === 'chatgpt', chatgptResult.platform);
assert('ChatGPT paste: 2 steps', chatgptResult.steps.length === 2, `${chatgptResult.steps.length} steps`);

// Claude paste parsing
const claudeResult = parseConversation('Human: Explain closures\nAssistant: A closure is a function that captures its surrounding scope.\nHuman: Show an example\nAssistant: Here: function outer() { let x = 10; return () => x; }');
assert('Claude paste: detected platform', claudeResult.platform === 'claude', claudeResult.platform);
assert('Claude paste: 2 steps', claudeResult.steps.length === 2, `${claudeResult.steps.length} steps`);

// Gemini paste parsing (using generic "You:" pattern)
const geminiResult = parseConversation('You: What is TypeScript?\nGemini: TypeScript is a typed superset of JavaScript.\nYou: How do I install it?\nGemini: Run npm install typescript.');
assert('Gemini paste: has steps', geminiResult.steps.length >= 1, `${geminiResult.steps.length} steps`);

// URL detection
assert('URL detect: ChatGPT', detectPlatformFromUrl('https://chatgpt.com/share/abc123') === 'chatgpt');
assert('URL detect: chat.openai.com', detectPlatformFromUrl('https://chat.openai.com/share/abc') === 'chatgpt');
assert('URL detect: Claude', detectPlatformFromUrl('https://claude.ai/share/abc123') === 'claude');
assert('URL detect: Gemini', detectPlatformFromUrl('https://gemini.google.com/share/abc123') === 'gemini');
assert('URL detect: unknown', detectPlatformFromUrl('https://example.com/share/abc') === 'unknown');

// URL validation
assert('URL valid: ChatGPT share', isValidShareUrl('https://chatgpt.com/share/abc123') === true);
assert('URL valid: Claude share', isValidShareUrl('https://claude.ai/share/abc123') === true);
assert('URL valid: Gemini share', isValidShareUrl('https://gemini.google.com/share/abc123') === true);
assert('URL invalid: no share path', isValidShareUrl('https://chatgpt.com/c/abc123') === false);
assert('URL invalid: unknown domain', isValidShareUrl('https://example.com/share/abc') === false);
assert('URL invalid: not a URL', isValidShareUrl('not-a-url') === false);

console.log(`\n===== Results: ${pass} passed, ${fail} failed =====`);
process.exit(fail > 0 ? 1 : 0);
