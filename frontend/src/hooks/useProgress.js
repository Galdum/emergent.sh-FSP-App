import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const useProgress = () => {
  const { isAuthenticated } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize progress from localStorage or API
  useEffect(() => {
    if (isAuthenticated) {
      loadProgressFromAPI();
    } else {
      loadProgressFromLocalStorage();
    }
  }, [isAuthenticated]);

  const loadProgressFromAPI = async () => {
    setLoading(true);
    try {
      const progressData = await api.getProgress();
      setProgress(progressData);
    } catch (error) {
      console.error('Failed to load progress from API:', error);
      // Fallback to localStorage
      loadProgressFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadProgressFromLocalStorage = () => {
    try {
      const savedProgress = localStorage.getItem('userProgress');
      if (savedProgress) {
        setProgress(JSON.parse(savedProgress));
      } else {
        // Initialize default progress
        const defaultProgress = {
          steps: Array.from({ length: 6 }, (_, i) => ({
            step_id: i + 1,
            tasks: [],
            unlocked: i === 0
          })),
          current_step: 1
        };
        setProgress(defaultProgress);
      }
    } catch (error) {
      console.error('Failed to load progress from localStorage:', error);
    }
  };

  const updateTaskProgress = async (stepId, taskId, completed, viewed = true) => {
    try {
      if (isAuthenticated) {
        // Update via API
        await api.updateProgress(stepId, taskId, completed, viewed);
        // Reload progress from API to get updated state
        await loadProgressFromAPI();
      } else {
        // Update localStorage
        const updatedProgress = { ...progress };
        const step = updatedProgress.steps.find(s => s.step_id === stepId);
        
        if (step) {
          let task = step.tasks.find(t => t.task_id === taskId);
          if (!task) {
            task = { task_id: taskId, completed: false, viewed: false };
            step.tasks.push(task);
          }
          
          task.completed = completed;
          task.viewed = viewed;
          
          // Check if step is complete and unlock next step
          const stepTasks = step.tasks;
          if (stepTasks.length > 0 && stepTasks.every(t => t.completed)) {
            const nextStep = updatedProgress.steps.find(s => s.step_id === stepId + 1);
            if (nextStep) {
              nextStep.unlocked = true;
            }
          }
        }
        
        setProgress(updatedProgress);
        localStorage.setItem('userProgress', JSON.stringify(updatedProgress));
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const getStepProgress = (stepId) => {
    if (!progress) return null;
    return progress.steps.find(s => s.step_id === stepId);
  };

  const getTaskProgress = (stepId, taskId) => {
    const step = getStepProgress(stepId);
    if (!step) return { completed: false, viewed: false };
    const task = step.tasks.find(t => t.task_id === taskId);
    return task || { completed: false, viewed: false };
  };

  const isStepUnlocked = (stepId) => {
    if (!progress) return stepId === 1;
    const step = getStepProgress(stepId);
    return step ? step.unlocked : false;
  };

  return {
    progress,
    loading,
    updateTaskProgress,
    getStepProgress,
    getTaskProgress,
    isStepUnlocked,
    refreshProgress: isAuthenticated ? loadProgressFromAPI : loadProgressFromLocalStorage
  };
};