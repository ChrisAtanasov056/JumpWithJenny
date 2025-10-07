import api from './api';

const WorkoutService = {
   getAllWorkouts: async () => {
    try {
      const response = await api.get('/api/Schedule');
      console.log('Fetched workouts:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching workouts:', error);
      throw error;
    }
  },

  getAllWorkouts: async () => {
    try {
      const response = await api.get('/api/workouts/all');
      console.log('Fetched workouts:', response.data);
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
  addParticipantToWorkout: async (workoutId, userId, shoeSize, cardType, usesOwnShoes) => {
    const response = await api.post(`/api/Admin/add/participant`, {
      workoutId,
      userId,
      shoeSize,
      cardType,
      usesOwnShoes,
    });
    return response.data;
  },

  removeParticipantFromWorkout: async (workoutId, participantId) => {
    const response = await api.delete('/api/admin/remove/participant', {
      params: {
        workoutId,
        userId: participantId,
      },
    });
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
  },
  async searchUsers(query) {
    try {
      const response = await api.get(`/api/users/search`, {
        params: { query },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  },
};


export default WorkoutService;