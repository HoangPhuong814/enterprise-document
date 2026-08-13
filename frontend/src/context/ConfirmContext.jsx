import React, { createContext, useContext, useState } from 'react';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    cancelText: '',
    type: 'danger',
    onConfirm: () => {},
    onCancel: () => {}
  });

  const confirm = (options) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: options.title || 'Confirmation',
        message: options.message || 'Are you sure?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'danger',
        onConfirm: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setDialogState(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialogState.isOpen && (
        <div className="modal-overlay" style={{ animation: 'fade-in 0.2s ease-out' }}>
          <div className="modal-content" style={{ 
            maxWidth: '380px', 
            padding: '24px', 
            textAlign: 'center', 
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            animation: 'scale-up 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)', marginTop: 0 }}>
              {dialogState.title}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
              {dialogState.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary" 
                onClick={dialogState.onCancel} 
                style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              >
                {dialogState.cancelText}
              </button>
              <button 
                className={`btn ${dialogState.type === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
                onClick={dialogState.onConfirm} 
                style={{ 
                  flex: 1, 
                  justifyContent: 'center', 
                  padding: '10px',
                  backgroundColor: dialogState.type === 'danger' ? 'var(--danger)' : 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                {dialogState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => useContext(ConfirmContext);
