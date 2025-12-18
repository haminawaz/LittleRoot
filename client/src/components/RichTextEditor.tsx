import { useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  maxLength = 120,
  placeholder = "Enter text...",
  className = "",
}: RichTextEditorProps) {
  const quillRef = useRef<any>(null);
  const [charCount, setCharCount] = useState(0);

  const getTextLength = (html: string): number => {
    if (!html || html === "<p><br></p>" || html === "<p></p>") return 0;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || "";
    return text.trim().length;
  };

  useEffect(() => {
    setCharCount(getTextLength(value));
  }, [value]);

  const handleChange = (
    content: string,
    delta: any,
    source: string,
    editor: any
  ) => {
    const text = editor.getText().trim();
    const textLength = text.length;

    if (textLength > maxLength) {
      const quill = quillRef.current?.getEditor();
      if (quill && source === "user") {
        const previousContent = value || "";
        quill.clipboard.dangerouslyPasteHTML(previousContent);
        setTimeout(() => {
          const length = quill.getLength();
          quill.setSelection(length - 1);
        }, 0);
      }
      return;
    }

    setCharCount(textLength);
    onChange(content);
  };

  const modules = {
    toolbar: {
      container: [["bold", "italic", "underline"]],
    },
    clipboard: {
      matchVisual: false,
    },
  };

  const formats = ["bold", "italic", "underline"];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="rich-text-editor-wrapper">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          style={{
            backgroundColor: "hsl(var(--background))",
          }}
        />
      </div>
      <div className="flex justify-end items-center text-xs text-muted-foreground">
        <span
          className={charCount > maxLength ? "text-red-600 font-medium" : ""}
        >
          {charCount}/{maxLength} characters
        </span>
      </div>
    </div>
  );
}
