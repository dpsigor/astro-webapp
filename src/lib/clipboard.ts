/**
 * Copies the given table to the clipboard as Markdown (text/plain) plus an
 * HTML table (text/html), so rich editors paste a real table while plain-text
 * editors get Markdown.
 */
export async function copyTable(headers: string[], rows: string[][]) {
  const markdown = toMarkdownTable(headers, rows);
  if (!navigator.clipboard) {
    throw new Error(
      'Clipboard API unavailable (requires a secure context: HTTPS or localhost)',
    );
  }
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
    try {
      const html = toHtmlTable(headers, rows);
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([markdown], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' }),
        }),
      ]);
      return;
    } catch {
      // Some browsers reject multi-type items; fall back to plain text.
    }
  }
  await navigator.clipboard.writeText(markdown);
}

function escapeMarkdownCell(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function toMarkdownTable(headers: string[], rows: string[][]): string {
  const line = (cells: string[]) =>
    `| ${cells.map(escapeMarkdownCell).join(' | ')} |`;
  return [
    line(headers),
    line(headers.map(() => '---')),
    ...rows.map(line),
  ].join('\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toHtmlTable(headers: string[], rows: string[][]): string {
  const head = headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const body = rows
    .map(
      (r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`,
    )
    .join('');
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
