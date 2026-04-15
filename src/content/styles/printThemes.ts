const basePrintStyle = `
  @media screen { #omni-print-container { display: none !important; } }
  
  @media print {
    @page {
      margin-top: 25mm;    
      margin-bottom: 20mm; 
      margin-left: 20mm;  
      margin-right: 20mm; 
    }

    @page :first {
      margin-top: 15mm;
    }
    /* ========================================================== */

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body > *:not(#omni-print-container) { display: none !important; }
    html, body { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; }
    
    #omni-print-container { 
      display: block !important; 
      padding: 0 !important; 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; 
      line-height: 1.6; 
    }
    
    p, li, h3 { orphans: 3; widows: 3; break-inside: avoid; page-break-inside: avoid; }
    h3 { break-after: avoid; page-break-after: avoid; }
    pre { white-space: pre-wrap !important; word-wrap: break-word !important; page-break-inside: auto !important; break-inside: auto !important; orphans: 3; widows: 3; }
    code { font-family: "Cascadia Code", Consolas, monospace !important; }

    .msg-row { margin-bottom: 35px; width: 100%; clear: both; overflow: hidden; page-break-inside: auto; }
    .msg-content { break-inside: auto; page-break-inside: auto; }
    .msg-content p:last-child { margin-bottom: 0 !important; }
    .msg-content > *:first-child { margin-top: 0 !important; }

    .user-bubble {
      background-color: #f8f9fa !important; 
      padding: 16px 20px !important;
      border-radius: 12px !important;
      float: right; 
      width: 85% !important; 
      box-sizing: border-box !important;
      border: 1px solid #f1f5f9 !important;
    }
    
    .user-bubble .msg-label {
      font-size: 12px;
      font-weight: bold;
      color: #9ca3af !important;
      margin-bottom: 10px;
      text-transform: uppercase;
      text-align: right;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
    }

    .ai-bubble {
      float: left;
      width: 100% !important;
      padding: 0 !important;
    }

    .print-header { 
      border-bottom: 2px solid #e5e7eb !important; 
      margin-bottom: 30px !important; 
      padding-bottom: 15px !important; 
    }
    
    .header-title { 
      display: flex !important; 
      justify-content: space-between !important; 
      align-items: flex-end !important; 
      margin-bottom: 10px !important; 
    }
    
    .header-title h1 { 
      color: #1f2937 !important; 
      margin: 0 !important; 
      font-size: 24px !important; 
      font-weight: 800 !important;
    }
    
    .header-badge { 
      font-size: 12px !important; 
      color: #10b981 !important; 
      font-weight: bold !important; 
      background-color: #ecfdf5 !important; 
      padding: 4px 10px !important; 
      border-radius: 12px !important; 
    }
    
    .print-header p { 
      font-size: 12px !important; 
      color: #9ca3af !important; 
      margin: 0 !important; 
    }
  }
`;

export const geekTheme = `
  ${basePrintStyle}
  @media print {
    h3 { color: #10b981 !important; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; }
    
    pre { background: #0d1117 !important; color: #c9d1d9 !important; padding: 15px; border-radius: 8px; font-size: 13px; margin: 20px 0 !important; border: 1px solid #30363d !important; }
    p code, li code { background: #f3f4f6 !important; color: #ef4444 !important; padding: 2px 5px; border-radius: 4px; }
    hr { border: 0; border-top: 1px solid #eee; margin: 30px 0; }

    .hljs-keyword, .hljs-built_in, .hljs-type, .hljs-name, .hljs-selector-tag { color: #ff7b72 !important; }
    .hljs-string, .hljs-title, .hljs-section, .hljs-attribute, .hljs-literal, .hljs-template-tag, .hljs-template-variable { color: #a5d6ff !important; }
    .hljs-comment, .hljs-quote, .hljs-meta { color: #8b949e !important; font-style: italic !important; }
    .hljs-variable, .hljs-template-variable { color: #79c0ff !important; }
    .hljs-number, .hljs-regexp, .hljs-link { color: #79c0ff !important; }
    .hljs-symbol, .hljs-bullet, .hljs-subst { color: #c9d1d9 !important; }
    .hljs-doctag, .hljs-formula { color: #d2a8ff !important; }
    .hljs-addition { color: #3fb950 !important; background-color: rgba(63, 185, 80, 0.3) !important; }
    .hljs-deletion { color: #ff7b72 !important; background-color: rgba(255, 123, 114, 0.3) !important; }
  }
`;

export const pureMinimalTheme = `
  .html2pdf-container {
    padding: 20px 30px; 
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: #1f2937;
    line-height: 1.6;
    background: #ffffff;
  }

  .html2pdf-container .role-label {
    font-size: 13px;
    font-weight: 800;
    color: #9ca3af;
    text-transform: uppercase;
    margin-top: 30px;
    margin-bottom: 10px;
    border-bottom: 2px solid #f3f4f6;
    padding-bottom: 5px;
    page-break-after: avoid !important;
  }
  .html2pdf-container .role-label.ai { color: #10b981; }

  .html2pdf-container p, 
  .html2pdf-container li {
    margin-bottom: 12px;
    page-break-inside: avoid !important; 
  }
  .html2pdf-container h3 { color: #10b981; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; page-break-after: avoid !important; }

  .html2pdf-container pre {
    background: #0d1117;
    color: #c9d1d9;
    padding: 15px;
    border-radius: 8px;
    font-size: 13px;
    margin: 15px 0;
    white-space: pre-wrap;
    word-wrap: break-word;
    border: 1px solid #30363d;
    
    display: inline-block !important; 
    width: 100% !important;
    box-sizing: border-box !important;
    page-break-inside: avoid !important;
    break-inside: avoid !important;
  }
  
  .html2pdf-container code { font-family: "Cascadia Code", Consolas, monospace; }
  .html2pdf-container p code, .html2pdf-container li code { background: #f3f4f6; color: #ef4444; padding: 2px 4px; border-radius: 4px; }
  
  .hljs-keyword, .hljs-built_in, .hljs-type, .hljs-name, .hljs-selector-tag { color: #ff7b72; }
  .hljs-string, .hljs-title, .hljs-section, .hljs-attribute, .hljs-literal, .hljs-template-tag, .hljs-template-variable { color: #a5d6ff; }
  .hljs-comment, .hljs-quote, .hljs-meta { color: #8b949e; font-style: italic; }
  .hljs-variable, .hljs-template-variable { color: #79c0ff; }
  .hljs-number, .hljs-regexp, .hljs-link { color: #79c0ff; }
  .hljs-symbol, .hljs-bullet, .hljs-subst { color: #c9d1d9; }
  .hljs-doctag, .hljs-formula { color: #d2a8ff; }
  .hljs-addition { color: #3fb950; background-color: rgba(63, 185, 80, 0.3); }
  .hljs-deletion { color: #ff7b72; background-color: rgba(255, 123, 114, 0.3); }
`;