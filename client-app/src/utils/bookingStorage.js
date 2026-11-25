const BOOKING_PREFS_KEY = 'jwj_booking_prefs_v2';
const LEGACY_BOOKING_PREFS_KEY = 'jwj_booking_prefs_v1';
const MY_BOOKINGS_KEY = 'jwj_my_bookings_v1';
const BOOKING_RETENTION_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

const DEFAULT_PREFS = {
  fullName: '',
  email: '',
  phoneNumber: '',
  shoeSize: '',
  usesOwnShoes: false,
};

export const loadBookingPreferences = () => {
  try {
    const raw =
      window.localStorage.getItem(BOOKING_PREFS_KEY) ||
      window.localStorage.getItem(LEGACY_BOOKING_PREFS_KEY);
    if (!raw) {
      return { ...DEFAULT_PREFS };
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_PREFS };
    }

    const shoeSize = ['S', 'M', 'L', 'XL'].includes(parsed.shoeSize)
      ? parsed.shoeSize
      : '';

    return {
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      phoneNumber: typeof parsed.phoneNumber === 'string' ? parsed.phoneNumber : '',
      shoeSize,
      usesOwnShoes: Boolean(parsed.usesOwnShoes),
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

export const saveBookingPreferences = ({ fullName, email, phoneNumber, shoeSize, usesOwnShoes }) => {
  try {
    const existing = loadBookingPreferences();
    const payload = {
      fullName: typeof fullName === 'string' ? fullName.trim() : existing.fullName,
      email: typeof email === 'string' ? email.trim() : existing.email,
      phoneNumber: typeof phoneNumber === 'string' ? phoneNumber.trim() : existing.phoneNumber,
      shoeSize: ['S', 'M', 'L', 'XL'].includes(shoeSize) ? shoeSize : existing.shoeSize,
      usesOwnShoes: Boolean(usesOwnShoes),
    };
    window.localStorage.setItem(BOOKING_PREFS_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or privacy mode errors
  }
};

export const loadMyBookings = () => {
  try {
    const raw = window.localStorage.getItem(MY_BOOKINGS_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    const now = Date.now();
    const cleaned = {};
    let changed = false;

    Object.entries(parsed).forEach(([workoutId, entry]) => {
      if (
        entry &&
        typeof entry.token === 'string' &&
        entry.token.trim() &&
        (!entry.bookedAt || now - Number(entry.bookedAt) < BOOKING_RETENTION_MS)
      ) {
        cleaned[workoutId] = {
          token: entry.token.trim(),
          bookedAt: entry.bookedAt || now,
        };
      } else {
        changed = true;
      }
    });

    if (changed) {
      window.localStorage.setItem(MY_BOOKINGS_KEY, JSON.stringify(cleaned));
    }

    return cleaned;
  } catch {
    return {};
  }
};

export const saveMyBooking = (workoutId, token) => {
  if (!workoutId || !token) return;
  try {
    const current = loadMyBookings();
    current[workoutId] = {
      token: String(token).trim(),
      bookedAt: Date.now(),
    };
    window.localStorage.setItem(MY_BOOKINGS_KEY, JSON.stringify(current));
  } catch {
    // Ignore storage quota or privacy mode errors
  }
};

export const removeMyBooking = (workoutId) => {
  if (!workoutId) return;
  try {
    const current = loadMyBookings();
    if (Object.prototype.hasOwnProperty.call(current, workoutId)) {
      delete current[workoutId];
      window.localStorage.setItem(MY_BOOKINGS_KEY, JSON.stringify(current));
    }
  } catch {
    // Ignore storage errors
  }
};

export const removeMyBookingByToken = (token) => {
  if (!token) return;
  try {
    const normalized = String(token).trim();
    const current = loadMyBookings();
    let changed = false;

    Object.keys(current).forEach((workoutId) => {
      if (current[workoutId]?.token === normalized) {
        delete current[workoutId];
        changed = true;
      }
    });

    if (changed) {
      window.localStorage.setItem(MY_BOOKINGS_KEY, JSON.stringify(current));
    }
  } catch {
    // Ignore storage errors
  }
};
