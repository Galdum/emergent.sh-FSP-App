import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const usePersonalFiles = () => {
  const { isAuthenticated } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileObjects, setFileObjects] = useState({});

  // Load files when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      loadFilesFromAPI();
    } else {
      loadFilesFromLocalStorage();
    }
  }, [isAuthenticated]);

  const loadFilesFromAPI = async () => {
    setLoading(true);
    try {
      const filesData = await api.getFiles();
      setFiles(filesData);
    } catch (error) {
      console.error('Failed to load files from API:', error);
      // Fallback to localStorage
      loadFilesFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFilesFromLocalStorage = () => {
    try {
      const savedFiles = localStorage.getItem('personalFileItems');
      if (savedFiles) {
        setFiles(JSON.parse(savedFiles));
      }
    } catch (error) {
      console.error('Failed to load files from localStorage:', error);
    }
  };

  const addFile = async (fileData) => {
    try {
      if (isAuthenticated) {
        // Create via API
        const newFile = await api.createFile(fileData);
        setFiles(prev => [newFile, ...prev]);
      } else {
        // Add to localStorage
        const newFile = {
          id: Date.now(),
          ...fileData,
          created_at: new Date().toISOString()
        };
        const updatedFiles = [newFile, ...files];
        setFiles(updatedFiles);
        localStorage.setItem('personalFileItems', JSON.stringify(updatedFiles));
      }
    } catch (error) {
      console.error('Failed to add file:', error);
      throw error;
    }
  };

  const uploadFile = async (file) => {
    try {
      if (isAuthenticated) {
        // Upload via API
        const newFile = await api.uploadFile(file);
        setFiles(prev => [newFile, ...prev]);
        return newFile;
      } else {
        // Store in local state for unauthenticated users
        const id = Date.now();
        const newFile = {
          id,
          type: 'file',
          title: file.name,
          file_size: file.size,
          created_at: new Date().toISOString()
        };
        
        const updatedFiles = [newFile, ...files];
        setFiles(updatedFiles);
        setFileObjects(prev => ({ ...prev, [id]: file }));
        localStorage.setItem('personalFileItems', JSON.stringify(updatedFiles));
        
        return newFile;
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  };

  const updateFile = async (fileId, fileData) => {
    try {
      if (isAuthenticated) {
        // Update via API
        const updatedFile = await api.updateFile(fileId, fileData);
        setFiles(prev => prev.map(f => f.id === fileId ? updatedFile : f));
      } else {
        // Update localStorage
        const updatedFiles = files.map(f => 
          f.id === fileId ? { ...f, ...fileData } : f
        );
        setFiles(updatedFiles);
        localStorage.setItem('personalFileItems', JSON.stringify(updatedFiles));
      }
    } catch (error) {
      console.error('Failed to update file:', error);
      throw error;
    }
  };

  const deleteFile = async (fileId) => {
    try {
      if (isAuthenticated) {
        // Delete via API
        await api.deleteFile(fileId);
        setFiles(prev => prev.filter(f => f.id !== fileId));
      } else {
        // Remove from localStorage
        const updatedFiles = files.filter(f => f.id !== fileId);
        setFiles(updatedFiles);
        setFileObjects(prev => {
          const newFileObjects = { ...prev };
          delete newFileObjects[fileId];
          return newFileObjects;
        });
        localStorage.setItem('personalFileItems', JSON.stringify(updatedFiles));
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  };

  const handleFileClick = (file) => {
    if (file.type === 'file') {
      if (isAuthenticated && file.file_path) {
        // For API files, we might need to implement a download endpoint
        // For now, show a message
        alert('File viewing for authenticated users will be implemented soon');
      } else {
        // For localStorage files
        const fileObject = fileObjects[file.id];
        if (fileObject) {
          const url = URL.createObjectURL(fileObject);
          window.open(url, '_blank');
        } else {
          alert('File not available for viewing. Please re-upload.');
        }
      }
    }
  };

  return {
    files,
    loading,
    fileObjects,
    addFile,
    uploadFile,
    updateFile,
    deleteFile,
    handleFileClick,
    refreshFiles: isAuthenticated ? loadFilesFromAPI : loadFilesFromLocalStorage
  };
};