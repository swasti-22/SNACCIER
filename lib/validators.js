// lib/validators.js

/**
 * Validates whether an email belongs to the official CHARUSAT university mail server.
 * Supports @charusat.edu.in, @charusat.ac.in, and any institutional subdomains (@*.charusat.edu.in / @*.charusat.ac.in).
 */
export const isCharusatEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  return /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)*charusat\.(edu|ac)\.in$/i.test(trimmed);
};

export const CHARUSAT_EMAIL_ERROR = 
  "Access Restricted: Only official CHARUSAT university email IDs (@charusat.edu.in or @charusat.ac.in) are allowed to sign up or log in.";
