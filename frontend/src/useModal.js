import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Open dialogs, topmost last. Only the topmost one handles Escape/Tab, and page
// scroll stays locked until the last one closes (e.g. palette over a case study).
const stack = [];

function onKeyDown(event) {
  const top = stack[stack.length - 1];
  if (!top) return;
  if (event.key === "Escape") {
    event.preventDefault();
    top.close();
    return;
  }
  const dialog = top.dialogRef.current;
  if (event.key !== "Tab" || !dialog) return;
  const items = [...dialog.querySelectorAll(FOCUSABLE)];
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  const inside = dialog.contains(document.activeElement);
  if (event.shiftKey && (document.activeElement === first || !inside)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !inside)) {
    event.preventDefault();
    first.focus();
  }
}

// Modal behaviour while `active`: scroll lock, Escape to close, initial focus,
// Tab kept inside the dialog, and focus returned to the opener on close.
export function useModal(dialogRef, onClose, { active = true, initialFocusRef } = {}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!active) return undefined;
    const opener = document.activeElement;
    const entry = { dialogRef, close: () => closeRef.current() };
    if (!stack.length) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onKeyDown);
    }
    stack.push(entry);
    (initialFocusRef?.current ?? dialogRef.current?.querySelector(FOCUSABLE))?.focus();
    return () => {
      stack.splice(stack.indexOf(entry), 1);
      if (!stack.length) {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", onKeyDown);
      }
      // preventScroll: a palette command may have just navigated elsewhere.
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [active, dialogRef, initialFocusRef]);
}
