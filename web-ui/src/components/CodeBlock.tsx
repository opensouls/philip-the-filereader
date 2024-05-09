import React from 'react';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const CodeBlock: React.FC<{ lang: string, children: string, startingLine: number, highlightStart?: number, highlightEnd?: number }> = ({ children, lang, highlightStart, highlightEnd, startingLine }) => {
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
      style={darcula}
      customStyle={{
        backgroundColor: 'rgb(0,0,0)',
      }}
      showLineNumbers
      wrapLines
      lineProps={lineProps}
      startingLineNumber={startingLine}
    >
      {children}
    </SyntaxHighlighter>
  );
};
export default CodeBlock;
