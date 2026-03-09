import {
  createSanitizedMarkup,
  encodeHtmlEntities,
  renderSafeTemplate,
  sanitizeHtml,
} from '../utils/htmlSecurity';

describe('htmlSecurity utilities', () => {
  test.each([
    ['<tag>', '&lt;tag&gt;'],
    ['5 > 3', '5 &gt; 3'],
    ['AT&T', 'AT&amp;T'],
    ['"quoted"', '&quot;quoted&quot;'],
    ["it's", 'it&#39;s'],
  ])('encodeHtmlEntities(%s) -> %s', (input, expected) => {
    expect(encodeHtmlEntities(input)).toBe(expected);
  });

  test('encodeHtmlEntities normalizes nullish/number inputs', () => {
    expect(encodeHtmlEntities(null)).toBe('');
    expect(encodeHtmlEntities(undefined)).toBe('');
    expect(encodeHtmlEntities(42)).toBe('42');
  });

  test.each([
    '<script>alert(1)</script><b>safe</b>',
    '<img src=x onerror=alert(1)>',
    '<a href="javascript:alert(1)">x</a>',
  ])('sanitizeHtml strips dangerous content: %s', (payload) => {
    const result = sanitizeHtml(payload);
    expect(result.toLowerCase()).not.toContain('<script');
    expect(result.toLowerCase()).not.toContain('onerror');
    expect(result.toLowerCase()).not.toContain('javascript:');
  });

  test('sanitizeHtml keeps safe markup', () => {
    const result = sanitizeHtml('<p><strong>safe</strong> content</p>');
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>safe</strong>');
  });

  test('createSanitizedMarkup returns __html payload', () => {
    const result = createSanitizedMarkup('<b>safe</b>');
    expect(result).toHaveProperty('__html');
    expect(result.__html).toContain('<b>safe</b>');
  });

  test('renderSafeTemplate injects escaped variables', () => {
    const rendered = renderSafeTemplate('Hello {{ user.name }}', {
      user: { name: '<Admin>' },
    });
    expect(rendered).toBe('Hello &lt;Admin&gt;');
  });

  test('renderSafeTemplate handles deep nested fields', () => {
    const rendered = renderSafeTemplate('{{org.owner.username}} / {{org.id}}', {
      org: {
        owner: { username: 'tenant_admin' },
        id: 7,
      },
    });
    expect(rendered).toBe('tenant_admin / 7');
  });

  test.each([
    ['{{missing}}', {}],
    ['{{a.b.c}}', { a: {} }],
    ['prefix {{unknown.value}} suffix', { known: true }],
  ])('renderSafeTemplate resolves missing token to empty string (%s)', (template, context) => {
    const rendered = renderSafeTemplate(template, context as Record<string, unknown>);
    expect(rendered).not.toContain('{{');
    expect(rendered).not.toContain('undefined');
  });

  test('renderSafeTemplate returns empty string for non-string template', () => {
    expect(renderSafeTemplate((null as unknown) as string, { a: 1 })).toBe('');
  });

  test.each([
    ['{{name}}', { name: 'Alice & Bob' }, 'Alice &amp; Bob'],
    ['{{value}}', { value: 'x<y' }, 'x&lt;y'],
    ['{{quote}}', { quote: '"x"' }, '&quot;x&quot;'],
    ['{{apostrophe}}', { apostrophe: "can't" }, 'can&#39;t'],
  ])('renderSafeTemplate encodes HTML entities in context values', (template, context, expected) => {
    expect(renderSafeTemplate(template, context as Record<string, unknown>)).toBe(expected);
  });
});
