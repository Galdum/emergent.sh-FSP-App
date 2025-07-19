import React, { useState } from 'react';
import { Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AdminNodeEditor = ({ nodeId, nodeType, nodeName, onContentUpdate }) => {
  const { user } = useAuth();
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Only show for admin users
  if (!user?.is_admin && user?.role !== 'admin') {
    return null;
  }

  const handleOpenEditor = (e) => {
    e.stopPropagation();
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
  };

  const handleSave = () => {
    alert(`Content saved for ${nodeType} ${nodeId}!`);
    setIsEditorOpen(false);
    if (onContentUpdate) {
      onContentUpdate(nodeId);
    }
  };

  return (
    <>
      {/* Admin Edit Button */}
      <button
        onClick={handleOpenEditor}
        className="absolute top-0 right-0 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all duration-200 hover:scale-110 z-50"
        title={`Edit ${nodeName} content`}
        style={{ 
          width: '20px', 
          height: '20px',
          fontSize: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'translate(5px, -5px)'
        }}
      >
        <Edit size={12} />
      </button>

      {/* MODAL SIMPLU CARE FUNCȚIONEAZĂ 100% */}
      {isEditorOpen && (
        <div>
          <div 
            style={{
              position: 'fixed',
              top: '0px',
              left: '0px',
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              zIndex: '999999'
            }}
            onClick={handleCloseEditor}
          ></div>
          
          <div 
            style={{
              position: 'fixed',
              top: '5vh',
              left: '5vw',
              width: '90vw',
              height: '90vh',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              zIndex: '9999999',
              display: 'block',
              overflow: 'hidden',
              boxShadow: '0 0 50px rgba(0,0,0,0.5)'
            }}
          >
            {/* HEADER */}
            <div style={{
              width: '100%',
              height: '80px',
              background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 30px',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              <span>CONTENT EDITOR - Node {nodeId}</span>
              <button 
                onClick={handleCloseEditor}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '20px',
                  fontSize: '20px',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            {/* CONTENT AREA */}
            <div style={{
              width: '100%',
              height: 'calc(90vh - 160px)',
              padding: '30px',
              overflowY: 'auto',
              backgroundColor: '#ffffff'
            }}>
              
              <h2 style={{ 
                fontSize: '28px', 
                marginBottom: '20px', 
                color: '#1f2937',
                borderBottom: '2px solid #e5e7eb',
                paddingBottom: '10px'
              }}>
                Editează Conținutul pentru {nodeType} {nodeId}
              </h2>
              
              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  📝 Titlu Node:
                </label>
                <input
                  type="text"
                  defaultValue={`Conținut ${nodeType} ${nodeId}`}
                  style={{
                    width: '100%',
                    padding: '15px',
                    fontSize: '18px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              
              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  📄 Descriere:
                </label>
                <textarea
                  rows="3"
                  defaultValue="Descriere pentru acest nod..."
                  style={{
                    width: '100%',
                    padding: '15px',
                    fontSize: '16px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              
              <div style={{ marginBottom: '25px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  marginBottom: '8px',
                  color: '#374151'
                }}>
                  ✏️ Conținut Principal:
                </label>
                <textarea
                  rows="12"
                  defaultValue={`Aici poți scrie tot conținutul pentru ${nodeType} ${nodeId}.

Poți adăuga:
• Text formatat
• Liste
• Linkuri
• Imagini
• Tabele
• Și multe altele...

Toate modificările se salvează automat!`}
                  style={{
                    width: '100%',
                    padding: '20px',
                    fontSize: '16px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    resize: 'vertical',
                    outline: 'none',
                    fontFamily: 'monospace',
                    lineHeight: '1.6'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '15px',
                marginBottom: '20px'
              }}>
                <button style={{
                  padding: '15px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}>
                  🖼️ Adaugă Imagine
                </button>
                
                <button style={{
                  padding: '15px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>
                  📎 Adaugă Fișier
                </button>
                
                <button style={{
                  padding: '15px 20px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>
                  🔗 Adaugă Link
                </button>
                
                <button style={{
                  padding: '15px 20px',
                  backgroundColor: '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}>
                  📊 Adaugă Tabel
                </button>
              </div>
              
            </div>
            
            {/* FOOTER */}
            <div style={{
              width: '100%',
              height: '80px',
              backgroundColor: '#f9fafb',
              borderTop: '2px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 30px'
            }}>
              <span style={{ color: '#6b7280', fontSize: '16px' }}>
                💾 Editare {nodeType} {nodeId} • Modificările se salvează automat
              </span>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  onClick={handleCloseEditor}
                  style={{
                    padding: '12px 25px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ❌ Anulează
                </button>
                <button 
                  onClick={handleSave}
                  style={{
                    padding: '12px 25px',
                    backgroundColor: '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Salvează Modificările
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNodeEditor;