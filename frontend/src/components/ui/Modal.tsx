import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-root">
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal Content */}
      <div className="modal-card" role="dialog" aria-modal="true">
        <div className="modal-header">
          {title ? <h3 className="modal-title">{title}</h3> : <div />}
          <button
            type="button"
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">{children}</div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .modal-root {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .modal-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: modal-fade-in 0.2s ease;
        }
        .modal-card {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          width: 100%;
          max-width: 480px;
          max-height: min(90dvh, 600px);
          display: flex;
          flex-direction: column;
          z-index: 10;
          animation: modal-pop-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }
        @keyframes modal-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modal-pop-in {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
        }
        .modal-title {
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
          font-family: var(--font-heading);
        }
        .modal-close-btn {
          background: var(--surface-hover);
          border: 1px solid var(--border);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-muted);
          font-size: 14px;
          transition: background 0.15s, color 0.15s;
        }
        .modal-close-btn:hover {
          background: var(--border);
          color: var(--text-primary);
        }
        .modal-body {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
          color: var(--text-primary);
          font-size: 14px;
          line-height: 1.5;
        }
        @media (max-width: 480px) {
          .modal-card {
            max-width: 100%;
            border-radius: var(--radius-md);
          }
          .modal-header {
            padding: 14px 16px;
          }
          .modal-body {
            padding: 16px;
          }
        }
      `}} />
    </div>
  );
}
