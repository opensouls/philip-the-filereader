import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const CodeBlock: React.FC<{ lang: string, children: string, highlightStart?: number, highlightEnd?: number }> = ({ children, lang, highlightStart, highlightEnd }) => {
  const lineProps = (lineNumber: number) => {
    if (highlightStart && highlightEnd) {
      if (lineNumber >= highlightStart && lineNumber <= highlightEnd) {
        return { style: { backgroundColor: '#ffebcd' } }; // Light beige background
      }
    }
    return {};
  }

  return (
    <SyntaxHighlighter
      language={lang}
      style={dracula}
      showLineNumbers
      wrapLines
      lineProps={lineProps}
    >
      {children}
    </SyntaxHighlighter>
  );
};
export default CodeBlock;
