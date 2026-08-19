/**
 * Input validation helpers for user authentication, property listings, and contact info.
 */

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

export function isValidIndianMobile(mobile: string): boolean {
  const cleaned = mobile.replace(/\D/g, "");
  // Accept 10 digits starting with 6, 7, 8, 9 or 12 digits with 91 prefix
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return /^[6-9]\d{9}$/.test(cleaned.slice(2));
  }
  return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
}

export function isValidPincode(pincode: string): boolean {
  const cleaned = pincode.replace(/\D/g, "");
  return cleaned.length === 6 && /^[1-9]\d{5}$/.test(cleaned);
}

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters long." };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { isValid: false, message: "Password must contain both letters and numbers." };
  }
  return { isValid: true };
}

export function isValidPrice(price: number | string): boolean {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return !isNaN(num) && num > 0 && num <= 1000000000;
}

export function isValidArea(sqft: number | string): boolean {
  const num = typeof sqft === "string" ? parseFloat(sqft) : sqft;
  return !isNaN(num) && num >= 50 && num <= 500000;
}

export function isValidOTP(otp: string): boolean {
  const cleaned = otp.trim();
  return cleaned.length === 6 && /^\d{6}$/.test(cleaned);
}
