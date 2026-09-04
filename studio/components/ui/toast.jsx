import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { X } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";

export const Toaster = forwardRef(function Toaster({ className }, ref) {
  const [message, setMessage] = useState(null);
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    show(nextMessage) {
      setMessage(nextMessage);
      setOpen(true);
    },
    clear() {
      setOpen(false);
    },
  }), []);

  useEffect(() => {
    if (!open || !message?.life) return undefined;
    const timer = window.setTimeout(() => setOpen(false), message.life);
    return () => window.clearTimeout(timer);
  }, [message, open]);

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      <ToastPrimitive.Root
        className={cn("ui-toast", className)}
        duration={message?.life ?? 5000}
        open={open}
        onOpenChange={setOpen}
      >
        {message?.summary ? <ToastPrimitive.Title className="ui-toast__title">{message.summary}</ToastPrimitive.Title> : null}
        {message?.detail ? <ToastPrimitive.Description className="ui-toast__description">{message.detail}</ToastPrimitive.Description> : null}
        <ToastPrimitive.Close className="ui-toast__close" aria-label="Dismiss notification"><X size={14} /></ToastPrimitive.Close>
      </ToastPrimitive.Root>
      <ToastPrimitive.Viewport className="ui-toast-viewport" />
    </ToastPrimitive.Provider>
  );
});
