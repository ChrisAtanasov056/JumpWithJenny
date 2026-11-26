import api from '../api/axius';

const WorkoutService = {
  getAllWorkouts: async ({ upcomingOnly, search, status } = {}) => {
    const params = {
      ...(typeof upcomingOnly === 'boolean' ? { upcomingOnly } : {}),
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    };
    const response = await api.get('/api/workouts/all', { params });
    return response.data;
  },

  getWorkoutsPaged: async ({ page = 1, pageSize = 20, upcomingOnly, search, status } = {}) => {
    const params = {
      page,
      pageSize,
      ...(typeof upcomingOnly === 'boolean' ? { upcomingOnly } : {}),
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
    };
    const response = await api.get('/api/Workout', { params });
    return response.data;
  },

  getWorkoutById: async (id) => {
    const response = await api.get(`/api/Admin/workouts/${id}`);
    if (response.status !== 200) {
      throw new Error('Failed to fetch workout details');
    }
    return response.data;
  },

  getWorkoutParticipants: async (id) => {
    const response = await api.get(`/api/Admin/workouts/${id}/participants`);
    return response.data;
  },

  createWorkout: async (workoutData) => {
    const response = await api.post('/api/Workout', workoutData);
    return response.data;
  },

  updateWorkout: async (id, workoutData) => {
    const response = await api.put(`/api/Workout/${id}`, workoutData);
    return response.data;
  },

  duplicateWorkout: async (id, payload = { daysOffset: 7 }) => {
    const response = await api.post(`/api/Workout/${id}/duplicate`, payload);
    return response.data;
  },

  createWorkoutsBatch: async (payload) => {
    const response = await api.post('/api/Workout/batch', payload);
    return response.data;
  },

  deleteWorkout: async (id) => {
    const response = await api.delete(`/api/Workout/delete-workout/${id}`);
    return response.data;
  },

  addParticipantToWorkout: async (
    workoutId,
    {
      fullName,
      email,
      phoneNumber,
      shoeSize,
      usesOwnShoes,
      sendConfirmationEmail = false,
      allowOverbooking = false,
      language = 'bg',
    }
  ) => {
    const response = await api.post('/api/Admin/add/participant', {
      WorkoutId: workoutId,
      FullName: fullName,
      Email: email || null,
      PhoneNumber: phoneNumber,
      ShoeSize: usesOwnShoes ? null : shoeSize,
      UsesOwnShoes: Boolean(usesOwnShoes),
      SendConfirmationEmail: Boolean(sendConfirmationEmail),
      AllowOverbooking: Boolean(allowOverbooking),
      Language: language,
    });
    return response.data;
  },

  updateParticipant: async (
    appointmentId,
    { fullName, email, phoneNumber, shoeSize, usesOwnShoes }
  ) => {
    const response = await api.put(`/api/Admin/participants/${appointmentId}`, {
      FullName: fullName,
      Email: email || null,
      PhoneNumber: phoneNumber,
      ShoeSize: usesOwnShoes ? null : shoeSize,
      UsesOwnShoes: Boolean(usesOwnShoes),
    });
    return response.data;
  },

  setParticipantAttendance: async (appointmentId, isAttended) => {
    const response = await api.patch(`/api/Admin/participants/${appointmentId}/attendance`, {
      IsAttended: Boolean(isAttended),
    });
    return response.data;
  },

  removeParticipantFromWorkout: async (appointmentId) => {
    const response = await api.delete('/api/Admin/remove/participant', {
      params: { appointmentId },
    });
    return response.data;
  },

  getDashboard: async () => {
    const response = await api.get('/api/Admin/dashboard');
    return response.data;
  },

  getClients: async ({ page = 1, pageSize = 25, search, sortBy = 'lastVisit' } = {}) => {
    const params = {
      page,
      pageSize,
      sortBy,
      ...(search ? { search } : {}),
    };
    const response = await api.get('/api/Admin/clients', { params });
    return response.data;
  },

  autocompleteClients: async (query) => {
    if (!query || !query.trim()) {
      return [];
    }
    const response = await api.get('/api/Admin/clients/autocomplete', {
      params: { query: query.trim() },
    });
    return response.data;
  },
};

export default WorkoutService;
