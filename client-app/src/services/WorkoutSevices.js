import api from './api';

const WorkoutService = {
  getAllWorkouts: async () => {
    try {
      const response = await api.get('/api/Schedule');
      return response.data;
    } catch (error) {
      console.error('Error fetching workouts:', error);
      throw error;
    }
  },

  getWorkoutById: async (id) => {
    try {
      const response = await api.get(`/api/Admin/workouts/${id}`);
      if (response.status !== 200) {
        throw new Error('Failed to fetch workout details');
      } 
      return response.data;
    } catch (error) {
      console.error('Error fetching workout:', error);
      throw error;
    }
  },

  createWorkout: async (workoutData) => {
    try {
      const response = await api.post('api/Workout', workoutData);
      return response.data;
    } catch (error) {
      console.error('Error creating workout:', error);
      throw error;
    }
  },

  updateWorkout: async (id, workoutData) => {
    try {
      const response = await api.put(`/api/Workout/${id}`, workoutData);
      return response.data;
    } catch (error) {
      console.error('Error updating workout:', error);
      throw error;
    }
  },
  addParticipantToWorkout: async (workoutId, participantId, shoeSize, cardType, usesOwnShoes) => {
    const response = await api.post(`/api/Admin/${participantId}/participants`, {
      workoutId,
      shoeSize,
      cardType,
      usesOwnShoes,
      participantId,
    });
    return response.data;
  },

  removeParticipantFromWorkout: async (workoutId, participantId) => {
    const response = await api.delete(`/api/workouts/${workoutId}/participants/${participantId}`);
    return response.data;
  },
  deleteWorkout: async (id) => {
    try {
      const response = await api.delete(`api/Workout/delete-workout/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting workout:', error);
      throw error;
    }
  }
};

export default WorkoutService;