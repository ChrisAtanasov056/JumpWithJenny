const BOOKING_PREFS_KEY = 'jwj_booking_prefs_v1';

const DEFAULT_PREFS = {
  fullName: '',
  email: '',
  shoeSize: '',
  usesOwnShoes: false,
  cardType: '3',
};

export const loadBookingPreferences = () => {
  try {
    const raw = window.localStorage.getItem(BOOKING_PREFS_KEY);
    if (!raw) {
      return { ...DEFAULT_PREFS };
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { ...DEFAULT_PREFS };
    }

    const cardType = ['1', '2', '3'].includes(String(parsed.cardType))
      ? String(parsed.cardType)
      : '3';
    const shoeSize = ['S', 'M', 'L', 'XL'].includes(parsed.shoeSize)
      ? parsed.shoeSize
      : '';

    return {
      fullName: typeof parsed.fullName === 'string' ? parsed.fullName : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      shoeSize,
      usesOwnShoes: Boolean(parsed.usesOwnShoes),
      cardType,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

export const saveBookingPreferences = ({ fullName, email, shoeSize, usesOwnShoes, cardType }) => {
  try {
    const existing = loadBookingPreferences();
    const payload = {
      fullName: typeof fullName === 'string' ? fullName.trim() : existing.fullName,
      email: typeof email === 'string' ? email.trim() : existing.email,
      shoeSize: ['S', 'M', 'L', 'XL'].includes(shoeSize) ? shoeSize : existing.shoeSize,
      usesOwnShoes: Boolean(usesOwnShoes),
      cardType: ['1', '2', '3'].includes(String(cardType)) ? String(cardType) : '3',
    };
    window.localStorage.setItem(BOOKING_PREFS_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or privacy mode errors
  }
};
