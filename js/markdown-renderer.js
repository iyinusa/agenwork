/**
 * Professional Markdown Renderer for AgenWork
 * Converts markdown text to properly formatted HTML following global markdown standards
 */

class MarkdownRenderer {
  constructor() {
    // Initialize renderer with global markdown standards
    this.patterns = {
      // Headers (H1-H6)
      headers: /^(#{1,6})\s+(.*$)/gim,
      
      // Bold text (**text** or __text__)
      bold: /(\*\*|__)(.*?)\1/g,
      
      // Italic text (*text* or _text_)
      italic: /(\*|_)(.*?)\1/g,
      
      // Strikethrough (~~text~~)
      strikethrough: /~~(.*?)~~/g,
      
      // Inline code (`code`)
      inlineCode: /`([^`]+)`/g,
      
      // Code blocks (```language\ncode\n```)
      codeBlocks: /```(\w+)?\n([\s\S]*?)\n```/g,
      
      // Simple code blocks (without language)
      simpleCodeBlocks: /```\n([\s\S]*?)\n```/g,
      
      // Links [text](url)
      links: /\[([^\]]+)\]\(([^)]+)\)/g,
      
      // Images ![alt](src)
      images: /!\[([^\]]*)\]\(([^)]+)\)/g,
      
      // Unordered lists (- or * or +)
      unorderedLists: /^[\s]*[-\*\+]\s+(.*)$/gm,
      
      // Ordered lists (1. 2. etc.)
      orderedLists: /^[\s]*(\d+\.)\s+(.*)$/gm,
      
      // Blockquotes (> text)
      blockquotes: /^>\s+(.*)$/gm,
      
      // Horizontal rules (--- or ***)
      horizontalRules: /^[\s]*(-{3,}|\*{3,})[\s]*$/gm,
      
      // Line breaks (double space + newline or double newline)
      lineBreaks: /  \n|\n\n/g,
      
      // Tables
      tables: /\|(.+)\|\n\|([-\s\|:]+)\|\n((\|.*\|\n?)*)/g
    };
  }

  /**
   * Main render function - converts markdown to HTML
   * @param {string} markdown - The markdown text to convert
   * @returns {string} - The rendered HTML
   */
  render(markdown) {
    if (!markdown || typeof markdown !== 'string') {
      return '';
    }

    let html = markdown;

    // Process in order of complexity to avoid conflicts
    html = this.renderCodeBlocks(html);
    html = this.renderHeaders(html);
    html = this.renderTables(html);
    html = this.renderBlockquotes(html);
    html = this.renderLists(html);
    html = this.renderHorizontalRules(html);
    html = this.renderLinks(html);
    html = this.renderImages(html);
    html = this.renderInlineFormatting(html);
    html = this.renderLineBreaks(html);

    return html.trim();
  }

  /**
   * Render headers (H1-H6)
   */
  renderHeaders(text) {
    return text.replace(this.patterns.headers, (match, hashes, content) => {
      const level = hashes.length;
      const className = `markdown-h${level}`;
      return `<h${level} class="${className}">${content.trim()}</h${level}>`;
    });
  }

  /**
   * Render code blocks with syntax highlighting classes
   */
  renderCodeBlocks(text) {
    // Handle language-specific code blocks
    text = text.replace(this.patterns.codeBlocks, (match, language, code) => {
      const lang = language || 'text';
      return `<div class="markdown-code-block">
        <div class="code-header">
          <span class="code-language">${lang}</span>
          <button class="code-copy-btn" onclick="copyCodeToClipboard(this)" title="Copy code">
            <i class="fas fa-copy"></i>
          </button>
        </div>
        <pre><code class="language-${lang}">${this.escapeHtml(code.trim())}</code></pre>
      </div>`;
    });

    // Handle simple code blocks without language
    text = text.replace(this.patterns.simpleCodeBlocks, (match, code) => {
      return `<div class="markdown-code-block">
        <pre><code>${this.escapeHtml(code.trim())}</code></pre>
      </div>`;
    });

    return text;
  }

  /**
   * Render inline formatting (bold, italic, strikethrough, inline code)
   */
  renderInlineFormatting(text) {
    // Bold text
    text = text.replace(this.patterns.bold, '<strong class="markdown-bold">$2</strong>');
    
    // Italic text (avoid conflicts with bold)
    text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em class="markdown-italic">$1</em>');
    text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em class="markdown-italic">$1</em>');
    
    // Strikethrough
    text = text.replace(this.patterns.strikethrough, '<del class="markdown-strikethrough">$1</del>');
    
    // Inline code
    text = text.replace(this.patterns.inlineCode, '<code class="markdown-inline-code">$1</code>');

    return text;
  }

  /**
   * Render links
   */
  renderLinks(text) {
    return text.replace(this.patterns.links, (match, linkText, url) => {
      // Add security attributes for external links
      const isExternal = !url.startsWith('#') && !url.startsWith('/');
      const securityAttrs = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${url}" class="markdown-link" ${securityAttrs}>${linkText}</a>`;
    });
  }

  /**
   * Render images
   */
  renderImages(text) {
    return text.replace(this.patterns.images, (match, alt, src) => {
      return `<img src="${src}" alt="${alt}" class="markdown-image" loading="lazy">`;
    });
  }

  /**
   * Render lists (both ordered and unordered)
   */
  renderLists(text) {
    const lines = text.split('\n');
    const result = [];
    let currentList = null;
    let listType = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const unorderedMatch = line.match(/^[\s]*[-\*\+]\s+(.*)$/);
      const orderedMatch = line.match(/^[\s]*(\d+\.)\s+(.*)$/);

      if (unorderedMatch) {
        if (listType !== 'ul') {
          if (currentList) result.push(`</${listType}>`);
          result.push('<ul class="markdown-list markdown-ul">');
          listType = 'ul';
          currentList = true;
        }
        result.push(`<li class="markdown-list-item">${unorderedMatch[1]}</li>`);
      } else if (orderedMatch) {
        if (listType !== 'ol') {
          if (currentList) result.push(`</${listType}>`);
          result.push('<ol class="markdown-list markdown-ol">');
          listType = 'ol';
          currentList = true;
        }
        result.push(`<li class="markdown-list-item">${orderedMatch[2]}</li>`);
      } else {
        if (currentList) {
          result.push(`</${listType}>`);
          currentList = null;
          listType = null;
        }
        result.push(line);
      }
    }

    if (currentList) {
      result.push(`</${listType}>`);
    }

    return result.join('\n');
  }

  /**
   * Render blockquotes
   */
  renderBlockquotes(text) {
    const lines = text.split('\n');
    const result = [];
    let inBlockquote = false;

    for (const line of lines) {
      const match = line.match(/^>\s+(.*)$/);
      if (match) {
        if (!inBlockquote) {
          result.push('<blockquote class="markdown-blockquote">');
          inBlockquote = true;
        }
        result.push(`<p class="markdown-blockquote-p">${match[1]}</p>`);
      } else {
        if (inBlockquote) {
          result.push('</blockquote>');
          inBlockquote = false;
        }
        result.push(line);
      }
    }

    if (inBlockquote) {
      result.push('</blockquote>');
    }

    return result.join('\n');
  }

  /**
   * Render horizontal rules
   */
  renderHorizontalRules(text) {
    return text.replace(this.patterns.horizontalRules, '<hr class="markdown-hr">');
  }

  /**
   * Render tables
   */
  renderTables(text) {
    return text.replace(this.patterns.tables, (match, header, separator, rows) => {
      const headerCells = header.split('|').map(cell => cell.trim()).filter(cell => cell);
      const rowLines = rows.trim().split('\n').filter(line => line.trim());
      
      let tableHtml = '<table class="markdown-table"><thead><tr>';
      headerCells.forEach(cell => {
        tableHtml += `<th class="markdown-th">${cell}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';
      
      rowLines.forEach(rowLine => {
        const cells = rowLine.split('|').map(cell => cell.trim()).filter(cell => cell);
        tableHtml += '<tr class="markdown-tr">';
        cells.forEach(cell => {
          tableHtml += `<td class="markdown-td">${cell}</td>`;
        });
        tableHtml += '</tr>';
      });
      
      tableHtml += '</tbody></table>';
      return tableHtml;
    });
  }

  /**
   * Render line breaks and paragraphs
   */
  renderLineBreaks(text) {
    // Split by double newlines to create paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    
    return paragraphs.map(paragraph => {
      const trimmed = paragraph.trim();
      if (!trimmed) return '';
      
      // Don't wrap already formatted elements in paragraphs
      if (this.isAlreadyFormatted(trimmed)) {
        return trimmed;
      }
      
      return `<p class="markdown-p">${trimmed.replace(/\n/g, '<br>')}</p>`;
    }).filter(p => p).join('\n\n');
  }

  /**
   * Check if text is already formatted (contains HTML tags)
   */
  isAlreadyFormatted(text) {
    const htmlTags = /<(h[1-6]|ul|ol|blockquote|table|div|pre|hr)/i;
    return htmlTags.test(text);
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Static method for quick rendering
   */
  static render(markdown) {
    const renderer = new MarkdownRenderer();
    return renderer.render(markdown);
  }
}

// Copy code to clipboard function
function copyCodeToClipboard(button) {
  try {
    const codeBlock = button.closest('.markdown-code-block');
    const codeElement = codeBlock.querySelector('code');
    
    if (codeElement) {
      // Use the modern clipboard API if available
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(codeElement.textContent).then(() => {
          showCopyFeedback(button, 'Copied!');
        }).catch(() => {
          fallbackCopyToClipboard(codeElement.textContent, button);
        });
      } else {
        fallbackCopyToClipboard(codeElement.textContent, button);
      }
    }
  } catch (error) {
    console.warn('Failed to copy code:', error);
    showCopyFeedback(button, 'Failed');
  }
}

// Fallback copy method for older browsers
function fallbackCopyToClipboard(text, button) {
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    showCopyFeedback(button, 'Copied!');
  } catch (error) {
    showCopyFeedback(button, 'Failed');
  }
}

// Show copy feedback
function showCopyFeedback(button, message) {
  const originalText = button.innerHTML;
  button.innerHTML = `<i class="fas fa-check"></i> ${message}`;
  button.style.color = '#28a745';
  
  setTimeout(() => {
    button.innerHTML = originalText;
    button.style.color = '';
  }, 2000);
}

// Make it available globally
window.MarkdownRenderer = MarkdownRenderer;
window.copyCodeToClipboard = copyCodeToClipboard;