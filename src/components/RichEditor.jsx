import { useEffect, useRef } from 'react';

// A small WordPress-classic-editor-style toolbar on top of a contentEditable
// area. Produces real HTML (headings, bold/italic, lists, links, images)
// which is what gets saved and rendered back on the article page.
export default function RichEditor({ value, onChange, onUploadImage, placeholder }) {
  const ref = useRef(null);
  const loadedValueRef = useRef(null);

  // only push `value` into the DOM when it changes from *outside* (e.g. the
  // form loading an existing article) — never on every keystroke, or the
  // caret would jump to the start on each render.
  useEffect(() => {
    if (ref.current && loadedValueRef.current !== value) {
      ref.current.innerHTML = value || '';
      loadedValueRef.current = value || '';
    }
  }, [value]);

  const emitChange = () => {
    const html = ref.current?.innerHTML || '';
    loadedValueRef.current = html;
    onChange(html);
  };

  const exec = (cmd, arg) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emitChange();
  };

  const handleLink = () => {
    const url = window.prompt('آدرس لینک را وارد کن (مثلاً https://... یا /shop):', 'https://');
    if (url) exec('createLink', url);
  };

  const handleImage = () => {
    if (!onUploadImage) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const url = await onUploadImage(file);
        exec('insertImage', url);
      } catch (err) {
        window.alert(err.message || 'آپلود تصویر با مشکل مواجه شد.');
      }
    };
    input.click();
  };

  const btn = (label, title, onClick) => (
    <button type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {label}
    </button>
  );

  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        {btn(<b>B</b>, 'پررنگ', () => exec('bold'))}
        {btn(<i>I</i>, 'مورب', () => exec('italic'))}
        {btn('U', 'زیرخط', () => exec('underline'))}
        <span className="rich-sep" />
        {btn('H2', 'تیتر بزرگ', () => exec('formatBlock', '<h2>'))}
        {btn('H3', 'تیتر کوچک', () => exec('formatBlock', '<h3>'))}
        {btn('¶', 'پاراگراف ساده', () => exec('formatBlock', '<p>'))}
        {btn('❝', 'نقل‌قول', () => exec('formatBlock', '<blockquote>'))}
        <span className="rich-sep" />
        {btn('• —', 'لیست نقطه‌ای', () => exec('insertUnorderedList'))}
        {btn('۱ —', 'لیست شماره‌دار', () => exec('insertOrderedList'))}
        <span className="rich-sep" />
        {btn('🔗', 'افزودن لینک', handleLink)}
        {btn('🔗✕', 'حذف لینک', () => exec('unlink'))}
        {btn('🖼', 'افزودن تصویر', handleImage)}
        <span className="rich-sep" />
        {btn('↺', 'واگرد', () => exec('undo'))}
        {btn('↻', 'ازنو', () => exec('redo'))}
      </div>
      <div
        ref={ref}
        className="rich-editable"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emitChange}
        onBlur={emitChange}
      />
    </div>
  );
}
