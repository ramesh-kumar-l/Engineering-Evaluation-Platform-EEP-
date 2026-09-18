import { describe, expect, it } from 'vitest';
import { htmlEscape } from './htmlEscape.js';

describe('htmlEscape', () => {
  it('escapes all five reserved HTML characters', () => {
    expect(htmlEscape(`<script>alert('x') & "y"</script>`)).toBe(
      '&lt;script&gt;alert(&#39;x&#39;) &amp; &quot;y&quot;&lt;/script&gt;',
    );
  });

  it('leaves plain text unchanged', () => {
    expect(htmlEscape('task-success passed at 0.92')).toBe('task-success passed at 0.92');
  });
});
