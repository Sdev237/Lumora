/**
 * Age Verification Service
 * Placeholder for future external age/ID verification integrations.
 * No biometric data is stored; only verification status and confidence.
 */

/**
 * Evaluate age based on declared date of birth.
 * Returns whether the user passes the minimum age requirement.
 */
exports.evaluateDeclaredAge = (dateOfBirth, minimumAge) => {
  if (!dateOfBirth) {
    return { isOfAge: false, age: null };
  }

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) {
    return { isOfAge: false, age: null };
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return {
    isOfAge: age >= minimumAge,
    age,
  };
};

/**
 * Placeholder for external AI/ID age verification.
 * Implementations should never store biometric images, only metadata:
 * - ageVerified
 * - verificationMethod
 * - verificationConfidence
 */
exports.verifyAgeWithExternalProvider = async (_userId, _context = {}) => {
  // Example response shape – replace with real provider integration later.
  return {
    ageVerified: false,
    verificationMethod: "none",
    verificationConfidence: 0,
  };
};

